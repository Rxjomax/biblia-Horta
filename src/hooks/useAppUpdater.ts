import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  APP_UPDATE_CHECK_THROTTLE_MS,
  APP_UPDATE_POLL_INTERVAL_MS,
  formatBuildLabel,
  hasNewerBuild,
  isEditableElementDescriptor,
  parseVersionManifest,
  shouldAutoReloadForBuild,
  shouldPreserveCacheName,
} from '../utils/appUpdater';

const STORAGE_LAST_BUILD_KEY = 'iebhorta_last_update_build';
const STORAGE_LAST_AT_KEY = 'iebhorta_last_update_at';

export type UpdateStatusTone = 'idle' | 'info' | 'success' | 'error';

export interface AppUpdaterState {
  currentBuildId: string;
  currentBuildLabel: string;
  currentBuildTime: string;
  availableBuildId: string | null;
  updateAvailable: boolean;
  isChecking: boolean;
  isUpdating: boolean;
  statusMessage: string;
  statusTone: UpdateStatusTone;
  lastCheckedAt: number | null;
  dismissedBanner: boolean;
}

const CURRENT_BUILD_ID =
  typeof __APP_BUILD_ID__ === 'string' && __APP_BUILD_ID__.trim()
    ? __APP_BUILD_ID__.trim()
    : 'dev';

const CURRENT_BUILD_TIME =
  typeof __APP_BUILD_TIME__ === 'string' ? __APP_BUILD_TIME__ : '';

let state: AppUpdaterState = {
  currentBuildId: CURRENT_BUILD_ID,
  currentBuildLabel: formatBuildLabel(CURRENT_BUILD_ID),
  currentBuildTime: CURRENT_BUILD_TIME,
  availableBuildId: null,
  updateAvailable: false,
  isChecking: false,
  isUpdating: false,
  statusMessage: '',
  statusTone: 'idle',
  lastCheckedAt: null,
  dismissedBanner: false,
};

const listeners = new Set<() => void>();
let initialized = false;
let swRegistration: ServiceWorkerRegistration | null = null;
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let lastAutoCheckAt = 0;
let reloadInProgress = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<AppUpdaterState>) {
  state = { ...state, ...patch };
  emit();
}

function isUserCurrentlyEditing(): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  return isEditableElementDescriptor(active.tagName, Boolean(active.isContentEditable));
}

function readLastReloadGuard(): { buildId: string | null; at: number | null } {
  if (typeof window === 'undefined') return { buildId: null, at: null };
  try {
    const buildId = window.sessionStorage.getItem(STORAGE_LAST_BUILD_KEY);
    const rawAt = window.sessionStorage.getItem(STORAGE_LAST_AT_KEY);
    const at = rawAt ? Number(rawAt) : null;
    return { buildId, at: Number.isFinite(at) ? at : null };
  } catch {
    return { buildId: null, at: null };
  }
}

function writeLastReloadGuard(buildId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_LAST_BUILD_KEY, buildId);
    window.sessionStorage.setItem(STORAGE_LAST_AT_KEY, String(Date.now()));
  } catch {
    // Ignore restricted storage contexts
  }
}

async function clearStaleAppShellCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const names = await window.caches.keys();
    await Promise.all(
      names
        .filter((name) => !shouldPreserveCacheName(name))
        .map((name) => window.caches.delete(name))
    );
  } catch {
    // Best-effort cleanup
  }
}

async function fetchRemoteVersionManifest(): Promise<{ buildId: string; builtAt: string } | null> {
  if (typeof window === 'undefined' || !window.navigator.onLine) return null;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return parseVersionManifest(json);
  } catch {
    return null;
  }
}

export async function applyAppUpdate(options?: {
  targetBuildId?: string | null;
  clearAppShellCache?: boolean;
}): Promise<void> {
  if (typeof window === 'undefined' || reloadInProgress) return;
  reloadInProgress = true;

  const targetBuild = options?.targetBuildId || state.availableBuildId || 'sw-refresh';
  writeLastReloadGuard(targetBuild);

  setState({
    isUpdating: true,
    updateAvailable: true,
    dismissedBanner: false,
    statusMessage: 'A aplicar a versão mais recente da IEB Horta...',
    statusTone: 'info',
  });

  try {
    if (options?.clearAppShellCache !== false) {
      await clearStaleAppShellCaches();
    }

    if (swRegistration) {
      try {
        await swRegistration.update();
      } catch {
        // Ignore network hiccup during update trigger
      }
      if (swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    if (updateSWFn) {
      await updateSWFn(true);
    }
  } catch {
    // Fall through to hard reload
  }

  window.setTimeout(() => {
    window.location.reload();
  }, 150);
}

function handleDetectedUpdate(remoteBuildId: string | null, forceManual = false) {
  const targetBuildId = remoteBuildId || 'sw-update';

  if (forceManual) {
    void applyAppUpdate({ targetBuildId, clearAppShellCache: true });
    return;
  }

  const guard = readLastReloadGuard();
  const decision = shouldAutoReloadForBuild({
    currentBuildId: CURRENT_BUILD_ID,
    remoteBuildId: targetBuildId,
    lastReloadedBuildId: guard.buildId,
    lastReloadedAt: guard.at,
    now: Date.now(),
    isUserEditing: isUserCurrentlyEditing(),
  });

  if (decision.shouldReload) {
    void applyAppUpdate({ targetBuildId, clearAppShellCache: true });
    return;
  }

  if (decision.reason === 'user-editing' || decision.reason === 'cooldown-guard') {
    setState({
      availableBuildId: remoteBuildId,
      updateAvailable: true,
      dismissedBanner: false,
      statusMessage: 'Nova versão da IEB Horta pronta. Toque em «Atualizar agora» quando terminar.',
      statusTone: 'info',
    });
  }
}

export async function checkForAppUpdates(options?: { manual?: boolean }): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const manual = Boolean(options?.manual);
  const now = Date.now();

  if (!manual && now - lastAutoCheckAt < APP_UPDATE_CHECK_THROTTLE_MS) {
    return state.updateAvailable;
  }
  lastAutoCheckAt = now;

  if (!window.navigator.onLine) {
    if (manual) {
      setState({
        isChecking: false,
        statusMessage: 'Sem ligação à internet para verificar atualizações agora.',
        statusTone: 'error',
      });
    }
    return false;
  }

  if (manual) {
    setState({
      isChecking: true,
      statusMessage: 'A verificar se há uma nova versão...',
      statusTone: 'info',
    });
  }

  let foundUpdate = false;
  let detectedBuildId: string | null = null;

  try {
    const [remoteManifest] = await Promise.all([
      fetchRemoteVersionManifest(),
      swRegistration ? swRegistration.update().catch(() => undefined) : Promise.resolve(),
    ]);

    if (remoteManifest && hasNewerBuild(CURRENT_BUILD_ID, remoteManifest.buildId)) {
      foundUpdate = true;
      detectedBuildId = remoteManifest.buildId;
    }

    if (!foundUpdate && swRegistration?.waiting) {
      foundUpdate = true;
      detectedBuildId = remoteManifest?.buildId ?? 'sw-waiting';
    }

    setState({
      isChecking: false,
      lastCheckedAt: Date.now(),
      availableBuildId: detectedBuildId,
      updateAvailable: foundUpdate,
    });

    if (foundUpdate) {
      handleDetectedUpdate(detectedBuildId, manual);
      return true;
    }

    if (manual) {
      setState({
        statusMessage: 'A sua aplicação já está na versão mais recente. Não precisa de desinstalar.',
        statusTone: 'success',
      });
    }
    return false;
  } catch {
    if (manual) {
      setState({
        isChecking: false,
        statusMessage: 'Não foi possível verificar atualizações neste momento. Tente novamente em breve.',
        statusTone: 'error',
      });
    }
    return false;
  }
}

export function dismissUpdateBanner(): void {
  setState({ dismissedBanner: true });
}

export function initAppUpdater(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  let hadController = Boolean(
    'serviceWorker' in navigator && navigator.serviceWorker.controller
  );

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (reloadInProgress) return;
      if (isUserCurrentlyEditing()) {
        setState({
          updateAvailable: true,
          dismissedBanner: false,
          statusMessage: 'Nova versão da IEB Horta pronta. Toque em «Atualizar agora» quando terminar.',
          statusTone: 'info',
        });
        return;
      }
      const guard = readLastReloadGuard();
      const now = Date.now();
      if (guard.buildId === 'sw-controller' && guard.at && now - guard.at < 60_000) {
        return;
      }
      reloadInProgress = true;
      writeLastReloadGuard('sw-controller');
      window.location.reload();
    });
  }

  try {
    updateSWFn = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        swRegistration = registration;

        // Check for a fresh SW right away on launch
        void registration.update().catch(() => undefined);

        // If a new SW installs while app is open, surface/apply cleanly
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              handleDetectedUpdate('sw-installed', false);
            }
          });
        });
      },
      onNeedRefresh() {
        handleDetectedUpdate('sw-need-refresh', false);
      },
    });
  } catch {
    // Graceful degradation if SW registration is unavailable
  }

  // Trigger silent version check shortly after initial render
  window.setTimeout(() => {
    void checkForAppUpdates({ manual: false });
  }, 1500);

  // Check whenever user resumes the installed PWA on Android or iOS
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkForAppUpdates({ manual: false });
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      void checkForAppUpdates({ manual: false });
    }
  });

  window.addEventListener('focus', () => {
    void checkForAppUpdates({ manual: false });
  });

  window.addEventListener('online', () => {
    void checkForAppUpdates({ manual: false });
  });

  // Periodic background poll while the app remains open
  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void checkForAppUpdates({ manual: false });
    }
  }, APP_UPDATE_POLL_INTERVAL_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useAppUpdater() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    checkForUpdates: checkForAppUpdates,
    applyUpdate: applyAppUpdate,
    dismissBanner: dismissUpdateBanner,
  };
}
