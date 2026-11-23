import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getBookMetaById } from '../data/bibleBooksCatalog';
import type { BibleCorpus } from '../types';
import {
  DAILY_VERSES,
  formatDailyVerseReference,
  getDailyVerseForDate,
  getDailyVerseIndex,
  resolveDailyVerseText,
} from './dailyVerse';

test('DAILY_VERSES contains 60 unique curated verses with valid book IDs and non-empty fallback text', () => {
  assert.equal(DAILY_VERSES.length, 60);
  const seenRefs = new Set<string>();

  for (const entry of DAILY_VERSES) {
    const meta = getBookMetaById(entry.bookId);
    assert.ok(meta, `Unknown bookId: ${entry.bookId}`);
    assert.ok(
      entry.chapter >= 1 && entry.chapter <= meta.totalChapters,
      `Invalid chapter for ${entry.bookName} ${entry.chapter}`
    );
    assert.ok(entry.verse >= 1, `Invalid verse for ${entry.bookName} ${entry.chapter}:${entry.verse}`);
    assert.ok(entry.fallbackText.trim().length > 10, `Fallback text too short for ${entry.bookName}`);

    const key = `${entry.bookId}:${entry.chapter}:${entry.verse}`;
    assert.ok(!seenRefs.has(key), `Duplicate daily verse reference: ${key}`);
    seenRefs.add(key);
  }
});

test('every daily verse exists in the bundled NVI Bible corpus', () => {
  const nviPath = path.resolve(process.cwd(), 'public/bibles/NVI.json');
  const corpus = JSON.parse(fs.readFileSync(nviPath, 'utf-8')) as BibleCorpus;

  for (const entry of DAILY_VERSES) {
    const resolved = resolveDailyVerseText(entry, 'NVI', corpus);
    assert.ok(
      resolved.length > 10,
      `Missing NVI corpus text for ${formatDailyVerseReference(entry)}`
    );
  }
});

test('getDailyVerseForDate returns a different verse on consecutive calendar days', () => {
  const seenOnConsecutiveDays = new Set<string>();
  const base = new Date(2026, 10, 20); // 20 Nov 2026

  for (let offset = 0; offset < DAILY_VERSES.length; offset++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
    const verse = getDailyVerseForDate(day);
    const ref = formatDailyVerseReference(verse);
    assert.ok(
      !seenOnConsecutiveDays.has(ref),
      `Verse repeated within ${DAILY_VERSES.length}-day window on day +${offset}: ${ref}`
    );
    seenOnConsecutiveDays.add(ref);
  }

  // Same date at different times of day yields the same verse
  const morning = getDailyVerseIndex(new Date(2026, 10, 22, 6, 30));
  const night = getDailyVerseIndex(new Date(2026, 10, 22, 23, 45));
  const nextMorning = getDailyVerseIndex(new Date(2026, 10, 23, 0, 5));
  assert.equal(morning, night);
  assert.notEqual(morning, nextMorning);
});
