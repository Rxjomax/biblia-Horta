import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BIBLE_STUDY_BOOK_QUICK_PROMPTS,
  BIBLE_STUDY_CHAPTER_QUICK_PROMPTS,
  BIBLE_STUDY_QUICK_PROMPTS,
  BIBLE_STUDY_TABS,
  buildFullChapterContextText,
  buildSurroundingContextText,
  formatBibleStudyCacheKey,
  formatBibleStudyReference,
  getBibleStudyQuickPrompts,
  getBibleStudyTabs,
  normalizeBibleStudyAnalysis,
  normalizeTextSelectionExcerpt,
  parseInlineMarkdownSegments,
  parseStudyMarkdownBlocks,
} from './bibleStudy';

test('BIBLE_STUDY_TABS exposes all required study perspectives plus chat', () => {
  const ids = BIBLE_STUDY_TABS.map((t) => t.id);
  assert.deepEqual(ids, ['teologia', 'historico', 'literario', 'original', 'aplicacao', 'chat']);
  assert.ok(BIBLE_STUDY_QUICK_PROMPTS.length >= 4);
  assert.equal(getBibleStudyTabs('chapter')[0].label, 'Visão do Capítulo');
  assert.deepEqual(getBibleStudyQuickPrompts('chapter'), BIBLE_STUDY_CHAPTER_QUICK_PROMPTS);
  assert.equal(getBibleStudyTabs('book')[0].label, 'Visão Geral');
  assert.equal(getBibleStudyTabs('book')[2].label, 'Estrutura & Cânone');
  assert.deepEqual(getBibleStudyQuickPrompts('book'), BIBLE_STUDY_BOOK_QUICK_PROMPTS);
});

test('buildSurroundingContextText and buildFullChapterContextText format verses cleanly', () => {
  const verses = [
    'No princípio era o Verbo.',
    'Ele estava com Deus no princípio.',
    'Todas as coisas foram feitas por intermédio dele.',
    'Nele estava a vida.',
    'A luz resplandece nas trevas.',
  ];
  const ctx = buildSurroundingContextText(verses, 2, 1);
  assert.equal(
    ctx,
    '1. No princípio era o Verbo.\n2. Ele estava com Deus no princípio.\n3. Todas as coisas foram feitas por intermédio dele.'
  );
  const full = buildFullChapterContextText(verses, 500);
  assert.ok(full.includes('1. No princípio era o Verbo.'));
  assert.ok(full.includes('5. A luz resplandece nas trevas.'));
  const bounded = buildFullChapterContextText(
    Array.from({ length: 80 }, (_, i) => `Versículo número ${i + 1} com conteúdo de estudo bíblico.`),
    600
  );
  assert.ok(bounded.includes('[... capítulo longo com 80 versículos ...]'));
  assert.ok(bounded.length <= 650);
});

test('normalizeTextSelectionExcerpt collapses whitespace and caps length', () => {
  assert.equal(
    normalizeTextSelectionExcerpt('  Deus   amou   o mundo \n de tal maneira  '),
    'Deus amou o mundo de tal maneira'
  );
  assert.equal(normalizeTextSelectionExcerpt('a'.repeat(800)).length, 600);
});

test('formatBibleStudyCacheKey distinguishes excerpts and separates verse, chapter, and book scope', () => {
  const base = {
    scope: 'verse' as const,
    bookId: 'joao',
    bookName: 'João',
    chapter: 1,
    verse: 1,
    version: 'NVI' as const,
    verseText: 'No princípio era aquele que é a Palavra.',
  };
  const keyA = formatBibleStudyCacheKey(base);
  const keyB = formatBibleStudyCacheKey({ ...base, selectedExcerpt: 'aquele que é a Palavra' });
  const keyChapter = formatBibleStudyCacheKey({
    scope: 'chapter',
    bookId: 'joao',
    bookName: 'João',
    chapter: 1,
    version: 'NVI',
  });
  const keyBook = formatBibleStudyCacheKey({
    scope: 'book',
    bookId: 'joao',
    bookName: 'João',
    testament: 'NT',
    totalChapters: 21,
    version: 'NVI',
  });
  assert.notEqual(keyA, keyB);
  assert.notEqual(keyA, keyChapter);
  assert.notEqual(keyChapter, keyBook);
  assert.equal(formatBibleStudyReference(base), 'João 1:1');
  assert.equal(
    formatBibleStudyReference({
      scope: 'chapter',
      bookId: 'joao',
      bookName: 'João',
      chapter: 1,
      version: 'NVI',
    }),
    'João 1'
  );
  assert.equal(
    formatBibleStudyReference({
      scope: 'book',
      bookId: 'joao',
      bookName: 'João',
      version: 'NVI',
    }),
    'João'
  );
});

test('normalizeBibleStudyAnalysis parses complete JSON and filters malformed word entries', () => {
  const parsed = normalizeBibleStudyAnalysis({
    mainPoint: 'O amor redentor de Deus em Cristo.',
    theologicalExplanation: 'Exposição bíblica sobre a graça salvadora.',
    historicalContext: 'Diálogo noturno com Nicodemos em Jerusalém.',
    literaryContext: 'Parte da conversa sobre o novo nascimento em João 3.',
    canonicalContext: 'Ecoa a promessa da Nova Aliança em Ezequiel 36.',
    keyWords: [
      {
        originalWord: 'ἠγάπησεν',
        transliteration: 'ēgapēsen',
        language: 'Grego',
        meaning: 'Amou com entrega sacrificial',
        significance: 'Verbo no aoristo apontando para o ato decisivo na cruz.',
      },
      { invalid: true },
    ],
    interpretiveQuestions: ['O sentido de "mundo" (kosmos) neste contexto.'],
    practicalApplication: 'Viver em gratidão e partilhar a esperança do Evangelho.',
    sources: ['João 3:1-21', 'Léxico Grego BDAG (agapaō)'],
  });

  assert.equal(parsed.keyWords.length, 1);
  assert.equal(parsed.keyWords[0].originalWord, 'ἠγάπησεν');
  assert.equal(parsed.interpretiveQuestions.length, 1);
  assert.equal(parsed.sources.length, 2);
});

test('parseStudyMarkdownBlocks converts headings, bullets, and bold text cleanly', () => {
  const sample = [
    '### 1. Contexto Geográfico',
    'O salmista contempla os **montes de Jerusalém**.',
    '',
    '* **Refúgio natural:** proteção na jornada.',
    '* **Lugares altos:** contraste com cultos idólatras.',
  ].join('\n');

  const blocks = parseStudyMarkdownBlocks(sample);
  assert.equal(blocks.length, 3);
  assert.deepEqual(blocks[0], { type: 'heading', text: '1. Contexto Geográfico' });
  assert.deepEqual(blocks[1], {
    type: 'paragraph',
    text: 'O salmista contempla os **montes de Jerusalém**.',
  });
  assert.equal(blocks[2].type, 'list');
  if (blocks[2].type === 'list') {
    assert.equal(blocks[2].items.length, 2);
  }

  const inline = parseInlineMarkdownSegments('O **Senhor** guarda a tua vida.');
  assert.deepEqual(inline, [
    { type: 'text', text: 'O ' },
    { type: 'bold', text: 'Senhor' },
    { type: 'text', text: ' guarda a tua vida.' },
  ]);
});
