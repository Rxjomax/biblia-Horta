import { getBookMetaById } from '../data/bibleBooksCatalog';
import { getVerseText as getFallbackVerseText, type FallbackVersionId } from '../data/bibleData';
import type { BibleCorpus, BibleVersionId } from '../types';

const corpusCache = new Map<BibleVersionId, BibleCorpus>();
const inflightRequests = new Map<BibleVersionId, Promise<BibleCorpus>>();

export function getCachedBibleCorpus(version: BibleVersionId): BibleCorpus | undefined {
  return corpusCache.get(version);
}

export async function loadBibleVersion(version: BibleVersionId): Promise<BibleCorpus> {
  const cached = corpusCache.get(version);
  if (cached) return cached;

  const existing = inflightRequests.get(version);
  if (existing) return existing;

  const promise = (async () => {
    const res = await fetch(`/bibles/${version}.json`);
    if (!res.ok) {
      throw new Error(`Não foi possível carregar a versão ${version} (${res.status})`);
    }
    const data = (await res.json()) as BibleCorpus;
    corpusCache.set(version, data);
    inflightRequests.delete(version);
    return data;
  })().catch((err) => {
    inflightRequests.delete(version);
    throw err;
  });

  inflightRequests.set(version, promise);
  return promise;
}

export function getChapterVersesFromCorpus(
  corpus: BibleCorpus | undefined,
  bookId: string,
  chapterNum: number
): string[] {
  if (!corpus) return [];
  const meta = getBookMetaById(bookId);
  if (!meta) return [];
  const bookChapters = corpus[meta.index];
  if (!bookChapters) return [];
  return bookChapters[chapterNum - 1] ?? [];
}

export function getVerseFromCorpusOrFallback(
  version: BibleVersionId,
  bookId: string,
  chapterNum: number,
  verseNum: number
): string {
  const corpus = corpusCache.get(version);
  if (corpus) {
    const meta = getBookMetaById(bookId);
    const text = meta ? corpus[meta.index]?.[chapterNum - 1]?.[verseNum - 1] : undefined;
    if (text) return text;
  }
  const fallbackVersion: FallbackVersionId =
    version === 'OL' || version === 'NAA' || version === 'NTLH' ? 'BPT' : version;
  return getFallbackVerseText(bookId, chapterNum, verseNum, fallbackVersion) ?? '';
}
