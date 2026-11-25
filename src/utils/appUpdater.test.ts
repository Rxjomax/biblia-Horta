import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBuildLabel,
  hasNewerBuild,
  isEditableElementDescriptor,
  parseVersionManifest,
  shouldAutoReloadForBuild,
  shouldPreserveCacheName,
} from './appUpdater';

test('parseVersionManifest parses valid manifest and rejects malformed payloads', () => {
  assert.deepEqual(
    parseVersionManifest({ buildId: 'a1b2c3d4', builtAt: '2026-11-25T10:00:00.000Z' }),
    { buildId: 'a1b2c3d4', builtAt: '2026-11-25T10:00:00.000Z' }
  );
  assert.equal(parseVersionManifest(null), null);
  assert.equal(parseVersionManifest({}), null);
  assert.equal(parseVersionManifest({ buildId: '   ' }), null);
});

test('hasNewerBuild detects real build changes while ignoring dev or matching IDs', () => {
  assert.equal(hasNewerBuild('abc12345', 'def67890'), true);
  assert.equal(hasNewerBuild('abc12345', 'abc12345'), false);
  assert.equal(hasNewerBuild('dev', 'def67890'), false);
  assert.equal(hasNewerBuild('abc12345', ''), false);
});

test('shouldAutoReloadForBuild allows reload on new build and guards against loops or mid-typing interruption', () => {
  const now = 1_000_000;

  assert.deepEqual(
    shouldAutoReloadForBuild({
      currentBuildId: 'v1',
      remoteBuildId: 'v2',
      lastReloadedBuildId: null,
      lastReloadedAt: null,
      now,
      isUserEditing: false,
    }),
    { shouldReload: true, reason: 'reload' }
  );

  // User actively typing -> defer to non-intrusive banner
  assert.deepEqual(
    shouldAutoReloadForBuild({
      currentBuildId: 'v1',
      remoteBuildId: 'v2',
      lastReloadedBuildId: null,
      lastReloadedAt: null,
      now,
      isUserEditing: true,
    }),
    { shouldReload: false, reason: 'user-editing' }
  );

  // Same build reloaded 10 seconds ago -> stop reload loop
  assert.deepEqual(
    shouldAutoReloadForBuild({
      currentBuildId: 'v1',
      remoteBuildId: 'v2',
      lastReloadedBuildId: 'v2',
      lastReloadedAt: now - 10_000,
      now,
      isUserEditing: false,
    }),
    { shouldReload: false, reason: 'cooldown-guard' }
  );

  // Newer v3 arrives within cooldown of v2 -> allowed to reload
  assert.deepEqual(
    shouldAutoReloadForBuild({
      currentBuildId: 'v1',
      remoteBuildId: 'v3',
      lastReloadedBuildId: 'v2',
      lastReloadedAt: now - 10_000,
      now,
      isUserEditing: false,
    }),
    { shouldReload: true, reason: 'reload' }
  );

  // After cooldown expires -> allowed again
  assert.deepEqual(
    shouldAutoReloadForBuild({
      currentBuildId: 'v1',
      remoteBuildId: 'v2',
      lastReloadedBuildId: 'v2',
      lastReloadedAt: now - 70_000,
      now,
      isUserEditing: false,
    }),
    { shouldReload: true, reason: 'reload' }
  );
});

test('shouldPreserveCacheName protects offline Bibles and fonts while clearing stale app-shell caches', () => {
  assert.equal(shouldPreserveCacheName('iebhorta-bibles-cache'), true);
  assert.equal(shouldPreserveCacheName('google-fonts-cache'), true);
  assert.equal(shouldPreserveCacheName('gstatic-fonts-cache'), true);
  assert.equal(shouldPreserveCacheName('workbox-precache-v2-https://biblia-horta.vercel.app/'), false);
  assert.equal(shouldPreserveCacheName('app-shell-v1'), false);
});

test('isEditableElementDescriptor detects text inputs and contentEditable surfaces', () => {
  assert.equal(isEditableElementDescriptor('TEXTAREA', false), true);
  assert.equal(isEditableElementDescriptor('input', false), true);
  assert.equal(isEditableElementDescriptor('DIV', true), true);
  assert.equal(isEditableElementDescriptor('BUTTON', false), false);
  assert.equal(isEditableElementDescriptor('BODY', false), false);
});

test('formatBuildLabel trims build identifiers concisely', () => {
  assert.equal(formatBuildLabel('20261125104530'), '2026112510');
  assert.equal(formatBuildLabel('a1b2c3d4'), 'a1b2c3d4');
  assert.equal(formatBuildLabel(''), 'atual');
});
