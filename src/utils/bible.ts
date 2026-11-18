import { BIBLE_BOOKS_CATALOG } from '../data/bibleBooksCatalog';
import { BIBLE_BOOKS } from '../data/bibleData';
import type {
  BibleBookMeta,
  BibleCorpus,
  BibleVersionId,
  ReadingPlan,
  VerseReference,
} from '../types';

export interface SearchResultItem {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  isExactRef: boolean;
}

export interface DetectedBibleRef {
  raw: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
  startIndex: number;
  endIndex: number;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function makeVerseKey(bookId: string, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

export function findBookByQuery(
  query: string,
  books: BibleBookMeta[] = BIBLE_BOOKS_CATALOG
): BibleBookMeta | undefined {
  const norm = normalizeText(query).replace(/\s+/g, ' ');
  if (!norm) return undefined;
  return books.find((b) => {
    if (
      normalizeText(b.name) === norm ||
      normalizeText(b.shortName) === norm ||
      b.id === norm.replace(/\s+/g, '')
    ) {
      return true;
    }
    return b.aliases.some((alias) => normalizeText(alias) === norm);
  });
}

export function parseBibleReference(
  input: string,
  books: BibleBookMeta[] = BIBLE_BOOKS_CATALOG
): (VerseReference & { verse?: number }) | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  const match = cleaned.match(/^([1-3]?\s*[A-Za-zÀ-ÿ]+)\s+(\d+)(?:[:.](\d+))?$/);
  if (!match) return null;

  const rawBook = match[1];
  const chapterNum = parseInt(match[2], 10);
  const verseNum = match[3] ? parseInt(match[3], 10) : undefined;

  const book = findBookByQuery(rawBook, books);
  if (!book || Number.isNaN(chapterNum) || chapterNum < 1 || chapterNum > book.totalChapters) {
    return null;
  }

  return {
    bookId: book.id,
    bookName: book.name,
    chapter: chapterNum,
    verse: verseNum,
  };
}

export function searchLoadedBible(
  query: string,
  corpus: BibleCorpus | undefined,
  versionFallback: BibleVersionId = 'NVI',
  books: BibleBookMeta[] = BIBLE_BOOKS_CATALOG,
  limit = 40
): SearchResultItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const parsedRef = parseBibleReference(trimmed, books);
  if (parsedRef) {
    const bookMeta = books.find((b) => b.id === parsedRef.bookId);
    if (bookMeta && corpus) {
      const verses = corpus[bookMeta.index]?.[parsedRef.chapter - 1];
      if (verses) {
        if (parsedRef.verse) {
          const text = verses[parsedRef.verse - 1];
          if (text !== undefined) {
            return [
              {
                bookId: bookMeta.id,
                bookName: bookMeta.name,
                chapter: parsedRef.chapter,
                verse: parsedRef.verse,
                text,
                isExactRef: true,
              },
            ];
          }
        }
        return verses
          .map((text, idx) => ({
            bookId: bookMeta.id,
            bookName: bookMeta.name,
            chapter: parsedRef.chapter,
            verse: idx + 1,
            text,
            isExactRef: true,
          }))
          .filter((item) => item.text.length > 0)
          .slice(0, limit);
      }
    }
  }

  const normQuery = normalizeText(trimmed);
  if (normQuery.length < 2) return [];

  if (corpus) {
    const results: SearchResultItem[] = [];
    for (const bookMeta of books) {
      const chapters = corpus[bookMeta.index];
      if (!chapters) continue;
      for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
        const verses = chapters[cIdx];
        if (!verses) continue;
        for (let vIdx = 0; vIdx < verses.length; vIdx++) {
          const text = verses[vIdx];
          if (!text) continue;
          if (normalizeText(text).includes(normQuery)) {
            results.push({
              bookId: bookMeta.id,
              bookName: bookMeta.name,
              chapter: cIdx + 1,
              verse: vIdx + 1,
              text,
              isExactRef: false,
            });
            if (results.length >= limit) {
              return results;
            }
          }
        }
      }
    }
    return results;
  }

  // Fallback to starter corpus if full JSON hasn't finished loading yet
  const fbVer =
    versionFallback === 'OL' || versionFallback === 'NAA' || versionFallback === 'NTLH'
      ? 'BPT'
      : versionFallback;
  const fallbackResults: SearchResultItem[] = [];
  for (const b of BIBLE_BOOKS) {
    for (const ch of b.chapters) {
      for (const v of ch.verses) {
        const text = v.translations[fbVer];
        if (normalizeText(text).includes(normQuery)) {
          fallbackResults.push({
            bookId: b.id,
            bookName: b.name,
            chapter: ch.chapter,
            verse: v.verse,
            text,
            isExactRef: false,
          });
          if (fallbackResults.length >= limit) return fallbackResults;
        }
      }
    }
  }
  return fallbackResults;
}

export function extractBibleReferences(
  text: string,
  books: BibleBookMeta[] = BIBLE_BOOKS_CATALOG
): DetectedBibleRef[] {
  if (!text) return [];
  const regex = /\b([1-3]?\s?[A-Za-zÀ-ÿ]{2,18})\s+(\d{1,3})(?::(\d{1,3}))?\b/g;
  const matches: DetectedBibleRef[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawBook = match[1].trim();
    const book = findBookByQuery(rawBook, books);
    if (!book) continue;
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : undefined;
    if (chapter < 1 || chapter > book.totalChapters) continue;

    matches.push({
      raw: match[0],
      bookId: book.id,
      bookName: book.name,
      chapter,
      verse,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return matches;
}

export function calculatePlanProgress(
  plan: ReadingPlan,
  completedDays: number[]
): { completedCount: number; totalTrackableDays: number; percentage: number } {
  const totalTrackableDays = Math.max(plan.days.length, 1);
  const validUnique = new Set(
    completedDays.filter((d) => plan.days.some((planDay) => planDay.day === d))
  );
  const completedCount = validUnique.size;
  const percentage = Math.min(100, Math.round((completedCount / totalTrackableDays) * 100));
  return { completedCount, totalTrackableDays, percentage };
}

export function getTimeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 20) return 'Boa tarde';
  return 'Boa noite';
}

export function updateStreakOnRead(
  currentStreak: number,
  lastReadDateIso: string | null,
  todayIso: string
): { streak: number; lastReadDate: string } {
  if (!lastReadDateIso) {
    return { streak: Math.max(1, currentStreak), lastReadDate: todayIso };
  }
  if (lastReadDateIso === todayIso) {
    return { streak: Math.max(1, currentStreak), lastReadDate: todayIso };
  }
  const prev = new Date(`${lastReadDateIso}T00:00:00`);
  const curr = new Date(`${todayIso}T00:00:00`);
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return { streak: currentStreak + 1, lastReadDate: todayIso };
  }
  return { streak: 1, lastReadDate: todayIso };
}
