import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCIAL_QR_MESSAGES,
  SOCIAL_QR_THEMES,
  SOCIAL_QR_URL,
  buildSocialCaption,
  getNextMessagePreset,
} from './socialQrPresets';

test('uses exact official Vercel URL for IEB Horta', () => {
  assert.equal(SOCIAL_QR_URL, 'https://biblia-horta.vercel.app/');
});

test('provides 6 distinct message presets with unique ids and headlines', () => {
  assert.equal(SOCIAL_QR_MESSAGES.length, 6);
  const ids = new Set(SOCIAL_QR_MESSAGES.map((m) => m.id));
  const headlines = new Set(SOCIAL_QR_MESSAGES.map((m) => m.headline));
  assert.equal(ids.size, SOCIAL_QR_MESSAGES.length);
  assert.equal(headlines.size, SOCIAL_QR_MESSAGES.length);
});

test('rotates through message presets cleanly', () => {
  const first = SOCIAL_QR_MESSAGES[0];
  const second = getNextMessagePreset(first.id);
  assert.equal(second.id, SOCIAL_QR_MESSAGES[1].id);

  const last = SOCIAL_QR_MESSAGES[SOCIAL_QR_MESSAGES.length - 1];
  const wrapped = getNextMessagePreset(last.id);
  assert.equal(wrapped.id, first.id);
});

test('buildSocialCaption includes headline, body, and exact official URL', () => {
  const caption = buildSocialCaption(
    'A Palavra no teu bolso, todos os dias.',
    'Bíblia completa em 7 traduções.'
  );
  assert.ok(caption.includes('A Palavra no teu bolso, todos os dias.'));
  assert.ok(caption.includes('Bíblia completa em 7 traduções.'));
  assert.ok(caption.includes('https://biblia-horta.vercel.app/'));
  assert.ok(caption.includes('@iebhorta'));
});

test('provides at least 4 distinct visual themes', () => {
  assert.ok(SOCIAL_QR_THEMES.length >= 4);
});
