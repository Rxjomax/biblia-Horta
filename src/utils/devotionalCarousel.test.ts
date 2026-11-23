import assert from 'node:assert/strict';
import test from 'node:test';
import { PASTORAL_DEVOTIONALS } from '../data/churchData.ts';
import {
  buildDevotionalCarouselSlides,
  buildDevotionalShareCaption,
  formatDevotionalReference,
  getDailyDevotionalIndex,
} from './devotionalCarousel.ts';

test('PASTORAL_DEVOTIONALS contains 7 complete daily devotionals with application and prayer', () => {
  assert.equal(PASTORAL_DEVOTIONALS.length, 7);
  for (const dev of PASTORAL_DEVOTIONALS) {
    assert.ok(dev.title.trim().length > 5);
    assert.ok(dev.body.length >= 2);
    assert.ok(dev.application && dev.application.trim().length > 10);
    assert.ok(dev.prayer.trim().length > 10);
  }
});

test('buildDevotionalCarouselSlides outputs exactly 3 or 4 ordered slides', () => {
  const dev = PASTORAL_DEVOTIONALS[0];
  const verse = 'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?';

  const threeSlides = buildDevotionalCarouselSlides(dev, verse, 3);
  assert.equal(threeSlides.length, 3);
  assert.deepEqual(
    threeSlides.map((s) => s.pageNumber),
    [1, 2, 3]
  );
  assert.equal(threeSlides[0].kind, 'cover');
  assert.equal(threeSlides[1].kind, 'reflection');
  assert.equal(threeSlides[2].kind, 'prayer');
  assert.ok(threeSlides.every((s) => s.totalPages === 3));

  const fourSlides = buildDevotionalCarouselSlides(dev, verse, 4);
  assert.equal(fourSlides.length, 4);
  assert.deepEqual(
    fourSlides.map((s) => s.pageNumber),
    [1, 2, 3, 4]
  );
  assert.equal(fourSlides[0].kind, 'cover');
  assert.equal(fourSlides[1].kind, 'reflection');
  assert.equal(fourSlides[2].kind, 'application');
  assert.equal(fourSlides[3].kind, 'prayer');
  assert.ok(fourSlides.every((s) => s.totalPages === 4));

  for (const slide of [...threeSlides, ...fourSlides]) {
    assert.ok(!slide.eyebrow.includes(dev.author));
    assert.ok(!slide.headline.includes(dev.author));
    assert.ok(!slide.body.includes(dev.author));
    assert.ok(!(slide.subnote ?? '').includes(dev.author));
  }
});

test('getDailyDevotionalIndex returns valid bounded index across calendar dates', () => {
  for (let day = 1; day <= 31; day++) {
    const idx = getDailyDevotionalIndex(PASTORAL_DEVOTIONALS, new Date(2026, 10, day));
    assert.ok(idx >= 0 && idx < PASTORAL_DEVOTIONALS.length);
  }
});

test('buildDevotionalShareCaption includes official URL, reference, and prayer without author', () => {
  const dev = PASTORAL_DEVOTIONALS[0];
  const caption = buildDevotionalShareCaption(dev, 'O Senhor é quem te guarda.');
  assert.ok(caption.includes(formatDevotionalReference(dev)));
  assert.ok(caption.includes(dev.prayer));
  assert.ok(caption.includes('https://biblia-horta.vercel.app/'));
  assert.ok(!caption.includes(dev.author));
});
