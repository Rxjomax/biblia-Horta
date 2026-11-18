import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Share2, X } from 'lucide-react';
import { CHURCH_INFO } from '../data/churchData';

interface VerseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceLabel: string;
  verseText: string;
  versionLabel: string;
}

type CardFormat = 'square' | 'story';

export const VerseShareModal: React.FC<VerseShareModalProps> = ({
  isOpen,
  onClose,
  referenceLabel,
  verseText,
  versionLabel,
}) => {
  const [format, setFormat] = useState<CardFormat>('square');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const renderCard = (bgImage?: HTMLImageElement) => {
      if (cancelled) return;

      // Base navy backdrop
      ctx.fillStyle = '#0E1C33';
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
      grad.addColorStop(0, 'rgba(12, 22, 39, 0.72)');
      grad.addColorStop(0.5, 'rgba(12, 22, 39, 0.56)');
      grad.addColorStop(1, 'rgba(12, 22, 39, 0.86)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle golden border inset
      const inset = 56;
      ctx.strokeStyle = 'rgba(212, 168, 78, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

      // Header label
      ctx.fillStyle = '#D4A84E';
      ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IEB HORTA  ·  PALAVRA DO DIA', width / 2, format === 'square' ? 140 : 260);

      // Wrapped verse text
      ctx.fillStyle = '#FAF8F4';
      const fontSize = verseText.length > 160 ? 44 : 54;
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
      let startY = (height - totalBlockHeight) / 2 + fontSize * 0.35;

      for (const line of lines) {
        ctx.fillText(line, width / 2, startY);
        startY += lineHeight;
      }

      // Reference & translation
      ctx.fillStyle = '#D4A84E';
      ctx.font = '600 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${referenceLabel} (${versionLabel})`,
        width / 2,
        startY + 46
      );

      // Footer
      ctx.fillStyle = 'rgba(250, 248, 244, 0.78)';
      ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        'Igreja Evangélica Baptista da Horta  ·  @iebhorta',
        width / 2,
        height - (format === 'square' ? 110 : 180)
      );

      try {
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch {
        setPreviewUrl('');
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => renderCard(img);
    img.onerror = () => renderCard(undefined);
    img.src = CHURCH_INFO.images.heroVerse;

    return () => {
      cancelled = true;
    };
  }, [isOpen, format, referenceLabel, verseText, versionLabel]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="share-modal-title"
              className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              Partilhar como Imagem
            </h2>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-0.5">
              {referenceLabel} · {versionLabel}
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

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-4 flex justify-center bg-[#EAE4D9]/60 dark:bg-[#0C1320] rounded-xl p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Cartão visual com ${referenceLabel}`}
              className={`rounded-lg shadow-md object-contain ${
                format === 'square' ? 'max-h-[340px] aspect-square' : 'max-h-[380px] aspect-[9/16]'
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
