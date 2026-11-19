import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHARE_BACKGROUNDS,
  filterShareBackgrounds,
  normalizeShareText,
  suggestBackgroundForVerse,
} from './shareBackgrounds.ts';

test('SHARE_BACKGROUNDS has 32 curated presets (26 photos and 6 themes)', () => {
  assert.equal(SHARE_BACKGROUNDS.length, 32);
  const photos = SHARE_BACKGROUNDS.filter((p) => p.type === 'photo');
  const themes = SHARE_BACKGROUNDS.filter((p) => p.type === 'theme');
  assert.equal(photos.length, 26);
  assert.equal(themes.length, 6);

  for (const preset of SHARE_BACKGROUNDS) {
    assert.ok(preset.label.length <= 16, `Label too long: ${preset.label}`);
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
  assert.equal(filterShareBackgrounds('', 'all').length, 32);
  assert.equal(filterShareBackgrounds('', 'photo').length, 26);
  assert.equal(filterShareBackgrounds('', 'theme').length, 6);

  const farol = filterShareBackgrounds('farol', 'all');
  assert.equal(farol[0].id, 'farol-atlantico');

  const cruz = filterShareBackgrounds('cruz', 'photo');
  assert.equal(cruz[0].id, 'cruz-amanhecer');
  assert.ok(cruz.some((p) => p.id === 'cruz-ocaso'));

  const videira = filterShareBackgrounds('videira', 'photo');
  assert.equal(videira[0].id, 'videira-verdadeira');

  const espirito = filterShareBackgrounds('espírito', 'photo');
  assert.equal(espirito[0].id, 'pomba-espirito');

  const deserto = filterShareBackgrounds('deserto', 'photo');
  assert.equal(deserto[0].id, 'deserto-estrelado');

  const ceia = filterShareBackgrounds('ceia', 'photo');
  assert.equal(ceia[0].id, 'mesa-comunhao');

  const seara = filterShareBackgrounds('seara', 'photo');
  assert.equal(seara[0].id, 'seara-dourada');

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

  const cross = suggestBackgroundForVerse(
    'Porque a palavra da cruz é loucura para os que perecem, mas poder de Deus para salvação em Cristo Jesus.',
    '1 Coríntios 1:18'
  );
  assert.equal(cross.preset.id, 'cruz-amanhecer');

  const wordCandle = suggestBackgroundForVerse(
    'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.',
    'Salmos 119:105'
  );
  assert.equal(wordCandle.preset.id, 'biblia-vela');

  const communion = suggestBackgroundForVerse(
    'Tomou o pão e o cálice da nova aliança, fazei isto em memória de mim.',
    '1 Coríntios 11:24'
  );
  assert.equal(communion.preset.id, 'mesa-comunhao');

  const vine = suggestBackgroundForVerse(
    'Eu sou a videira verdadeira, e meu Pai é o lavrador. Permanecei em mim para dar muito fruto.',
    'João 15:1-5'
  );
  assert.equal(vine.preset.id, 'videira-verdadeira');

  const spirit = suggestBackgroundForVerse(
    'Mas o Consolador, o Espírito Santo, desceu como pomba do céu sobre Ele.',
    'João 14:26'
  );
  assert.equal(spirit.preset.id, 'pomba-espirito');

  const waters = suggestBackgroundForVerse(
    'Guia-me mansamente a águas tranquilas e refrigera a minha alma junto ao ribeiro.',
    'Salmos 23:2-3'
  );
  assert.equal(waters.preset.id, 'aguas-tranquilas');

  const desert = suggestBackgroundForVerse(
    'Lembra-te de todo o caminho pelo qual o Senhor te guiou no deserto para provar a tua fidelidade.',
    'Deuteronómio 8:2'
  );
  assert.equal(desert.preset.id, 'deserto-estrelado');
});
