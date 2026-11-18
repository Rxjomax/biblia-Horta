import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Compass, Download, ImagePlus, Search, Share2, X } from 'lucide-react';
import {
  SHARE_BACKGROUNDS,
  SHARE_QUICK_TOPICS,
  type ShareBackgroundPreset,
  type ShareCategoryFilter,
  filterShareBackgrounds,
  normalizeShareText,
  suggestBackgroundForVerse,
} from '../utils/shareBackgrounds';

interface VerseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceLabel: string;
  verseText: string;
  versionLabel: string;
}

type CardFormat = 'square' | 'story';

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

  // Cross behind
  ctx.fillStyle = crossColor;
  ctx.beginPath();
  ctx.roundRect(282, 68, 68, 410, 8);
  ctx.roundRect(128, 208, 376, 68, 8);
  ctx.fill();

  // Whale fluke path
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

export const VerseShareModal: React.FC<VerseShareModalProps> = ({
  isOpen,
  onClose,
  referenceLabel,
  verseText,
  versionLabel,
}) => {
  const [format, setFormat] = useState<CardFormat>('square');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<ShareCategoryFilter>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SHARE_BACKGROUNDS[0].id);
  const [matchReason, setMatchReason] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPresets = useMemo(
    () => filterShareBackgrounds(searchQuery, categoryFilter, SHARE_BACKGROUNDS),
    [searchQuery, categoryFilter]
  );

  const activePreset =
    SHARE_BACKGROUNDS.find((p) => p.id === selectedPresetId) ?? SHARE_BACKGROUNDS[0];

  // Auto-suggest an atmospheric match when opening for a verse
  useEffect(() => {
    if (!isOpen) return;
    const suggested = suggestBackgroundForVerse(verseText, referenceLabel, SHARE_BACKGROUNDS);
    setSelectedPresetId(suggested.preset.id);
    setSearchQuery('');
    setCategoryFilter('all');
    setMatchReason(
      suggested.matchedKeyword
        ? `Sugerido pelo tema «${suggested.matchedKeyword}»`
        : 'Sugerido para este versículo'
    );
  }, [isOpen, referenceLabel, verseText]);

  // Escape key closes dialog cleanly
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleApplyKeywordQuery = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setMatchReason('');
      return;
    }
    const matches = filterShareBackgrounds(trimmed, categoryFilter, SHARE_BACKGROUNDS);
    if (matches.length > 0) {
      setSelectedPresetId(matches[0].id);
      setMatchReason(`Combinado com «${trimmed}»`);
    } else {
      setMatchReason('');
    }
  };

  const handleCategoryChange = (nextCategory: ShareCategoryFilter) => {
    setCategoryFilter(nextCategory);
    const matches = filterShareBackgrounds(searchQuery, nextCategory, SHARE_BACKGROUNDS);
    if (matches.length > 0 && !matches.some((m) => m.id === selectedPresetId)) {
      setSelectedPresetId(matches[0].id);
    }
  };

  const handleSuggestByVerse = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    const suggested = suggestBackgroundForVerse(verseText, referenceLabel, SHARE_BACKGROUNDS);
    setSelectedPresetId(suggested.preset.id);
    setMatchReason(
      suggested.matchedKeyword
        ? `Combinado com «${suggested.matchedKeyword}» do versículo`
        : 'Sugestão para o versículo'
    );
  };

  const handleUploadCustomPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoUrl(reader.result);
        setSelectedPresetId('custom-photo');
        setMatchReason('Fotografia selecionada do dispositivo');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const width = 1080;
    const height = format === 'square' ? 1080 : 1920;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isCustom = selectedPresetId === 'custom-photo' && Boolean(customPhotoUrl);
    const preset: ShareBackgroundPreset = isCustom
      ? {
          ...SHARE_BACKGROUNDS[0],
          id: 'custom-photo',
          label: 'Foto Própria',
          subtitle: 'Personalizada',
          type: 'photo',
          imageUrl: customPhotoUrl,
          isLight: false,
        }
      : activePreset;

    const renderCard = (bgImage?: HTMLImageElement) => {
      if (cancelled) return;

      // Base background gradient
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, preset.bgGradient[0]);
      baseGrad.addColorStop(0.5, preset.bgGradient[1]);
      baseGrad.addColorStop(1, preset.bgGradient[2]);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

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

      // Scrim for >= 4.5:1 legibility
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, preset.scrim[0]);
      grad.addColorStop(0.5, preset.scrim[1]);
      grad.addColorStop(1, preset.scrim[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle border inset
      const inset = 56;
      ctx.strokeStyle = preset.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

      // Top IEBH Emblem watermark
      const isLightCard = Boolean(preset.isLight);
      drawIebhWatermark(
        ctx,
        width / 2,
        format === 'square' ? 118 : 210,
        0.16,
        isLightCard ? '#B8862D' : '#D4A84E',
        isLightCard ? '#13294B' : '#FAF8F4',
        isLightCard ? '#F3EFE6' : '#13294B'
      );

      // Header label
      ctx.fillStyle = preset.accentColor;
      ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IEB HORTA  ·  PALAVRA DE DEUS', width / 2, format === 'square' ? 195 : 295);

      // Wrapped verse text
      ctx.fillStyle = preset.textColor;
      const fontSize = verseText.length > 220 ? 38 : verseText.length > 150 ? 44 : 52;
      ctx.font = `500 ${fontSize}px "Fraunces", Georgia, serif`;
      const maxTextWidth = width - 200;
      const words = `«${verseText}»`.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.42;
      const totalBlockHeight = lines.length * lineHeight;
      let startY = (height - totalBlockHeight) / 2 + fontSize * 0.45;

      for (const line of lines) {
        ctx.fillText(line, width / 2, startY);
        startY += lineHeight;
      }

      // Reference & translation
      ctx.fillStyle = preset.accentColor;
      ctx.font = '600 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${referenceLabel} (${versionLabel})`, width / 2, startY + 44);

      // Footer
      ctx.fillStyle = preset.mutedColor;
      ctx.font = '500 25px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        'Igreja Evangélica Baptista da Horta  ·  @iebhorta',
        width / 2,
        height - (format === 'square' ? 105 : 175)
      );

      try {
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch {
        setPreviewUrl('');
      }
    };

    if (preset.type === 'photo' && preset.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => renderCard(img);
      img.onerror = () => renderCard(undefined);
      img.src = preset.imageUrl;
    } else {
      renderCard(undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    format,
    selectedPresetId,
    customPhotoUrl,
    activePreset,
    referenceLabel,
    verseText,
    versionLabel,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    const slug = referenceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `iebhorta-${slug}-${format}.png`;
    link.click();
    setStatusMessage('Imagem guardada no dispositivo.');
    window.setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleNativeShare = async () => {
    const shareText = `«${verseText}» — ${referenceLabel} (${versionLabel}) | IEB Horta (@iebhorta)`;
    if (navigator.share) {
      try {
        if (previewUrl && navigator.canShare) {
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          const file = new File([blob], `iebhorta-${format}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: referenceLabel,
              text: shareText,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: referenceLabel,
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share unsupported; fall back to copy text
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setStatusMessage('Texto do versículo copiado para partilhar.');
      window.setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      handleDownload();
    }
  };

  const photoCount = SHARE_BACKGROUNDS.filter((p) => p.type === 'photo').length;
  const themeCount = SHARE_BACKGROUNDS.filter((p) => p.type === 'theme').length;
  const normalizedCurrentQuery = normalizeShareText(searchQuery);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              Partilhar como Imagem
            </h2>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-0.5">
              {referenceLabel} · {versionLabel}
              {matchReason ? ` · ${matchReason}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de partilha"
            className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format toggle */}
        <div className="mt-4 flex items-center gap-2 p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#0C1320]">
          <button
            type="button"
            onClick={() => setFormat('square')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              format === 'square'
                ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
            }`}
          >
            Quadrado (1:1 · Publicação)
          </button>
          <button
            type="button"
            onClick={() => setFormat('story')}
            className={`flex-1 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              format === 'story'
                ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
            }`}
          >
            Vertical (9:16 · Stories)
          </button>
        </div>

        {/* Keyword search + smart verse match + gallery upload */}
        <div className="mt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
              Repertório de Fundos ({SHARE_BACKGROUNDS.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSuggestByVerse}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#B8862D]/35 bg-[#EFE9DD]/70 dark:bg-[#1B2B44] text-xs font-medium text-[#13294B] dark:text-[#ECCB7B] hover:bg-[#EFE9DD] dark:hover:bg-[#233654] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Combinar com versículo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadCustomPhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#13294B]/20 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Foto da galeria</span>
              </button>
            </div>
          </div>

          {/* Keyword input + Category tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="relative sm:col-span-6">
              <Search
                className="w-4 h-4 text-[#556173] dark:text-[#A3B0C2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleApplyKeywordQuery(e.target.value)}
                placeholder="Palavra-chave (paz, luz, mar)..."
                aria-label="Filtrar fundos por palavra-chave"
                className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-white dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] placeholder:text-[#556173]/75 dark:placeholder:text-[#A3B0C2]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleApplyKeywordQuery('')}
                  aria-label="Limpar palavra-chave"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="sm:col-span-6 flex items-center gap-1 p-1 rounded-xl bg-[#EAE4D9]/80 dark:bg-[#0C1320]">
              {(
                [
                  { id: 'all', label: `Todos (${SHARE_BACKGROUNDS.length})` },
                  { id: 'photo', label: `Fotos (${photoCount})` },
                  { id: 'theme', label: `Editoriais (${themeCount})` },
                ] as const
              ).map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleCategoryChange(tab.id)}
                    aria-pressed={active}
                    className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                      active
                        ? 'bg-[#FAF8F4] dark:bg-[#1B2B44] text-[#13294B] dark:text-[#FAF8F4] shadow-xs'
                        : 'text-[#556173] dark:text-[#A3B0C2] hover:text-[#13294B] dark:hover:text-[#FAF8F4]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick thematic filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SHARE_QUICK_TOPICS.map((topic) => {
              const isTopicActive = normalizedCurrentQuery === normalizeShareText(topic.query);
              return (
                <button
                  key={topic.query}
                  type="button"
                  onClick={() =>
                    handleApplyKeywordQuery(isTopicActive ? '' : topic.query)
                  }
                  aria-pressed={isTopicActive}
                  className={`shrink-0 min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    isTopicActive
                      ? 'border-[#13294B] bg-[#13294B] text-[#FAF8F4] dark:border-[#D4A84E] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'border-[#141E2E]/15 dark:border-white/15 bg-transparent text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-[#EFE9DD] dark:hover:bg-[#1B2B44]'
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          {/* Repertoire grid */}
          {filteredPresets.length === 0 && !customPhotoUrl ? (
            <div className="rounded-xl border border-dashed border-[#141E2E]/20 dark:border-white/15 p-4 text-center">
              <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                Nenhum fundo corresponde a «{searchQuery}».
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="mt-2 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium"
              >
                Mostrar todos os {SHARE_BACKGROUNDS.length} fundos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setMatchReason(
                        preset.type === 'photo'
                          ? `Fotografia · ${preset.subtitle}`
                          : preset.subtitle
                      );
                    }}
                    aria-pressed={isSelected}
                    className={`min-h-[56px] p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                      isSelected
                        ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44] ring-1 ring-[#13294B] dark:ring-[#D4A84E]'
                        : 'border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#0C1320] hover:bg-[#EFE9DD]/60 dark:hover:bg-[#17253B]'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-lg shrink-0 bg-gradient-to-br ${preset.swatchStyle} border border-black/10 dark:border-white/15 overflow-hidden flex items-center justify-center`}
                    >
                      {preset.imageUrl ? (
                        <img
                          src={preset.imageUrl}
                          alt={preset.label}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] leading-tight">
                        {preset.label}
                      </span>
                      <span className="block text-[11px] text-[#556173] dark:text-[#A3B0C2] truncate mt-0.5">
                        {preset.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}

              {customPhotoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPresetId('custom-photo');
                    setMatchReason('Fotografia selecionada do dispositivo');
                  }}
                  aria-pressed={selectedPresetId === 'custom-photo'}
                  className={`min-h-[56px] p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    selectedPresetId === 'custom-photo'
                      ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44] ring-1 ring-[#13294B] dark:ring-[#D4A84E]'
                      : 'border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#0C1320]'
                  }`}
                >
                  <span className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-black/10 dark:border-white/15">
                    <img
                      src={customPhotoUrl}
                      alt="Foto Própria"
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] leading-tight">
                      Foto Própria
                    </span>
                    <span className="block text-[11px] text-[#556173] dark:text-[#A3B0C2] truncate mt-0.5">
                      Personalizada
                    </span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-4 flex justify-center bg-[#EAE4D9]/60 dark:bg-[#0C1320] rounded-xl p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Cartão visual com ${referenceLabel}`}
              className={`rounded-lg shadow-md object-contain ${
                format === 'square' ? 'max-h-[260px] aspect-square' : 'max-h-[300px] aspect-[9/16]'
              }`}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-[#556173] dark:text-[#A3B0C2]">
              A preparar cartão visual...
            </div>
          )}
        </div>

        {statusMessage && (
          <p
            role="status"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7]"
          >
            <Check className="w-4 h-4" />
            <span>{statusMessage}</span>
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#13294B]/20 dark:border-white/15 text-sm font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Descarregar PNG</span>
          </button>
          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            <span>Partilhar Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
