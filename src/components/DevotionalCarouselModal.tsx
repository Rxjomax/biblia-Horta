import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Layers,
  Search,
  Share2,
  X,
} from 'lucide-react';
import type { BibleVersionId, PastoralDevotional } from '../types';
import {
  type DevotionalCarouselPageCount,
  type DevotionalCarouselSlide,
  buildDevotionalCarouselSlides,
  buildDevotionalShareCaption,
  formatDevotionalReference,
} from '../utils/devotionalCarousel';
import {
  SHARE_BACKGROUNDS,
  type ShareBackgroundPreset,
  filterShareBackgrounds,
  suggestBackgroundForVerse,
} from '../utils/shareBackgrounds';

interface DevotionalCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotional: PastoralDevotional | null;
  verseText: string;
  versionLabel: BibleVersionId;
  initialPageCount?: DevotionalCarouselPageCount;
}

type CarouselFormat = 'portrait' | 'square' | 'story';

const FORMAT_DIMENSIONS: Record<
  CarouselFormat,
  { width: number; height: number; label: string; aspectClass: string }
> = {
  portrait: {
    width: 1080,
    height: 1350,
    label: 'Carrossel (4:5)',
    aspectClass: 'aspect-[4/5] max-h-[340px]',
  },
  square: {
    width: 1080,
    height: 1080,
    label: 'Quadrado (1:1)',
    aspectClass: 'aspect-square max-h-[300px]',
  },
  story: {
    width: 1080,
    height: 1920,
    label: 'Stories (9:16)',
    aspectClass: 'aspect-[9/16] max-h-[350px]',
  },
};

function drawIebhWatermark(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  scale: number,
  crossColor: string,
  flukeColor: string,
  haloColor: string
) {
  ctx.save();
  ctx.translate(centerX, topY);
  ctx.scale(scale, scale);
  ctx.translate(-316, -270);

  ctx.fillStyle = crossColor;
  ctx.beginPath();
  ctx.roundRect(282, 68, 68, 410, 8);
  ctx.roundRect(128, 208, 376, 68, 8);
  ctx.fill();

  const flukePath = new Path2D(
    'M 146 136 C 172 162, 206 164, 240 165 C 276 167, 300 183, 316 218 C 332 183, 356 167, 392 165 C 426 164, 460 162, 486 136 C 472 182, 434 218, 386 234 C 356 244, 344 260, 344 292 L 344 474 C 344 477, 341 479, 338 479 L 294 479 C 291 479, 288 477, 288 474 L 288 292 C 288 260, 276 244, 246 234 C 198 218, 160 182, 146 136 Z'
  );
  ctx.lineJoin = 'round';
  ctx.lineWidth = 22;
  ctx.strokeStyle = haloColor;
  ctx.stroke(flukePath);
  ctx.fillStyle = flukeColor;
  ctx.fill(flukePath);

  ctx.restore();
}

function wrapParagraphs(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const allLines: string[] = [];

  paragraphs.forEach((paragraph, pIdx) => {
    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      allLines.push(currentLine);
    }
    if (pIdx < paragraphs.length - 1) {
      allLines.push('');
    }
  });

  return allLines;
}

function drawSlideToDataUrl(
  slide: DevotionalCarouselSlide,
  preset: ShareBackgroundPreset,
  format: CarouselFormat,
  versionLabel: BibleVersionId,
  bgImage?: HTMLImageElement
): string {
  const { width, height } = FORMAT_DIMENSIONS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isLight = Boolean(preset.isLight);

  // Base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, preset.bgGradient[0]);
  baseGrad.addColorStop(0.5, preset.bgGradient[1]);
  baseGrad.addColorStop(1, preset.bgGradient[2]);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Background photograph cover fit
  if (bgImage) {
    const imgAspect = bgImage.width / bgImage.height;
    const canvasAspect = width / height;
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;

    if (imgAspect > canvasAspect) {
      drawH = height;
      drawW = height * imgAspect;
      drawX = (width - drawW) / 2;
    } else {
      drawW = width;
      drawH = width / imgAspect;
      drawY = (height - drawH) / 2;
    }
    ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
  }

  // Darker protective scrim on interior reading pages so multi-paragraph prose has effortless >= 7:1 contrast
  const interiorBoost = slide.kind === 'cover' ? 0 : 0.12;
  const scrimGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isLight) {
    scrimGrad.addColorStop(0, preset.scrim[0]);
    scrimGrad.addColorStop(0.5, preset.scrim[1]);
    scrimGrad.addColorStop(1, preset.scrim[2]);
  } else {
    scrimGrad.addColorStop(0, `rgba(10, 16, 28, ${0.72 + interiorBoost})`);
    scrimGrad.addColorStop(0.5, `rgba(12, 19, 32, ${0.68 + interiorBoost})`);
    scrimGrad.addColorStop(1, `rgba(8, 13, 24, ${0.88 + interiorBoost * 0.5})`);
  }
  ctx.fillStyle = scrimGrad;
  ctx.fillRect(0, 0, width, height);

  // Editorial inset frame
  const inset = 54;
  ctx.strokeStyle = preset.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  // Top bar: Watermark left + Page counter right
  const topAnchorY = format === 'story' ? 168 : 124;
  drawIebhWatermark(
    ctx,
    inset + 62,
    topAnchorY,
    0.13,
    isLight ? '#B8862D' : '#D4A84E',
    isLight ? '#13294B' : '#FAF8F4',
    isLight ? '#F3EFE6' : '#13294B'
  );

  ctx.textAlign = 'left';
  ctx.fillStyle = preset.accentColor;
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(slide.eyebrow.toUpperCase(), inset + 116, topAnchorY + 8);

  // Page index (e.g. 01 / 04)
  ctx.textAlign = 'right';
  ctx.fillStyle = preset.mutedColor;
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  const pageTag = `0${slide.pageNumber} / 0${slide.totalPages}`;
  ctx.fillText(pageTag, width - inset - 46, topAnchorY + 8);

  // Hairline rule under header
  const headerRuleY = topAnchorY + 52;
  ctx.strokeStyle = preset.borderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(inset + 42, headerRuleY);
  ctx.lineTo(width - inset - 42, headerRuleY);
  ctx.stroke();

  // Main editorial content zone
  const contentLeft = inset + 64;
  const maxTextWidth = width - contentLeft * 2;
  const footerY = height - (format === 'story' ? 168 : 112);

  if (slide.kind === 'cover') {
    // Centered monumental cover slide
    ctx.textAlign = 'center';
    const titleSize = slide.headline.length > 34 ? 54 : 62;
    ctx.fillStyle = preset.textColor;
    ctx.font = `600 ${titleSize}px "Fraunces", Georgia, serif`;
    const titleLines = wrapParagraphs(ctx, slide.headline, maxTextWidth);

    const verseSize = slide.body.length > 150 ? 34 : 40;
    ctx.font = `400 ${verseSize}px "Fraunces", Georgia, serif`;
    const verseLines = wrapParagraphs(ctx, slide.body, maxTextWidth - 20);

    const titleHeight = titleLines.length * titleSize * 1.24;
    const verseHeight = verseLines.length * verseSize * 1.44;
    const blockHeight = titleHeight + 70 + verseHeight + 60;
    let y = Math.max(headerRuleY + 90, (height - blockHeight) / 2 + titleSize * 0.45);

    ctx.fillStyle = preset.textColor;
    ctx.font = `600 ${titleSize}px "Fraunces", Georgia, serif`;
    for (const line of titleLines) {
      ctx.fillText(line, width / 2, y);
      y += titleSize * 1.24;
    }

    // Small gold rule divider
    y += 14;
    ctx.strokeStyle = preset.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 56, y);
    ctx.lineTo(width / 2 + 56, y);
    ctx.stroke();
    y += 56;

    ctx.fillStyle = preset.textColor;
    ctx.font = `400 ${verseSize}px "Fraunces", Georgia, serif`;
    for (const line of verseLines) {
      if (line === '') {
        y += verseSize * 0.7;
      } else {
        ctx.fillText(line, width / 2, y);
        y += verseSize * 1.44;
      }
    }

    if (slide.subnote) {
      ctx.fillStyle = preset.accentColor;
      ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${slide.subnote} (${versionLabel})`, width / 2, y + 36);
    }
  } else {
    // Interior editorial reading slides (left-aligned magazine prose)
    ctx.textAlign = 'left';
    const headlineSize = slide.headline.length > 32 ? 44 : 50;
    ctx.font = `600 ${headlineSize}px "Fraunces", Georgia, serif`;
    const headlineLines = wrapParagraphs(ctx, slide.headline, maxTextWidth);

    // Choose readable body size based on character length & format height
    const isCompactSquare = format === 'square';
    const bodyLen = slide.body.length;
    let bodyFontSize = isCompactSquare ? 31 : 35;
    if (bodyLen > 360) bodyFontSize = isCompactSquare ? 26 : 30;
    else if (bodyLen > 240) bodyFontSize = isCompactSquare ? 28 : 32;
    else if (bodyLen < 160) bodyFontSize = isCompactSquare ? 35 : 40;

    const isPrayer = slide.kind === 'prayer';
    const bodyFontFamily = isPrayer ? '"Fraunces", Georgia, serif' : '"Plus Jakarta Sans", sans-serif';
    ctx.font = `${isPrayer ? '400 italic' : '400'} ${bodyFontSize}px ${bodyFontFamily}`;
    const bodyLines = wrapParagraphs(ctx, slide.body, maxTextWidth);

    const bodyLineHeight = bodyFontSize * 1.5;
    const headlineHeight = headlineLines.length * headlineSize * 1.22;
    const bodyHeight = bodyLines.reduce(
      (acc, l) => acc + (l === '' ? bodyFontSize * 0.75 : bodyLineHeight),
      0
    );
    const totalContentHeight = headlineHeight + 50 + bodyHeight;
    const availableSpan = footerY - headerRuleY - 80;
    let y =
      headerRuleY +
      60 +
      Math.max(10, (availableSpan - totalContentHeight) * 0.42) +
      headlineSize * 0.65;

    ctx.fillStyle = preset.accentColor;
    ctx.font = `600 ${headlineSize}px "Fraunces", Georgia, serif`;
    for (const line of headlineLines) {
      ctx.fillText(line, contentLeft, y);
      y += headlineSize * 1.22;
    }

    y += 28;
    ctx.fillStyle = preset.textColor;
    ctx.font = `${isPrayer ? '400 italic' : '400'} ${bodyFontSize}px ${bodyFontFamily}`;
    for (const line of bodyLines) {
      if (line === '') {
        y += bodyFontSize * 0.75;
      } else {
        ctx.fillText(line, contentLeft, y);
        y += bodyLineHeight;
      }
    }

    if (slide.subnote) {
      ctx.fillStyle = preset.mutedColor;
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(slide.subnote, contentLeft, Math.min(footerY - 62, y + 36));
    }
  }

  // Progress bar dots & footer brand
  const dotsY = footerY - 36;
  const totalDots = slide.totalPages;
  const dotSpacing = 24;
  const dotsStartX = width / 2 - ((totalDots - 1) * dotSpacing) / 2;
  for (let i = 0; i < totalDots; i++) {
    const active = i + 1 === slide.pageNumber;
    ctx.fillStyle = active ? preset.accentColor : preset.borderColor;
    ctx.beginPath();
    ctx.arc(dotsStartX + i * dotSpacing, dotsY, active ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = preset.mutedColor;
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('IEB Horta · @iebhorta', inset + 46, footerY + 14);

  ctx.textAlign = 'right';
  ctx.fillStyle = preset.accentColor;
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  const rightCue =
    slide.pageNumber < slide.totalPages ? 'Deslize →' : 'biblia-horta.vercel.app';
  ctx.fillText(rightCue, width - inset - 46, footerY + 14);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export const DevotionalCarouselModal: React.FC<DevotionalCarouselModalProps> = ({
  isOpen,
  onClose,
  devotional,
  verseText,
  versionLabel,
  initialPageCount = 4,
}) => {
  const [pageCount, setPageCount] = useState<DevotionalCarouselPageCount>(initialPageCount);
  const [format, setFormat] = useState<CarouselFormat>('portrait');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SHARE_BACKGROUNDS[0].id);
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const touchStartXRef = useRef<number | null>(null);

  const slides = useMemo(() => {
    if (!devotional) return [];
    return buildDevotionalCarouselSlides(devotional, verseText, pageCount);
  }, [devotional, verseText, pageCount]);

  const filteredPresets = useMemo(
    () => filterShareBackgrounds(searchQuery, 'all', SHARE_BACKGROUNDS),
    [searchQuery]
  );

  const activePreset =
    SHARE_BACKGROUNDS.find((p) => p.id === selectedPresetId) ?? SHARE_BACKGROUNDS[0];

  // Auto-suggest atmospheric background when opening for a devotional
  useEffect(() => {
    if (!isOpen || !devotional) return;
    setPageCount(initialPageCount);
    setActiveSlideIndex(0);
    setSearchQuery('');
    const refLabel = formatDevotionalReference(devotional);
    const suggested = suggestBackgroundForVerse(
      `${devotional.title} ${verseText}`,
      refLabel,
      SHARE_BACKGROUNDS
    );
    setSelectedPresetId(suggested.preset.id);
  }, [isOpen, devotional, verseText, initialPageCount]);

  // Clamp active slide index when switching between 3 and 4 pages
  useEffect(() => {
    if (activeSlideIndex >= pageCount) {
      setActiveSlideIndex(pageCount - 1);
    }
  }, [pageCount, activeSlideIndex]);

  // Escape & arrow keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setActiveSlideIndex((prev) => Math.min(pageCount - 1, prev + 1));
      }
      if (e.key === 'ArrowLeft') {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, pageCount]);

  // Render all 3 or 4 high-resolution slides whenever devotional, pageCount, format, or preset changes
  useEffect(() => {
    if (!isOpen || !devotional || slides.length === 0) return;

    let cancelled = false;
    setIsRendering(true);

    const renderAllSlides = (bgImage?: HTMLImageElement) => {
      if (cancelled) return;
      const urls = slides.map((slide) =>
        drawSlideToDataUrl(slide, activePreset, format, versionLabel, bgImage)
      );
      setSlideUrls(urls);
      setIsRendering(false);
    };

    if (activePreset.type === 'photo' && activePreset.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => renderAllSlides(img);
      img.onerror = () => renderAllSlides(undefined);
      img.src = activePreset.imageUrl;
    } else {
      renderAllSlides(undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, devotional, slides, activePreset, format, versionLabel]);

  if (!isOpen || !devotional || typeof document === 'undefined') return null;

  const currentUrl = slideUrls[activeSlideIndex] ?? '';
  const slug = devotional.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleDownloadCurrent = () => {
    if (!currentUrl) return;
    const link = document.createElement('a');
    link.href = currentUrl;
    link.download = `iebhorta-${slug}-pagina-${activeSlideIndex + 1}-de-${pageCount}.png`;
    link.click();
    flashStatus(`Página ${activeSlideIndex + 1} de ${pageCount} guardada em PNG.`);
  };

  const handleDownloadAll = async () => {
    if (slideUrls.length === 0 || isExportingAll) return;
    setIsExportingAll(true);
    try {
      for (let i = 0; i < slideUrls.length; i++) {
        const url = slideUrls[i];
        if (!url) continue;
        const link = document.createElement('a');
        link.href = url;
        link.download = `iebhorta-${slug}-pagina-${i + 1}-de-${pageCount}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise((res) => window.setTimeout(res, 240));
      }
      flashStatus(`Todas as ${pageCount} páginas do carrossel foram descarregadas.`);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleShareCarousel = async () => {
    const caption = buildDevotionalShareCaption(devotional, verseText);

    if (navigator.share && slideUrls.length > 0) {
      try {
        const files: File[] = [];
        for (let i = 0; i < slideUrls.length; i++) {
          const res = await fetch(slideUrls[i]);
          const blob = await res.blob();
          files.push(
            new File([blob], `iebhorta-${slug}-p${i + 1}.png`, { type: 'image/png' })
          );
        }

        if (navigator.canShare && navigator.canShare({ files })) {
          await navigator.share({
            title: `${devotional.title} · Devocional IEB Horta`,
            text: caption,
            files,
          });
          return;
        }

        // Fallback: share current page image if multi-file share isn't supported
        if (files[activeSlideIndex] && navigator.canShare?.({ files: [files[activeSlideIndex]] })) {
          await navigator.share({
            title: `${devotional.title} (${activeSlideIndex + 1}/${pageCount})`,
            text: caption,
            files: [files[activeSlideIndex]],
          });
          return;
        }

        await navigator.share({
          title: `${devotional.title} · IEB Horta`,
          text: caption,
        });
        return;
      } catch {
        // User cancelled or browser blocked native share; fall through to copy caption
      }
    }

    try {
      await navigator.clipboard.writeText(caption);
      flashStatus('Legenda do devocional copiada. Use «Descarregar Todas» para publicar o carrossel.');
    } catch {
      await handleDownloadAll();
    }
  };

  const handleCopyCaption = async () => {
    const caption = buildDevotionalShareCaption(devotional, verseText);
    try {
      await navigator.clipboard.writeText(caption);
      flashStatus('Legenda completa copiada para colar no Instagram ou WhatsApp.');
    } catch {
      flashStatus('Não foi possível copiar automaticamente.');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="devotional-carousel-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Carrossel Devocional · {formatDevotionalReference(devotional)}</span>
            </p>
            <h2
              id="devotional-carousel-modal-title"
              className="font-display text-xl sm:text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 leading-tight"
            >
              {devotional.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar estúdio de carrossel devocional"
            className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Count (3 or 4) + Format Selectors */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div
            className="sm:col-span-5 flex items-center gap-1 p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#0C1320]"
            role="group"
            aria-label="Número de páginas do carrossel"
          >
            {([3, 4] as const).map((count) => {
              const active = pageCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPageCount(count)}
                  aria-pressed={active}
                  className={`flex-1 min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    active
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                  }`}
                >
                  {count} Páginas
                </button>
              );
            })}
          </div>

          <div
            className="sm:col-span-7 flex items-center gap-1 p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#0C1320]"
            role="group"
            aria-label="Formato das imagens do carrossel"
          >
            {(['portrait', 'square', 'story'] as const).map((fmt) => {
              const active = format === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  aria-pressed={active}
                  className={`flex-1 min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    active
                      ? 'bg-[#FAF8F4] dark:bg-[#1B2B44] text-[#13294B] dark:text-[#FAF8F4] shadow-xs font-semibold'
                      : 'text-[#556173] dark:text-[#A3B0C2]'
                  }`}
                >
                  {FORMAT_DIMENSIONS[fmt].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Swipeable Carousel Preview */}
        <div
          className="mt-4 rounded-xl bg-[#EAE4D9]/70 dark:bg-[#0C1320] p-4 flex flex-col items-center gap-3 select-none"
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
            const delta = endX - touchStartXRef.current;
            touchStartXRef.current = null;
            if (delta < -40) {
              setActiveSlideIndex((prev) => Math.min(pageCount - 1, prev + 1));
            } else if (delta > 40) {
              setActiveSlideIndex((prev) => Math.max(0, prev - 1));
            }
          }}
        >
          <div className="w-full flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              aria-label="Página anterior do carrossel"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] flex items-center justify-center text-[#13294B] dark:text-[#F2EFE9] disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
              {!isRendering && currentUrl ? (
                <img
                  src={currentUrl}
                  alt={`Página ${activeSlideIndex + 1} de ${pageCount}: ${slides[activeSlideIndex]?.headline ?? ''}`}
                  className={`rounded-lg shadow-md object-contain ${FORMAT_DIMENSIONS[format].aspectClass}`}
                />
              ) : (
                <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
                  A gerar as {pageCount} páginas do carrossel...
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveSlideIndex((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={activeSlideIndex >= pageCount - 1}
              aria-label="Página seguinte do carrossel"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] flex items-center justify-center text-[#13294B] dark:text-[#F2EFE9] disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slide Thumbnails / Page Switcher */}
          <div
            className={`w-full grid gap-2 pt-1 ${
              pageCount === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {slides.map((s, idx) => {
              const active = idx === activeSlideIndex;
              return (
                <button
                  key={`${s.pageNumber}-${s.kind}`}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  aria-pressed={active}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    active
                      ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#FAF8F4] dark:bg-[#1B2B44] text-[#13294B] dark:text-[#FAF8F4]'
                      : 'border-[#141E2E]/12 dark:border-white/12 bg-transparent text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="block text-[11px] font-semibold tabular-nums">
                    Página {s.pageNumber}/{s.totalPages}
                  </span>
                  <span className="block text-[11px] truncate opacity-85">
                    {s.kind === 'cover'
                      ? 'Capa & Versículo'
                      : s.kind === 'reflection'
                        ? 'Reflexão'
                        : s.kind === 'application'
                          ? 'Aplicação'
                          : 'Oração'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Background Picker (reuses all 32 curated backgrounds) */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
              Fundo do Carrossel ({SHARE_BACKGROUNDS.length} opções)
            </span>
            <div className="relative sm:w-64">
              <Search
                className="w-3.5 h-3.5 text-[#556173] dark:text-[#A3B0C2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar fundo (cruz, paz, bíblia)..."
                aria-label="Filtrar fundo do carrossel"
                className="w-full min-h-[40px] pl-8 pr-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-white dark:bg-[#0C1320] text-base sm:text-xs text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredPresets.map((preset) => {
              const selected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  aria-pressed={selected}
                  className={`shrink-0 min-h-[48px] pl-1.5 pr-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    selected
                      ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44]'
                      : 'border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#0C1320] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg shrink-0 bg-gradient-to-br ${preset.swatchStyle} overflow-hidden border border-black/10 dark:border-white/15`}
                  >
                    {preset.imageUrl ? (
                      <img
                        src={preset.imageUrl}
                        alt={preset.label}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] whitespace-nowrap">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {statusMessage && (
          <p
            role="status"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7]"
          >
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{statusMessage}</span>
          </p>
        )}

        {/* Export & Share Actions */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => void handleShareCarousel()}
            disabled={isRendering || slideUrls.length === 0}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Partilhar Carrossel ({pageCount} págs)</span>
          </button>

          <button
            type="button"
            onClick={() => void handleDownloadAll()}
            disabled={isRendering || isExportingAll || slideUrls.length === 0}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#13294B]/20 dark:border-white/15 bg-[#F4F0E8] dark:bg-[#0C1320] text-sm font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isExportingAll ? 'A guardar páginas...' : `Descarregar Todas (${pageCount} PNG)`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCurrent}
            disabled={isRendering || !currentUrl}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/12 dark:border-white/12 text-xs font-medium text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Descarregar Apenas Página {activeSlideIndex + 1}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopyCaption()}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/12 dark:border-white/12 text-xs font-medium text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Copiar Legenda do Devocional</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
