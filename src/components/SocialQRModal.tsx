import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  QrCode,
  RefreshCw,
  Share2,
  X,
} from 'lucide-react';
import {
  SOCIAL_QR_DISPLAY_DOMAIN,
  SOCIAL_QR_MESSAGES,
  SOCIAL_QR_THEMES,
  SOCIAL_QR_URL,
  buildSocialCaption,
  getNextMessagePreset,
  type SocialQRThemePreset,
} from '../utils/socialQrPresets';

type SocialCardFormat = 'story' | 'square';

interface SocialQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function copyTextSafe(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for iOS WebView / restricted contexts
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function drawIebhEmblem(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number,
  crossColor: string,
  flukeColor: string,
  haloColor: string
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-316, -274);

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

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        const rest = [current, ...words.slice(i + 1)].join(' ');
        let trimmed = rest;
        while (trimmed.length > 3 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
          trimmed = trimmed.slice(0, -1).trimEnd();
        }
        lines.push(trimmed === rest ? rest : `${trimmed}…`);
        return lines;
      }
    }
  }
  lines.push(current);
  return lines;
}

export const QRCodeGraphic: React.FC<{
  url?: string;
  size?: number;
  className?: string;
}> = ({ url = SOCIAL_QR_URL, size = 180, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: size * 2,
      color: {
        dark: '#13294B',
        light: '#FFFFFF',
      },
    })
      .then((res) => {
        if (active) setDataUrl(res);
      })
      .catch(() => {
        // Fallback handled silently
      });
    return () => {
      active = false;
    };
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-xl bg-white border border-[#141E2E]/10 flex items-center justify-center text-xs text-[#556173] ${className}`}
      >
        A gerar QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`Código QR para aceder a ${url}`}
      width={size}
      height={size}
      className={`rounded-xl bg-white p-2 border border-[#141E2E]/10 shadow-xs ${className}`}
    />
  );
};

export async function downloadStandaloneQRCode(url = SOCIAL_QR_URL): Promise<void> {
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 3,
    width: 1024,
    color: {
      dark: '#13294B',
      light: '#FFFFFF',
    },
  });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'iebhorta-qrcode-site.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const SocialQRModal: React.FC<SocialQRModalProps> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<SocialCardFormat>('story');
  const [themeId, setThemeId] = useState<string>(SOCIAL_QR_THEMES[0].id);
  const [messagePresetId, setMessagePresetId] = useState<string>(SOCIAL_QR_MESSAGES[0].id);
  const [headline, setHeadline] = useState<string>(SOCIAL_QR_MESSAGES[0].headline);
  const [body, setBody] = useState<string>(SOCIAL_QR_MESSAGES[0].body);
  const [cta, setCta] = useState<string>(SOCIAL_QR_MESSAGES[0].cta);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeTheme: SocialQRThemePreset =
    SOCIAL_QR_THEMES.find((t) => t.id === themeId) ?? SOCIAL_QR_THEMES[0];
  const activePreset =
    SOCIAL_QR_MESSAGES.find((m) => m.id === messagePresetId) ?? SOCIAL_QR_MESSAGES[0];

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectMessagePreset = (presetId: string) => {
    const preset = SOCIAL_QR_MESSAGES.find((m) => m.id === presetId);
    if (!preset) return;
    setMessagePresetId(preset.id);
    setHeadline(preset.headline);
    setBody(preset.body);
    setCta(preset.cta);
  };

  const handleCycleMessage = () => {
    const next = getNextMessagePreset(messagePresetId, SOCIAL_QR_MESSAGES);
    handleSelectMessagePreset(next.id);
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const width = 1080;
    const height = format === 'story' ? 1920 : 1080;
    const isStory = format === 'story';

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const render = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(SOCIAL_QR_URL, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 720,
          color: {
            dark: '#13294B',
            light: '#FFFFFF',
          },
        });
        if (cancelled) return;

        const [qrImg, bgImg] = await Promise.all([
          loadImage(qrDataUrl),
          activeTheme.imageUrl ? loadImage(activeTheme.imageUrl).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;

        // 1. Background gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, activeTheme.bgGradient[0]);
        grad.addColorStop(0.5, activeTheme.bgGradient[1]);
        grad.addColorStop(1, activeTheme.bgGradient[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Optional background photo + editorial scrim
        if (bgImg) {
          const imgAspect = bgImg.width / bgImg.height;
          const canvasAspect = width / height;
          let drawW = width;
          let drawH = height;
          let drawX = 0;
          let drawY = 0;
          if (imgAspect > canvasAspect) {
            drawW = height * imgAspect;
            drawX = (width - drawW) / 2;
          } else {
            drawH = width / imgAspect;
            drawY = (height - drawH) / 2;
          }
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

          ctx.fillStyle = activeTheme.scrimColor || 'rgba(11, 22, 40, 0.72)';
          ctx.fillRect(0, 0, width, height);
        }

        // 3. Refined editorial hairline frame
        const margin = isStory ? 54 : 44;
        ctx.strokeStyle = activeTheme.isLight
          ? 'rgba(19, 41, 75, 0.16)'
          : 'rgba(224, 180, 90, 0.34)';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

        // 4. Emblem + Kicker at top
        const topY = isStory ? 170 : 108;
        drawIebhEmblem(
          ctx,
          width / 2,
          topY,
          isStory ? 0.24 : 0.17,
          activeTheme.isLight ? '#13294B' : '#E0B45A',
          activeTheme.isLight ? '#8C6218' : '#FAF8F4',
          activeTheme.isLight ? '#FAF8F4' : '#13294B'
        );

        ctx.textAlign = 'center';
        ctx.fillStyle = activeTheme.accentColor;
        ctx.font = `600 ${isStory ? 28 : 22}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillText(
          activePreset.kicker,
          width / 2,
          isStory ? topY + 95 : topY + 70
        );

        // 5. Headline (Fraunces editorial serif)
        const headlineY = isStory ? 355 : 238;
        const headlineFontSize = isStory ? 74 : 52;
        ctx.fillStyle = activeTheme.textColor;
        ctx.font = `600 ${headlineFontSize}px "Fraunces", Georgia, serif`;
        const headlineLines = wrapCanvasLines(
          ctx,
          headline || activePreset.headline,
          width - margin * 2 - 110,
          3
        );
        const headlineLineHeight = isStory ? 88 : 62;
        headlineLines.forEach((line, index) => {
          ctx.fillText(line, width / 2, headlineY + index * headlineLineHeight);
        });

        // 6. Body copy
        const bodyStartY = headlineY + headlineLines.length * headlineLineHeight + (isStory ? 24 : 14);
        ctx.fillStyle = activeTheme.mutedColor;
        ctx.font = `400 ${isStory ? 32 : 24}px "Plus Jakarta Sans", system-ui, sans-serif`;
        const bodyLines = wrapCanvasLines(
          ctx,
          body || activePreset.body,
          width - margin * 2 - 140,
          3
        );
        const bodyLineHeight = isStory ? 46 : 34;
        bodyLines.forEach((line, index) => {
          ctx.fillText(line, width / 2, bodyStartY + index * bodyLineHeight);
        });

        // 7. Centerpiece QR Code card (pure white quiet zone for 100% camera scan reliability)
        const qrBoxSize = isStory ? 540 : 370;
        const qrPadding = isStory ? 36 : 26;
        const qrCardW = qrBoxSize + qrPadding * 2;
        const qrCardH = qrCardW + (isStory ? 96 : 74);
        const qrCardX = (width - qrCardW) / 2;
        const qrCardY = isStory
          ? Math.max(bodyStartY + bodyLines.length * bodyLineHeight + 70, 790)
          : Math.max(bodyStartY + bodyLines.length * bodyLineHeight + 34, 425);

        // Subtle card shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 36;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrCardX, qrCardY, qrCardW, qrCardH, 32);
        ctx.fill();
        ctx.restore();

        // Crisp hairline border on QR card
        ctx.strokeStyle = 'rgba(19, 41, 75, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(qrCardX, qrCardY, qrCardW, qrCardH, 32);
        ctx.stroke();

        // Draw high-contrast QR Code inside card
        ctx.drawImage(qrImg, qrCardX + qrPadding, qrCardY + qrPadding, qrBoxSize, qrBoxSize);

        // CTA & clean domain inside the white QR pedestal
        ctx.fillStyle = '#13294B';
        ctx.font = `600 ${isStory ? 26 : 20}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillText(
          cta.trim() || activePreset.cta,
          width / 2,
          qrCardY + qrPadding + qrBoxSize + (isStory ? 36 : 26)
        );

        ctx.fillStyle = '#8C6218';
        ctx.font = `600 ${isStory ? 24 : 18}px "JetBrains Mono", monospace`;
        ctx.fillText(
          SOCIAL_QR_DISPLAY_DOMAIN,
          width / 2,
          qrCardY + qrPadding + qrBoxSize + (isStory ? 74 : 54)
        );

        // 8. Footer church attribution
        const footerY = height - margin - (isStory ? 56 : 34);
        ctx.strokeStyle = activeTheme.isLight
          ? 'rgba(19, 41, 75, 0.14)'
          : 'rgba(250, 248, 244, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 140, footerY - (isStory ? 44 : 32));
        ctx.lineTo(width / 2 + 140, footerY - (isStory ? 44 : 32));
        ctx.stroke();

        ctx.fillStyle = activeTheme.mutedColor;
        ctx.font = `500 ${isStory ? 26 : 20}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillText(
          'Igreja Evangélica Baptista da Horta · @iebhorta · Açores',
          width / 2,
          footerY
        );

        if (!cancelled) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Ignore transient canvas errors
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [isOpen, format, activeTheme, activePreset, headline, body, cta]);

  const showTempFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(''), 3500);
  };

  const handleDownloadCard = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `iebhorta-qrcode-${format === 'story' ? 'story' : 'feed'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showTempFeedback('Cartão com QR Code guardado em alta resolução.');
  };

  const handleShareCard = async () => {
    if (!previewUrl) return;
    const caption = buildSocialCaption(headline || activePreset.headline, body || activePreset.body);
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `iebhorta-qrcode-${format === 'story' ? 'story' : 'feed'}.png`,
        { type: 'image/png' }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'IEB Horta — Aplicação Oficial',
          text: caption,
          files: [file],
        });
        showTempFeedback('Cartão partilhado com sucesso.');
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
    }
    handleDownloadCard();
  };

  const handleDownloadOnlyQR = async () => {
    await downloadStandaloneQRCode(SOCIAL_QR_URL);
    showTempFeedback('QR Code isolado (PNG 1024×1024) descarregado.');
  };

  const handleCopyLink = async () => {
    const ok = await copyTextSafe(SOCIAL_QR_URL);
    if (ok) {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyCaption = async () => {
    const caption = buildSocialCaption(headline || activePreset.headline, body || activePreset.body);
    const ok = await copyTextSafe(caption);
    if (ok) {
      setCopiedCaption(true);
      window.setTimeout(() => setCopiedCaption(false), 3000);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-qr-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl max-h-[94dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/12 dark:border-white/12 p-5 sm:p-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#141E2E]/10 dark:border-white/10">
          <div>
            <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
              Divulgação para Instagram, WhatsApp e Facebook
            </p>
            <h2
              id="social-qr-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 leading-tight"
            >
              QR Code da IEB Horta para Redes Sociais
            </h2>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-1 font-mono">
              Destino do QR Code: {SOCIAL_QR_URL}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar gerador de QR Code"
            className="min-h-[44px] min-w-[44px] -mt-1 -mr-1 flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 2-column Studio Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Live Card Preview */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3">
            <div className="w-full rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#EFE9DD]/70 dark:bg-[#0C1320] p-4 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização do cartão com QR Code da IEB Horta"
                  className={`rounded-xl shadow-lg border border-[#141E2E]/10 dark:border-white/10 object-contain ${
                    format === 'story' ? 'max-h-[460px] w-auto' : 'max-h-[380px] w-full'
                  }`}
                />
              ) : (
                <div className="h-[340px] flex items-center justify-center text-sm text-[#556173] dark:text-[#A3B0C2]">
                  A preparar cartão com QR Code...
                </div>
              )}
            </div>

            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
              <span>
                Formato: <strong className="text-[#141E2E] dark:text-[#F2EFE9]">{format === 'story' ? 'Story 9:16 (1080×1920)' : 'Feed 1:1 (1080×1080)'}</strong>
              </span>
              <span className="font-mono text-[11px]">{SOCIAL_QR_DISPLAY_DOMAIN}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-7 space-y-5">
            {/* Format + Theme row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                  Formato para Redes
                </p>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3EFE7] dark:bg-[#0C1320] p-1 border border-[#141E2E]/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormat('story')}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                      format === 'story'
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Story (9:16)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('square')}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                      format === 'square'
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Feed (1:1)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                  Estilo Visual
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SOCIAL_QR_THEMES.map((t) => {
                    const isActive = t.id === activeTheme.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeId(t.id)}
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                          isActive
                            ? 'border-[#13294B] bg-[#13294B] text-[#FAF8F4] dark:border-[#D4A84E] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                            : 'border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/60 dark:bg-[#0C1320] text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Distinct Message Presets */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                  Escolher Mensagem de Convite
                </p>
                <button
                  type="button"
                  onClick={handleCycleMessage}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Trocar Mensagem</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SOCIAL_QR_MESSAGES.map((preset) => {
                  const selected = preset.id === messagePresetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectMessagePreset(preset.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                        selected
                          ? 'border-[#13294B] bg-[#13294B]/8 text-[#13294B] dark:border-[#D4A84E] dark:bg-[#D4A84E]/15 dark:text-[#F2EFE9]'
                          : 'border-[#141E2E]/12 dark:border-white/12 text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Message Fields */}
            <div className="space-y-3 pt-1">
              <div>
                <label
                  htmlFor="qr-headline-input"
                  className="block text-xs font-medium text-[#556173] dark:text-[#A3B0C2] mb-1"
                >
                  Título no Cartão
                </label>
                <input
                  id="qr-headline-input"
                  type="text"
                  maxLength={70}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-white dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>

              <div>
                <label
                  htmlFor="qr-body-input"
                  className="block text-xs font-medium text-[#556173] dark:text-[#A3B0C2] mb-1"
                >
                  Mensagem Complementar
                </label>
                <textarea
                  id="qr-body-input"
                  rows={2}
                  maxLength={140}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-white dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>

              <div>
                <label
                  htmlFor="qr-cta-input"
                  className="block text-xs font-medium text-[#556173] dark:text-[#A3B0C2] mb-1"
                >
                  Chamada abaixo do QR Code
                </label>
                <input
                  id="qr-cta-input"
                  type="text"
                  maxLength={50}
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-white dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>
            </div>

            {/* Primary & Secondary Export Actions */}
            <div className="pt-2 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Baixar Cartão (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleShareCard()}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#13294B]/25 dark:border-[#D4A84E]/35 text-[#13294B] dark:text-[#F2EFE9] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Partilhar nas Redes</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownloadOnlyQR()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <QrCode className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
                  <span>Baixar Só o QR Code (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopyCaption()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {copiedCaption ? (
                    <Check className="w-3.5 h-3.5 text-[#1F5C3A] dark:text-[#6EE7B7]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCaption ? 'Legenda copiada!' : 'Copiar Legenda'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-[#1F5C3A] dark:text-[#6EE7B7]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedLink ? 'Link copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {feedback && (
                <p className="text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7]" role="status">
                  {feedback}
                </p>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
};
