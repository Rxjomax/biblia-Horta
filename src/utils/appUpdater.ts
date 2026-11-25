export const APP_UPDATE_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const APP_UPDATE_CHECK_THROTTLE_MS = 15 * 1000; // 15 seconds between automatic resume checks
export const APP_UPDATE_RELOAD_COOLDOWN_MS = 60 * 1000; // 60 seconds anti-reload-loop guard

export interface VersionManifest {
  buildId: string;
  builtAt: string;
}

export interface AutoReloadDecisionInput {
  currentBuildId: string;
  remoteBuildId: string | null | undefined;
  lastReloadedBuildId: string | null | undefined;
  lastReloadedAt: number | null | undefined;
  now: number;
  isUserEditing: boolean;
  cooldownMs?: number;
}

export type AutoReloadDecisionReason =
  | 'reload'
  | 'same-build'
  | 'cooldown-guard'
  | 'user-editing';

export interface AutoReloadDecision {
  shouldReload: boolean;
  reason: AutoReloadDecisionReason;
}

const PRESERVED_CACHE_PREFIXES = [
  'iebhorta-bibles-cache',
  'google-fonts-cache',
  'gstatic-fonts-cache',
];

export function parseVersionManifest(data: unknown): VersionManifest | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const buildId = typeof record.buildId === 'string' ? record.buildId.trim() : '';
  const builtAt = typeof record.builtAt === 'string' ? record.builtAt.trim() : '';
  if (!buildId) return null;
  return { buildId, builtAt };
}

export function hasNewerBuild(
  currentBuildId: string,
  remoteBuildId: string | null | undefined
): boolean {
  const current = currentBuildId.trim();
  const remote = (remoteBuildId ?? '').trim();
  if (!current || !remote) return false;
  if (current === 'dev' || remote === 'dev') return false;
  return current !== remote;
}

export function shouldAutoReloadForBuild(
  input: AutoReloadDecisionInput
): AutoReloadDecision {
  const cooldownMs = input.cooldownMs ?? APP_UPDATE_RELOAD_COOLDOWN_MS;
  const remote = (input.remoteBuildId ?? '').trim();

  if (!hasNewerBuild(input.currentBuildId, remote)) {
    return { shouldReload: false, reason: 'same-build' };
  }

  if (input.isUserEditing) {
    return { shouldReload: false, reason: 'user-editing' };
  }

  const lastBuild = (input.lastReloadedBuildId ?? '').trim();
  const lastAt = typeof input.lastReloadedAt === 'number' ? input.lastReloadedAt : 0;
  if (lastBuild && lastBuild === remote && lastAt > 0 && input.now - lastAt < cooldownMs) {
    return { shouldReload: false, reason: 'cooldown-guard' };
  }

  return { shouldReload: true, reason: 'reload' };
}

export function shouldPreserveCacheName(cacheName: string): boolean {
  const normalized = cacheName.trim().toLowerCase();
  if (!normalized) return false;
  return PRESERVED_CACHE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`)
  );
}

export function isEditableElementDescriptor(
  tagName: string | null | undefined,
  isContentEditable: boolean
): boolean {
  if (isContentEditable) return true;
  const tag = (tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function formatBuildLabel(buildId: string): string {
  const clean = buildId.trim();
  if (!clean) return 'atual';
  return clean.length > 10 ? clean.slice(0, 10) : clean;
}
