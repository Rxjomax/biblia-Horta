import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHARE_BACKGROUNDS,
  filterShareBackgrounds,
  normalizeShareText,
  suggestBackgroundForVerse,
} from './shareBackgrounds.ts';

test('SHARE_BACKGROUNDS has 18 curated presets (12 photos and 6 themes)', () => {
  assert.equal(SHARE_BACKGROUNDS.length, 18);
  const photos = SHARE_BACKGROUNDS.filter((p) => p.type === 'photo');
  const themes = SHARE_BACKGROUNDS.filter((p) => p.type === 'theme');
  assert.equal(photos.length, 12);
  assert.equal(themes.length, 6);

  for (const preset of SHARE_BACKGROUNDS) {
    assert.ok(preset.label.length <= 15, `Label too long: ${preset.label}`);
    assert.ok(preset.keywords.length >= 6, `Too few keywords for ${preset.id}`);
    if (preset.type === 'photo') {
      assert.ok(preset.imageUrl?.startsWith('/src/assets/images/'));
    }
  }
});

test('normalizeShareText strips accents and whitespace cleanly', () => {
  assert.equal(normalizeShareText('  Esperança e Pôr do Sol  '), 'esperanca e por do sol');
  assert.equal(normalizeShareText('Oração de Gratidão'), 'oracao de gratidao');
});

test('filterShareBackgrounds matches keywords accent-insensitively and filters categories', () => {
  assert.equal(filterShareBackgrounds('', 'all').length, 18);
  assert.equal(filterShareBackgrounds('', 'photo').length, 12);
  assert.equal(filterShareBackgrounds('', 'theme').length, 6);

  const farol = filterShareBackgrounds('farol', 'all');
  assert.equal(farol[0].id, 'farol-atlantico');

  const oracao = filterShareBackgrounds('oração', 'photo');
  assert.ok(oracao.some((item) => item.id === 'noite-estrelada' || item.id === 'escrituras'));

  const basalto = filterShareBackgrounds('basalto', 'theme');
  assert.equal(basalto.length, 1);
  assert.equal(basalto[0].id, 'basalto-vulcanico');
});

test('suggestBackgroundForVerse selects coherent themes from verse content', () => {
  const mountains = suggestBackgroundForVerse(
    'Levanto os meus olhos para os montes: de onde me virá o socorro?',
    'Salmos 121:1'
  );
  assert.equal(mountains.preset.id, 'luz-montanhas');

  const shepherd = suggestBackgroundForVerse(
    'O Senhor é o meu pastor; nada me faltará. Em verdes pastos me faz repousar.',
    'Salmos 23:1-2'
  );
  assert.equal(shepherd.preset.id, 'pastos-verdes');

  const peace = suggestBackgroundForVerse(
    'E a paz de Deus, que excede todo o entendimento, guardará o vosso coração.',
    'Filipenses 4:7'
  );
  assert.equal(peace.preset.id, 'por-do-sol');

  const night = suggestBackgroundForVerse(
    'Os céus proclamam a glória de Deus e as estrelas anunciam a obra das suas mãos.',
    'Salmos 19:1'
  );
  assert.equal(night.preset.id, 'noite-estrelada');
});
