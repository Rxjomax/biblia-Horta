import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculatePlanProgress,
  calendarDaysBetweenIso,
  extractBibleReferences,
  getEffectiveStreak,
  getLocalDateIso,
  getTimeGreeting,
  hasReadToday,
  parseBibleReference,
  searchLoadedBible,
  updateStreakOnRead,
} from './bible';
import { BIBLE_BOOKS_CATALOG } from '../data/bibleBooksCatalog';
import { READING_PLANS } from '../data/churchData';
import type { BibleCorpus } from '../types';

test('BIBLE_BOOKS_CATALOG has all 66 canonical books and 1189 chapters', () => {
  assert.equal(BIBLE_BOOKS_CATALOG.length, 66);
  const totalChapters = BIBLE_BOOKS_CATALOG.reduce((sum, b) => sum + b.totalChapters, 0);
  assert.equal(totalChapters, 1189);
});

test('parseBibleReference parses all 66 books including numbered books and abbreviations', () => {
  assert.deepEqual(parseBibleReference('João 3:16'), {
    bookId: 'joao',
    bookName: 'João',
    chapter: 3,
    verse: 16,
  });

  assert.deepEqual(parseBibleReference('1 Coríntios 13:4'), {
    bookId: '1corintios',
    bookName: '1 Coríntios',
    chapter: 13,
    verse: 4,
  });

  assert.deepEqual(parseBibleReference('Apocalipse 21:4'), {
    bookId: 'apocalipse',
    bookName: 'Apocalipse',
    chapter: 21,
    verse: 4,
  });

  assert.deepEqual(parseBibleReference('sl 23'), {
    bookId: 'salmos',
    bookName: 'Salmos',
    chapter: 23,
    verse: undefined,
  });

  assert.equal(parseBibleReference('naoexiste 99'), null);
});

test('searchLoadedBible finds exact reference and keywords across the complete 66-book corpus', () => {
  const nviPath = path.resolve(process.cwd(), 'public/bibles/NVI.json');
  const corpus = JSON.parse(fs.readFileSync(nviPath, 'utf8')) as BibleCorpus;
  assert.equal(corpus.length, 66);

  const exact = searchLoadedBible('Apocalipse 21:4', corpus, 'NVI');
  assert.equal(exact.length, 1);
  assert.equal(exact[0].bookId, 'apocalipse');
  assert.equal(exact[0].chapter, 21);
  assert.equal(exact[0].verse, 4);
  assert.ok(exact[0].text.toLowerCase().includes('lágrima'));

  const keyword = searchLoadedBible('pastor', corpus, 'NVI');
  assert.ok(keyword.length >= 10);
});

test('extractBibleReferences detects inline references across Old and New Testaments', () => {
  const note =
    'Lemos Isaías 41:10, 1 Coríntios 13:4, Romanos 8:28 e Apocalipse 21:4 no estudo de hoje.';
  const refs = extractBibleReferences(note);
  assert.equal(refs.length, 4);
  assert.equal(refs[0].bookId, 'isaias');
  assert.equal(refs[1].bookId, '1corintios');
  assert.equal(refs[2].bookId, 'romanos');
  assert.equal(refs[3].bookId, 'apocalipse');
});

test('calculatePlanProgress calculates accurate percentages', () => {
  const plan = READING_PLANS.find((p) => p.id === 'vencer-medo-7')!;
  const p0 = calculatePlanProgress(plan, []);
  assert.equal(p0.percentage, 0);
  const p3 = calculatePlanProgress(plan, [1, 2, 3]);
  assert.equal(p3.completedCount, 3);
  assert.equal(p3.percentage, Math.round((3 / plan.days.length) * 100));
});

test('updateStreakOnRead and getEffectiveStreak handle consecutive days, expiration, and fresh starts accurately', () => {
  assert.equal(getLocalDateIso(new Date(2026, 10, 25, 23, 45)), '2026-11-25');
  assert.equal(calendarDaysBetweenIso('2026-03-28', '2026-03-29'), 1); // Across EU DST switch
  assert.equal(calendarDaysBetweenIso('2026-12-31', '2027-01-01'), 1);

  // Active streak checks
  assert.equal(getEffectiveStreak(5, '2026-11-25', '2026-11-25'), 5);
  assert.equal(getEffectiveStreak(5, '2026-11-24', '2026-11-25'), 5);
  assert.equal(getEffectiveStreak(5, '2026-11-23', '2026-11-25'), 0); // Missed yesterday -> expired
  assert.equal(getEffectiveStreak(5, '2026-11-15', '2026-11-25'), 0); // Stale legacy seed -> 0
  assert.equal(getEffectiveStreak(5, null, '2026-11-25'), 0);

  assert.equal(hasReadToday('2026-11-25', '2026-11-25'), true);
  assert.equal(hasReadToday('2026-11-24', '2026-11-25'), false);

  // First-ever reading starts at 1 even if stale number passed without date
  const freshStart = updateStreakOnRead(5, null, '2026-11-25');
  assert.deepEqual(freshStart, { streak: 1, lastReadDate: '2026-11-25' });

  const sameDay = updateStreakOnRead(4, '2026-11-16', '2026-11-16');
  assert.equal(sameDay.streak, 4);

  const nextDay = updateStreakOnRead(4, '2026-11-15', '2026-11-16');
  assert.equal(nextDay.streak, 5);

  const gapDay = updateStreakOnRead(4, '2026-11-10', '2026-11-16');
  assert.equal(gapDay.streak, 1);
});

test('getTimeGreeting returns PT-PT greeting by hour', () => {
  assert.equal(getTimeGreeting(new Date('2026-11-16T08:30:00')), 'Bom dia');
  assert.equal(getTimeGreeting(new Date('2026-11-16T15:00:00')), 'Boa tarde');
  assert.equal(getTimeGreeting(new Date('2026-11-16T21:30:00')), 'Boa noite');
});

test('READING_PLANS provides 12 complete plans with valid canonical book chapters', () => {
  assert.ok(READING_PLANS.length >= 12);
  const bookMap = new Map(BIBLE_BOOKS_CATALOG.map((b) => [b.id, b]));

  for (const plan of READING_PLANS) {
    assert.equal(
      plan.days.length,
      plan.durationDays,
      `Plan ${plan.id} should have ${plan.durationDays} days`
    );
    plan.days.forEach((dayEntry, idx) => {
      assert.equal(dayEntry.day, idx + 1);
      assert.ok(dayEntry.passages.length >= 1);
      for (const passage of dayEntry.passages) {
        const meta = bookMap.get(passage.bookId);
        assert.ok(meta, `Unknown bookId "${passage.bookId}" in plan ${plan.id}`);
        assert.ok(
          passage.chapter >= 1 && passage.chapter <= meta.totalChapters,
          `Invalid chapter ${passage.chapter} for ${passage.bookId} in plan ${plan.id}`
        );
      }
    });
  }

  // Verify the 365-day plans and 31-day Psalms/Proverbs cover full canonical counts
  const seqPlan = READING_PLANS.find((p) => p.id === 'biblia-ano')!;
  const seqChapters = seqPlan.days.reduce((sum, d) => sum + d.passages.length, 0);
  assert.equal(seqChapters, 1189);

  const chronPlan = READING_PLANS.find((p) => p.id === 'biblia-ano-cronologico')!;
  const chronChapters = chronPlan.days.reduce((sum, d) => sum + d.passages.length, 0);
  assert.equal(chronChapters, 1189);

  const psalmsPlan = READING_PLANS.find((p) => p.id === 'salmos-proverbios')!;
  const psalmsCount = psalmsPlan.days.reduce(
    (sum, d) => sum + d.passages.filter((p) => p.bookId === 'salmos').length,
    0
  );
  assert.equal(psalmsCount, 150);
});

