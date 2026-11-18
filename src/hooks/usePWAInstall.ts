import { useSyncExternalStore } from 'react';
import { loadBibleVersion } from '../services/bibleLoader';
import type { BibleVersionId } from '../types';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const OFFLINE_BIBLE_CACHE = 'iebhorta-bibles-cache';
const KNOWN_VERSIONS: BibleVersionId[] = ['ARC', 'ARA', 'NVI', 'OL', 'A21', 'NAA', 'NTLH'];

interface PWAStoreState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInIframe: boolean;
  swReady: boolean;
  offlineVersions: BibleVersionId[];
  downloadingVersion: BibleVersionId | null;
  offlineStatusMessage: string;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isInIframe: false };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }
  return { isIOS, isAndroid, isInIframe };
}

const platform = detectPlatform();

let state: PWAStoreState = {
  deferredPrompt: null,
  isInstalled: detectStandalone(),
  isIOS: platform.isIOS,
  isAndroid: platform.isAndroid,
  isInIframe: platform.isInIframe,
  swReady: false,
  offlineVersions: [],
  downloadingVersion: null,
  offlineStatusMessage: '',
};

const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<PWAStoreState>) {
  state = { ...state, ...patch };
  emit();
}

export async function refreshOfflineBibleVersions(): Promise<BibleVersionId[]> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return state.offlineVersions;
  }
  try {
    const cacheNames = await window.caches.keys();
    const found = new Set<BibleVersionId>();
    for (const name of cacheNames) {
      if (name === OFFLINE_BIBLE_CACHE || name.includes('workbox') || name.includes('bible')) {
        const cache = await window.caches.open(name);
        const requests = await cache.keys();
        for (const req of requests) {
          for (const ver of KNOWN_VERSIONS) {
            if (req.url.includes(`/bibles/${ver}.json`)) {
              found.add(ver);
            }
          }
        }
      }
    }
    const list = KNOWN_VERSIONS.filter((v) => found.has(v));
    setState({ offlineVersions: list });
    return list;
  } catch {
    return state.offlineVersions;
  }
}

export function initPWAListeners(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const updateStandalone = () => {
    setState({ isInstalled: detectStandalone() });
  };
  mediaQuery.addEventListener?.('change', updateStandalone);

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    setState({ deferredPrompt: e as BeforeInstallPromptEvent });
  });

  window.addEventListener('appinstalled', () => {
    setState({
      isInstalled: true,
      deferredPrompt: null,
      offlineStatusMessage: 'Aplicação instalada no dispositivo com sucesso.',
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(() => {
        setState({ swReady: true });
        void refreshOfflineBibleVersions();
      })
      .catch(() => {
        // Service worker unavailable
      });
  }

  void refreshOfflineBibleVersions();
}

initPWAListeners();

export async function installPWA(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const promptEvent = state.deferredPrompt;
  if (!promptEvent) return 'unavailable';
  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setState({
        isInstalled: true,
        deferredPrompt: null,
        offlineStatusMessage: 'Aplicação instalada com sucesso.',
      });
      return 'accepted';
    }
    return 'dismissed';
  } catch {
    return 'unavailable';
  }
}

export async function downloadBibleForOffline(
  version: BibleVersionId
): Promise<{ ok: boolean; sizeMB?: string }> {
  if (typeof window === 'undefined') return { ok: false };
  setState({ downloadingVersion: version, offlineStatusMessage: '' });

  try {
    const url = `/bibles/${version}.json`;
    const res = await fetch(url, { cache: 'reload' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const blob = await res.clone().blob();
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1).replace('.', ',');

    if ('caches' in window) {
      const cache = await window.caches.open(OFFLINE_BIBLE_CACHE);
      await cache.put(url, new Response(blob, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // Warm in-memory bible corpus as well
    await loadBibleVersion(version);
    await refreshOfflineBibleVersions();

    setState({
      downloadingVersion: null,
      offlineVersions: Array.from(new Set([...state.offlineVersions, version])),
      offlineStatusMessage: `Bíblia ${version} (${sizeMB} MB) descarregada e pronta para leitura offline.`,
    });

    return { ok: true, sizeMB };
  } catch {
    setState({
      downloadingVersion: null,
      offlineStatusMessage: `Não foi possível descarregar a versão ${version}. Verifique a ligação à internet.`,
    });
    return { ok: false };
  }
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

export function usePWAInstall() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    isInstallable: !!snapshot.deferredPrompt,
    isInstalled: snapshot.isInstalled,
    isIOS: snapshot.isIOS,
    isAndroid: snapshot.isAndroid,
    isInIframe: snapshot.isInIframe,
    swReady: snapshot.swReady,
    offlineVersions: snapshot.offlineVersions,
    downloadingVersion: snapshot.downloadingVersion,
    offlineStatusMessage: snapshot.offlineStatusMessage,
    install: installPWA,
    downloadBibleForOffline,
  };
}
