import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, ImagePlus, Share2, X } from 'lucide-react';
import { CHURCH_INFO } from '../data/churchData';

interface VerseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceLabel: string;
  verseText: string;
  versionLabel: string;
}

type CardFormat = 'square' | 'story';

interface ShareBackgroundPreset {
  id: string;
  label: string;
  subtitle: string;
  type: 'photo' | 'theme';
  imageUrl?: string;
  bgGradient: [string, string, string];
  scrim: [string, string, string];
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  swatchStyle: string;
}

const SHARE_BG_PRESETS: ShareBackgroundPreset[] = [
  {
    id: 'amanhecer-pico',
    label: 'Amanhecer',
    subtitle: 'Fotografia · Nascer do Sol',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareDawn,
    bgGradient: ['#2B1E19', '#191417', '#0D1320'],
    scrim: ['rgba(16, 20, 30, 0.68)', 'rgba(18, 22, 34, 0.56)', 'rgba(10, 14, 24, 0.86)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.48)',
    swatchStyle: 'from-[#A66E4E] to-[#1D2538]',
  },
  {
    id: 'luz-montanhas',
    label: 'Montanhas',
    subtitle: 'Fotografia · Montes e Mar',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareMountainLight,
    bgGradient: ['#14262E', '#0F1E28', '#09131C'],
    scrim: ['rgba(10, 20, 28, 0.68)', 'rgba(12, 24, 34, 0.56)', 'rgba(8, 16, 24, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(212, 168, 78, 0.48)',
    swatchStyle: 'from-[#2D4D3E] to-[#102030]',
  },
  {
    id: 'biblia-janela',
    label: 'Palavra & Luz',
    subtitle: 'Fotografia · Bíblia e Oceano',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.shareOpenBible,
    bgGradient: ['#1E1915', '#141316', '#0B0E14'],
    scrim: ['rgba(15, 14, 16, 0.72)', 'rgba(16, 16, 20, 0.60)', 'rgba(10, 12, 18, 0.90)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(236, 203, 123, 0.45)',
    swatchStyle: 'from-[#4F3B27] to-[#131722]',
  },
  {
    id: 'faial-mar',
    label: 'Mar do Faial',
    subtitle: 'Fotografia · Costa Atlântica',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.heroVerse,
    bgGradient: ['#0E1C33', '#13294B', '#091324'],
    scrim: ['rgba(10, 20, 36, 0.72)', 'rgba(12, 24, 44, 0.56)', 'rgba(9, 18, 34, 0.88)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(212, 168, 78, 0.45)',
    swatchStyle: 'from-[#173763] to-[#0C1A30]',
  },
  {
    id: 'capela-horta',
    label: 'Capela Horta',
    subtitle: 'Fotografia · Comunidade',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.sanctuary,
    bgGradient: ['#231A12', '#17120D', '#0F0B08'],
    scrim: ['rgba(20, 15, 10, 0.74)', 'rgba(24, 18, 12, 0.58)', 'rgba(15, 11, 8, 0.88)'],
    accentColor: '#ECCB7B',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(236, 203, 123, 0.45)',
    swatchStyle: 'from-[#4A3520] to-[#1F160E]',
  },
  {
    id: 'escrituras',
    label: 'Estudo',
    subtitle: 'Fotografia · Mesa de Estudo',
    type: 'photo',
    imageUrl: CHURCH_INFO.images.studyStill,
    bgGradient: ['#1E242B', '#141A22', '#0D1117'],
    scrim: ['rgba(16, 22, 31, 0.76)', 'rgba(18, 25, 35, 0.62)', 'rgba(12, 17, 25, 0.90)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.80)',
    borderColor: 'rgba(212, 168, 78, 0.45)',
    swatchStyle: 'from-[#3B4754] to-[#171E26]',
  },
  {
    id: 'atlantico-profundo',
    label: 'Atlântico',
    subtitle: 'Editorial · Noite no Canal',
    type: 'theme',
    bgGradient: ['#193A69', '#13294B', '#091527'],
    scrim: ['rgba(19, 41, 75, 0.15)', 'rgba(15, 31, 58, 0.25)', 'rgba(9, 21, 39, 0.45)'],
    accentColor: '#E5BE6D',
    textColor: '#FAF8F4',
    mutedColor: 'rgba(250, 248, 244, 0.78)',
    borderColor: 'rgba(212, 168, 78, 0.42)',
    swatchStyle: 'from-[#193A69] to-[#0B192E]',
  },
  {
    id: 'papel-marfim',
    label: 'Papel Marfim',
    subtitle: 'Clássico · Papel de Imprensa',
    type: 'theme',
    bgGradient: ['#FAF8F4', '#F3EFE6', '#EAE3D5'],
    scrim: ['rgba(250, 248, 244, 0)', 'rgba(243, 239, 230, 0)', 'rgba(234, 227, 213, 0)'],
    accentColor: '#8C6218',
    textColor: '#13294B',
    mutedColor: 'rgba(20, 30, 46, 0.72)',
    borderColor: 'rgba(19, 41, 75, 0.22)',
    swatchStyle: 'from-[#FAF8F4] to-[#E5DEC9]',
  },
];

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
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SHARE_BG_PRESETS[0].id);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePreset =
    SHARE_BG_PRESETS.find((p) => p.id === selectedPresetId) ?? SHARE_BG_PRESETS[0];

  const handleUploadCustomPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomPhotoUrl(reader.result);
        setSelectedPresetId('custom-photo');
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
          ...SHARE_BG_PRESETS[0],
          id: 'custom-photo',
          label: 'Foto Própria',
          subtitle: 'Personalizada',
          type: 'photo',
          imageUrl: customPhotoUrl,
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
      const isLightCard = preset.id === 'papel-marfim';
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
  }, [isOpen, format, selectedPresetId, customPhotoUrl, activePreset, referenceLabel, verseText, versionLabel]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="share-modal-title"
              className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              Partilhar como Imagem
            </h2>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-0.5">
              {referenceLabel} · {versionLabel} · Escolha a fotografia ou fundo abaixo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de partilha"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
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

        {/* Photo & Editorial Background Selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
              Fotografia e Estilo de Fundo
            </span>
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
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#13294B]/20 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Usar foto da galeria</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SHARE_BG_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  aria-pressed={isSelected}
                  className={`min-h-[54px] p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    isSelected
                      ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44] ring-1 ring-[#13294B] dark:ring-[#D4A84E]'
                      : 'border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#0C1320] hover:bg-[#EFE9DD]/60 dark:hover:bg-[#17253B]'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-lg shrink-0 bg-gradient-to-br ${preset.swatchStyle} border border-black/10 dark:border-white/15 overflow-hidden flex items-center justify-center`}
                  >
                    {preset.imageUrl ? (
                      <img
                        src={preset.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] truncate">
                      {preset.label}
                    </span>
                    <span className="block text-[10px] text-[#556173] dark:text-[#A3B0C2] truncate">
                      {preset.type === 'photo' ? 'Fotografia' : 'Editorial'}
                    </span>
                  </span>
                </button>
              );
            })}

            {customPhotoUrl && (
              <button
                type="button"
                onClick={() => setSelectedPresetId('custom-photo')}
                aria-pressed={selectedPresetId === 'custom-photo'}
                className={`min-h-[54px] p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                  selectedPresetId === 'custom-photo'
                    ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44] ring-1 ring-[#13294B] dark:ring-[#D4A84E]'
                    : 'border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#0C1320]'
                }`}
              >
                <span className="w-9 h-9 rounded-lg shrink-0 overflow-hidden border border-black/10 dark:border-white/15">
                  <img
                    src={customPhotoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] truncate">
                    Foto Própria
                  </span>
                  <span className="block text-[10px] text-[#556173] dark:text-[#A3B0C2] truncate">
                    Personalizada
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-4 flex justify-center bg-[#EAE4D9]/60 dark:bg-[#0C1320] rounded-xl p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Cartão visual com ${referenceLabel}`}
              className={`rounded-lg shadow-md object-contain ${
                format === 'square' ? 'max-h-[320px] aspect-square' : 'max-h-[360px] aspect-[9/16]'
              }`}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-[#556173] dark:text-[#A3B0C2]">
              A gerar cartão visual...
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

