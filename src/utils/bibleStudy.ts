import type { BibleVersionId } from '../types';

export type BibleStudyScope = 'verse' | 'chapter' | 'book';

export interface BibleStudyTarget {
  scope?: BibleStudyScope;
  bookId: string;
  bookName: string;
  testament?: 'AT' | 'NT';
  totalChapters?: number;
  chapter?: number;
  verse?: number;
  verseCount?: number;
  version: BibleVersionId;
  verseText?: string;
  chapterText?: string;
  selectedExcerpt?: string;
  surroundingContext?: string;
}

export interface OriginalWordEntry {
  originalWord: string;
  transliteration: string;
  language: 'Hebraico' | 'Aramaico' | 'Grego' | string;
  meaning: string;
  significance: string;
}

export interface BibleStudyAnalysis {
  mainPoint: string;
  theologicalExplanation: string;
  historicalContext: string;
  literaryContext: string;
  canonicalContext: string;
  keyWords: OriginalWordEntry[];
  interpretiveQuestions: string[];
  practicalApplication: string;
  sources: string[];
}

export interface BibleStudyChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export type BibleStudyTabId =
  | 'teologia'
  | 'historico'
  | 'literario'
  | 'original'
  | 'aplicacao'
  | 'chat';

export const BIBLE_STUDY_TABS: Array<{ id: BibleStudyTabId; label: string }> = [
  { id: 'teologia', label: 'Teologia' },
  { id: 'historico', label: 'Contexto Histórico' },
  { id: 'literario', label: 'Contexto Literário' },
  { id: 'original', label: 'Original & Fontes' },
  { id: 'aplicacao', label: 'Aplicação Prática' },
  { id: 'chat', label: 'Conversar' },
];

export const BIBLE_STUDY_CHAPTER_TABS: Array<{ id: BibleStudyTabId; label: string }> = [
  { id: 'teologia', label: 'Visão do Capítulo' },
  { id: 'historico', label: 'Contexto Histórico' },
  { id: 'literario', label: 'Estrutura & Cânone' },
  { id: 'original', label: 'Original & Fontes' },
  { id: 'aplicacao', label: 'Aplicação Prática' },
  { id: 'chat', label: 'Conversar' },
];

export const BIBLE_STUDY_BOOK_TABS: Array<{ id: BibleStudyTabId; label: string }> = [
  { id: 'teologia', label: 'Visão Geral' },
  { id: 'historico', label: 'Contexto Histórico' },
  { id: 'literario', label: 'Estrutura & Cânone' },
  { id: 'original', label: 'Original & Fontes' },
  { id: 'aplicacao', label: 'Aplicação Prática' },
  { id: 'chat', label: 'Conversar' },
];

export function getBibleStudyTabs(scope: BibleStudyScope = 'verse') {
  if (scope === 'book') return BIBLE_STUDY_BOOK_TABS;
  if (scope === 'chapter') return BIBLE_STUDY_CHAPTER_TABS;
  return BIBLE_STUDY_TABS;
}

export const BIBLE_STUDY_QUICK_PROMPTS: string[] = [
  'Qual é o ponto principal deste texto no argumento do livro?',
  'Explica as palavras mais importantes no idioma original.',
  'Quais são as principais questões interpretativas e leituras possíveis?',
  'Como este versículo se liga ao contexto canónico e a Cristo?',
  'Qual é uma aplicação prática responsável sem tirar o texto do contexto?',
];

export const BIBLE_STUDY_CHAPTER_QUICK_PROMPTS: string[] = [
  'Explica o fluxo e a estrutura deste capítulo bloco a bloco.',
  'Qual é a mensagem central deste capítulo no argumento do livro?',
  'Quais são as palavras mais importantes no original neste capítulo?',
  'Como este capítulo se liga ao resto da Bíblia e aponta para Cristo?',
  'Que aplicação prática responsável nasce de ler este capítulo completo?',
];

export const BIBLE_STUDY_BOOK_QUICK_PROMPTS: string[] = [
  'Qual é o esboço e a estrutura capítulo a capítulo deste livro?',
  'Quem escreveu este livro, quando e com que propósito principal?',
  'Quais são os temas teológicos e palavras-chave mais marcantes do livro?',
  'Como este livro aponta para Cristo e se liga ao resto da Bíblia?',
  'Que cuidados devo ter ao ler e aplicar este livro hoje?',
];

export function getBibleStudyQuickPrompts(scope: BibleStudyScope = 'verse'): string[] {
  if (scope === 'book') return BIBLE_STUDY_BOOK_QUICK_PROMPTS;
  if (scope === 'chapter') return BIBLE_STUDY_CHAPTER_QUICK_PROMPTS;
  return BIBLE_STUDY_QUICK_PROMPTS;
}

export function formatBibleStudyReference(target: BibleStudyTarget): string {
  if (target.scope === 'book') {
    return target.bookName;
  }
  if (target.scope === 'chapter') {
    return `${target.bookName} ${target.chapter ?? 1}`;
  }
  return `${target.bookName} ${target.chapter ?? 1}:${target.verse ?? 1}`;
}

export function formatBibleStudyCacheKey(target: BibleStudyTarget): string {
  if (target.scope === 'book') {
    return `book:${target.bookId}:${target.version}`;
  }
  if (target.scope === 'chapter') {
    return `chapter:${target.bookId}:${target.chapter ?? 1}:${target.version}`;
  }
  const excerptKey = (target.selectedExcerpt ?? '').trim().slice(0, 120);
  return `verse:${target.bookId}:${target.chapter ?? 1}:${target.verse ?? 1}:${target.version}:${excerptKey}`;
}

export function buildFullChapterContextText(verses: string[], maxChars = 7500): string {
  if (!Array.isArray(verses) || verses.length === 0) return '';
  const numbered = verses
    .map((txt, idx) => `${idx + 1}. ${(txt ?? '').trim()}`)
    .filter((line) => line.length > 3);
  const full = numbered.join('\n');
  if (full.length <= maxChars) return full;

  const headBudget = Math.floor(maxChars * 0.65);
  const tailBudget = maxChars - headBudget - 60;
  let head = '';
  for (const line of numbered) {
    if (head.length + line.length + 1 > headBudget) break;
    head += (head ? '\n' : '') + line;
  }
  let tail = '';
  for (let i = numbered.length - 1; i >= 0; i--) {
    const line = numbered[i];
    if (tail.length + line.length + 1 > tailBudget) break;
    tail = line + (tail ? '\n' + tail : '');
  }
  return `${head}\n[... capítulo longo com ${verses.length} versículos ...]\n${tail}`;
}

export function buildSurroundingContextText(
  verses: string[],
  verseNum: number,
  radius = 2
): string {
  if (!Array.isArray(verses) || verses.length === 0) return '';
  const start = Math.max(1, verseNum - radius);
  const end = Math.min(verses.length, verseNum + radius);
  const lines: string[] = [];
  for (let v = start; v <= end; v++) {
    const txt = verses[v - 1]?.trim();
    if (txt) {
      lines.push(`${v}. ${txt}`);
    }
  }
  return lines.join('\n');
}

export function normalizeTextSelectionExcerpt(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 600);
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function normalizeBibleStudyAnalysis(raw: unknown): BibleStudyAnalysis {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const rawWords = Array.isArray(data.keyWords) ? data.keyWords : [];
  const keyWords: OriginalWordEntry[] = rawWords
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const w = item as Record<string, unknown>;
      const originalWord = typeof w.originalWord === 'string' ? w.originalWord.trim() : '';
      const transliteration =
        typeof w.transliteration === 'string' ? w.transliteration.trim() : '';
      const meaning = typeof w.meaning === 'string' ? w.meaning.trim() : '';
      const significance = typeof w.significance === 'string' ? w.significance.trim() : '';
      const language =
        typeof w.language === 'string' && w.language.trim() ? w.language.trim() : 'Original';
      if (!originalWord && !transliteration && !meaning) return null;
      return {
        originalWord: originalWord || transliteration,
        transliteration: transliteration || '—',
        language,
        meaning: meaning || 'Termo-chave na passagem.',
        significance: significance || 'Contribui diretamente para o sentido central do versículo.',
      };
    })
    .filter((entry): entry is OriginalWordEntry => entry !== null);

  return {
    mainPoint: asNonEmptyString(
      data.mainPoint,
      'Síntese teológica indisponível para este trecho.'
    ),
    theologicalExplanation: asNonEmptyString(
      data.theologicalExplanation,
      'Não foi possível detalhar a explicação teológica.'
    ),
    historicalContext: asNonEmptyString(
      data.historicalContext,
      'Contexto histórico indisponível.'
    ),
    literaryContext: asNonEmptyString(
      data.literaryContext,
      'Contexto literário indisponível.'
    ),
    canonicalContext: asNonEmptyString(
      data.canonicalContext,
      'Contexto canónico indisponível.'
    ),
    keyWords,
    interpretiveQuestions: asStringArray(data.interpretiveQuestions, []),
    practicalApplication: asNonEmptyString(
      data.practicalApplication,
      'Aplicação prática indisponível.'
    ),
    sources: asStringArray(data.sources, []),
  };
}

export type InlineMarkdownSegment =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string };

export type StudyMarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export function parseInlineMarkdownSegments(input: string): InlineMarkdownSegment[] {
  const segments: InlineMarkdownSegment[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: input.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'bold', text: match[1] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', text: input.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', text: input }];
}

export function parseStudyMarkdownBlocks(raw: string): StudyMarkdownBlock[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: StudyMarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: [...listItems] });
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: headingMatch[1].replace(/\*\*/g, '').trim() });
      continue;
    }

    const bulletMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      listItems.push(bulletMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

