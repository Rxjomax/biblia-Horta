import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPtPtVoices,
  isPtPtVoice,
  selectPtPtVoice,
  splitTextIntoSpeechChunks,
  type VoiceDescriptor,
} from './speechVoice.ts';

test('strictly prefers pt-PT / pt_PT voices and rejects pt-BR voices', () => {
  const browserVoices: VoiceDescriptor[] = [
    { name: 'Google US English', lang: 'en-US', localService: false },
    { name: 'Google português do Brasil', lang: 'pt-BR', localService: false },
    { name: 'Luciana', lang: 'pt_BR', localService: true },
    { name: 'Microsoft Maria - Portuguese (Brazil)', lang: 'pt-BR', localService: true },
    { name: 'Joana', lang: 'pt_PT', localService: true },
    {
      name: 'Microsoft Raquel Online (Natural) - Portuguese (Portugal)',
      lang: 'pt-PT',
      localService: false,
    },
  ];

  const ptPtList = getPtPtVoices(browserVoices);
  assert.equal(ptPtList.length, 2);
  assert.equal(
    ptPtList[0].name,
    'Microsoft Raquel Online (Natural) - Portuguese (Portugal)'
  );
  assert.equal(ptPtList[1].name, 'Joana');

  const chosen = selectPtPtVoice(browserVoices);
  assert.equal(
    chosen?.name,
    'Microsoft Raquel Online (Natural) - Portuguese (Portugal)'
  );
});

test('never falls back to pt-BR when only Brazilian Portuguese voices exist', () => {
  const onlyBrazil: VoiceDescriptor[] = [
    { name: 'Google português do Brasil', lang: 'pt-BR', localService: false },
    { name: 'Microsoft Daniel - Portuguese (Brazil)', lang: 'pt-BR', localService: true },
    { name: 'Portuguese Brazil', lang: 'pt', localService: true },
  ];

  assert.equal(isPtPtVoice(onlyBrazil[0]), false);
  assert.equal(isPtPtVoice(onlyBrazil[2]), false);
  assert.equal(selectPtPtVoice(onlyBrazil), null);
});

test('splits long devotional paragraphs into bounded chunks without losing text', () => {
  const paragraph =
    'Quem vive numa ilha aprende depressa a ler os sinais do céu e do oceano. ' +
    'Há manhãs de neblina densa sobre o canal do Faial em que a linha do Pico desaparece por completo. ' +
    'O mesmo Deus que sustenta as ilhas no meio do Atlântico guarda a tua saída e a tua entrada nesta semana.';

  const chunks = splitTextIntoSpeechChunks(paragraph, 150);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 150, `Expected chunk <= 150 chars, got ${chunk.length}`);
  }
  assert.equal(chunks.join(' '), paragraph);
});
