import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
} from 'lucide-react';
import { PASTORAL_DEVOTIONALS } from '../data/churchData';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';
import type { BibleVersionId, PastoralDevotional } from '../types';
import {
  type DevotionalCarouselPageCount,
  buildDevotionalCarouselSlides,
  buildDevotionalShareCaption,
  formatDevotionalReference,
  getDailyDevotionalIndex,
} from '../utils/devotionalCarousel';

interface DailyDevotionalSectionProps {
  bibleVersion: BibleVersionId;
  onOpenBibleChapter: (bookId: string, chapter: number, verse?: number) => void;
  onOpenShareCarousel: (
    devotional: PastoralDevotional,
    verseText: string,
    pageCount: DevotionalCarouselPageCount
  ) => void;
}

const SLIDE_LABELS: Record<'cover' | 'reflection' | 'application' | 'prayer', string> = {
  cover: 'Capa',
  reflection: 'Reflexão',
  application: 'Aplicação',
  prayer: 'Oração',
};

export const DailyDevotionalSection: React.FC<DailyDevotionalSectionProps> = ({
  bibleVersion,
  onOpenBibleChapter,
  onOpenShareCarousel,
}) => {
  const initialIndex = useMemo(() => getDailyDevotionalIndex(PASTORAL_DEVOTIONALS), []);
  const [devotionalIndex, setDevotionalIndex] = useState<number>(initialIndex);
  const [pageCount, setPageCount] = useState<DevotionalCarouselPageCount>(4);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);

  const devotional = PASTORAL_DEVOTIONALS[devotionalIndex] ?? PASTORAL_DEVOTIONALS[0];
  const refLabel = formatDevotionalReference(devotional);

  const verseText =
    getVerseFromCorpusOrFallback(
      bibleVersion,
      devotional.reference.bookId,
      devotional.reference.chapter,
      devotional.reference.verse ?? 1
    ) ||
    'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?';

  const slides = useMemo(
    () => buildDevotionalCarouselSlides(devotional, verseText, pageCount),
    [devotional, verseText, pageCount]
  );

  const safeSlideIdx = Math.min(activeSlideIndex, slides.length - 1);
  const currentSlide = slides[safeSlideIdx] ?? slides[0];

  const handleSelectDevotional = (nextIndex: number) => {
    const wrapped =
      (nextIndex + PASTORAL_DEVOTIONALS.length) % PASTORAL_DEVOTIONALS.length;
    setDevotionalIndex(wrapped);
    setActiveSlideIndex(0);
  };

  const handleTogglePageCount = (count: DevotionalCarouselPageCount) => {
    setPageCount(count);
    if (activeSlideIndex >= count) {
      setActiveSlideIndex(count - 1);
    }
  };

  const handleCopyText = async () => {
    const caption = buildDevotionalShareCaption(devotional, verseText);
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedFeedback(true);
      window.setTimeout(() => setCopiedFeedback(false), 3000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <section
      aria-labelledby="daily-devotional-heading"
      className="pt-2 border-t border-[#141E2E]/10 dark:border-white/10"
    >
      {/* Section Header & Day Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
            Devocional Diário · {devotional.date}
          </p>
          <h2
            id="daily-devotional-heading"
            className="font-display text-2xl sm:text-3xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1 text-balance leading-[1.15]"
          >
            {devotional.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 3 or 4 pages segmented toggle */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10"
            role="group"
            aria-label="Modo de páginas do devocional"
          >
            {([3, 4] as const).map((count) => {
              const active = pageCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleTogglePageCount(count)}
                  aria-pressed={active}
                  className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] font-semibold'
                      : 'text-[#556173] dark:text-[#A3B0C2]'
                  }`}
                >
                  {count} págs
                </button>
              );
            })}
          </div>

          {/* Switch between the 7 daily devotionals */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelectDevotional(devotionalIndex - 1)}
              aria-label="Devocional anterior"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] flex items-center justify-center text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-medium text-[#556173] dark:text-[#A3B0C2] tabular-nums whitespace-nowrap">
              {devotionalIndex + 1} / {PASTORAL_DEVOTIONALS.length}
            </span>
            <button
              type="button"
              onClick={() => handleSelectDevotional(devotionalIndex + 1)}
              aria-label="Devocional seguinte"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] flex items-center justify-center text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Swipeable Editorial Reading Carousel */}
      <div
        className="rounded-2xl border border-[#141E2E]/12 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] overflow-hidden"
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current === null) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
          const delta = endX - touchStartXRef.current;
          touchStartXRef.current = null;
          if (delta < -40) {
            setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
          } else if (delta > 40) {
            setActiveSlideIndex((prev) => Math.max(0, prev - 1));
          }
        }}
      >
        {/* Top Page Selector Bar */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[#141E2E]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div
            className={`grid gap-1.5 w-full sm:w-auto sm:flex sm:items-center ${
              pageCount === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            {slides.map((slide, idx) => {
              const active = idx === safeSlideIdx;
              return (
                <button
                  key={`${slide.pageNumber}-${slide.kind}`}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  aria-pressed={active}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    active
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] font-semibold'
                      : 'text-[#556173] dark:text-[#A3B0C2] bg-[#F4F0E8]/60 dark:bg-white/[0.03] sm:bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {slide.pageNumber}. {SLIDE_LABELS[slide.kind]}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] tabular-nums">
            Página {currentSlide.pageNumber} de {currentSlide.totalPages}
          </span>
        </div>

        {/* Slide Body */}
        <div className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-between gap-6">
          <div className="space-y-3 max-w-[65ch]">
            <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
              {currentSlide.eyebrow}
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] leading-snug">
              {currentSlide.headline}
            </h3>
            <div className="space-y-3">
              {currentSlide.body.split(/\n+/).map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className={
                    currentSlide.kind === 'cover' || currentSlide.kind === 'prayer'
                      ? 'font-bible-serif text-lg sm:text-xl leading-relaxed text-[#141E2E] dark:text-[#F2EFE9]'
                      : 'text-base leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {currentSlide.subnote && (
              <p className="text-xs text-[#556173] dark:text-[#A3B0C2] pt-1">
                {currentSlide.subnote}
              </p>
            )}
          </div>

          {/* Slide Navigation + Actions */}
          <div className="pt-4 border-t border-[#141E2E]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={safeSlideIdx === 0}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] inline-flex items-center gap-1.5 disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Anterior</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))
                }
                disabled={safeSlideIdx >= slides.length - 1}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] inline-flex items-center gap-1.5 disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <span>Seguinte</span>
                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenBibleChapter(
                    devotional.reference.bookId,
                    devotional.reference.chapter,
                    devotional.reference.verse
                  )
                }
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ler {refLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopyText()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {copiedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-[#1F5C3A] dark:text-[#6EE7B7] shrink-0" aria-hidden="true" />
                    <span>Texto Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenShareCarousel(devotional, verseText, pageCount)}
                className="min-h-[48px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2 whitespace-nowrap transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Partilhar Carrossel ({pageCount} págs)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
