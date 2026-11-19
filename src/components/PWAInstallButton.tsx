import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  Check,
  Compass,
  Copy,
  Download,
  ExternalLink,
  HardDriveDownload,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { BibleVersionId } from '../types';

type GuidePlatform = 'android' | 'ios';

interface PWAInstallButtonProps {
  compact?: boolean;
  shortMobileLabel?: boolean;
  bibleVersion?: BibleVersionId;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for iOS WKWebView / non-focused contexts
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

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  shortMobileLabel = false,
  bibleVersion = 'NVI',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isIPad,
    iosBrowser,
    isInIframe,
    swReady,
    offlineVersions,
    downloadingVersion,
    offlineStatusMessage,
    install,
    downloadBibleForOffline,
  } = usePWAInstall();

  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<GuidePlatform>(isIOS ? 'ios' : 'android');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isCurrentVersionOffline = offlineVersions.includes(bibleVersion);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  useEffect(() => {
    if (!showGuide || typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowGuide(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showGuide]);

  if (isInstalled && compact) {
    return null;
  }

  const handleAndroidClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') return;
    }
    setGuidePlatform('android');
    setShowGuide(true);
  };

  const handleIOSClick = () => {
    setGuidePlatform('ios');
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    const ok = await copyTextToClipboard(currentUrl);
    if (ok) {
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const isMobileHeaderLayout = compact && shortMobileLabel;
  const isSidebarLayout = compact && !shortMobileLabel;

  const modalContent =
    showGuide && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setShowGuide(false);
              }
            }}
          >
            <div className="w-full max-w-md max-h-[88dvh] overflow-y-auto overscroll-contain rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/12 dark:border-white/12 p-4 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                    {guidePlatform === 'ios'
                      ? 'Tutorial para iPhone e iPad (iOS)'
                      : 'Instalação Direta (Android)'}
                  </p>
                  <h3
                    id="pwa-guide-title"
                    className="font-display text-lg sm:text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 leading-snug"
                  >
                    {guidePlatform === 'ios'
                      ? 'Adicionar ao Ecrã Principal'
                      : 'Baixar IEB Horta (Android)'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Fechar instruções de instalação"
                  className="min-h-[44px] min-w-[44px] -mt-1.5 -mr-1.5 flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Switcher */}
              <div
                className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3EFE7] dark:bg-[#0C1320] p-1 border border-[#141E2E]/10 dark:border-white/10"
                role="tablist"
                aria-label="Escolher sistema para instruções"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={guidePlatform === 'android'}
                  onClick={() => setGuidePlatform('android')}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    guidePlatform === 'android'
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Android (Direto)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={guidePlatform === 'ios'}
                  onClick={() => setGuidePlatform('ios')}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    guidePlatform === 'ios'
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  iOS (iPhone / iPad)
                </button>
              </div>

              {isInIframe && (
                <div className="mt-3 rounded-xl border border-[#B8862D]/30 bg-[#F4F0E8] dark:bg-[#0C1320] p-3.5 space-y-2.5">
                  <p className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
                    <span>Janela embutida detetada</span>
                  </p>
                  <p className="text-xs leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                    Por segurança do navegador, abra a aplicação num separador próprio para instalar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center gap-2 hover:opacity-90"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Abrir para Instalar</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl()}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação'}</span>
                    </button>
                  </div>
                </div>
              )}

              {guidePlatform === 'ios' ? (
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                  {isIOS && iosBrowser === 'in-app' && (
                    <div className="rounded-xl border border-[#B8862D]/40 bg-[#F4F0E8] dark:bg-[#0C1320] p-3.5 space-y-2">
                      <p className="text-sm font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
                        <span>Abra primeiro no Safari</span>
                      </p>
                      <p className="text-xs leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                        Abriu a ligação dentro de outra aplicação (WhatsApp/Instagram). Toque na bússola do <strong>Safari</strong> ou em <strong>⋯ → Abrir no Safari</strong>, ou copie abaixo:
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCopyUrl()}
                        className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                      >
                        {copiedUrl ? (
                          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {copiedUrl
                            ? 'Ligação copiada! Cole no Safari'
                            : 'Copiar ligação para abrir no Safari'}
                        </span>
                      </button>
                    </div>
                  )}

                  {isIOS && (iosBrowser === 'chrome' || iosBrowser === 'other') ? (
                    <>
                      <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                        {iosBrowser === 'chrome'
                          ? 'No Chrome para iPhone/iPad (iOS 16.4+), toque em Partilhar no topo direito:'
                          : 'No iPhone/iPad, siga o menu Partilhar ou abra no Safari:'}
                      </p>
                      <ol className="space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            Toque em{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <Share className="w-3.5 h-3.5" aria-hidden="true" /> Partilhar
                            </strong>{' '}
                            junto à barra de endereço.
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Escolha{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" /> Adicionar ao ecrã principal
                            </strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Confirme tocando em <strong className="text-[#141E2E] dark:text-[#F2EFE9]">Adicionar</strong>.
                          </span>
                        </li>
                      </ol>

                      <button
                        type="button"
                        onClick={() => void handleCopyUrl()}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação para abrir no Safari'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                        No iPhone e iPad, a instalação faz-se pelo navegador <strong>Safari</strong> em 3 passos simples:
                      </p>
                      <ol className="space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            No <strong>Safari</strong>, toque em{' '}
                            <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#13294B]/8 dark:bg-white/10 text-[#141E2E] dark:text-[#F2EFE9]">
                              <Share className="w-3.5 h-3.5" aria-hidden="true" /> Partilhar
                            </strong>{' '}
                            na barra {isIPad ? 'superior' : 'inferior'}.
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Deslize e toque em{' '}
                            <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#13294B]/8 dark:bg-white/10 text-[#141E2E] dark:text-[#F2EFE9]">
                              <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" /> Adicionar ao ecrã principal
                            </strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Toque em <strong className="text-[#141E2E] dark:text-[#F2EFE9]">Adicionar</strong>. O ícone da <strong>IEB Horta</strong> fica logo no ecrã inicial.
                          </span>
                        </li>
                      </ol>

                      {isIOS && !isIPad && iosBrowser === 'safari' && (
                        <div className="rounded-xl border border-[#13294B]/12 dark:border-[#D4A84E]/25 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/70 px-3 py-2 flex items-center gap-2 text-xs text-[#13294B] dark:text-[#D4A84E]">
                          <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>O ícone Partilhar fica ao centro na barra inferior do Safari.</span>
                        </div>
                      )}

                      {!isInIframe && !(isIOS && iosBrowser === 'in-app') && (
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl()}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação para abrir no Safari'}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                  {isInstallable && (
                    <button
                      type="button"
                      onClick={() => void install().then((res) => { if (res === 'accepted') setShowGuide(false); })}
                      className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Baixar e Instalar Agora</span>
                    </button>
                  )}

                  <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                    Se o pedido automático não abrir no Android (Chrome), instale pelo menu:
                  </p>
                  <ol className="space-y-2.5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Abra esta página no <strong>Google Chrome</strong> (se veio pelo WhatsApp, toque em <strong>⋮ → Abrir no Chrome</strong>).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Toque em <strong>⋮</strong> (canto superior direito) e escolha{' '}
                        <strong className="text-[#141E2E] dark:text-[#F2EFE9]">Instalar aplicação</strong>.
                      </span>
                    </li>
                  </ol>
                  {!isInIframe && (
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl()}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação para enviar para o telemóvel'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Real Offline Package Download */}
              <div className="mt-3.5 pt-3.5 border-t border-[#141E2E]/10 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                  <span>Leitura sem internet</span>
                  <span className="font-medium text-[#1F5C3A] dark:text-[#6EE7B7]">
                    {swReady ? 'Pronta' : 'A preparar'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={downloadingVersion !== null}
                  onClick={() => void downloadBibleForOffline(bibleVersion)}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
                >
                  <HardDriveDownload className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>
                    {downloadingVersion === bibleVersion
                      ? `A descarregar Bíblia ${bibleVersion}...`
                      : isCurrentVersionOffline
                        ? `Bíblia ${bibleVersion} já guardada offline (Atualizar)`
                        : `Descarregar Bíblia ${bibleVersion} para Leitura Offline`}
                  </span>
                </button>

                {offlineStatusMessage && (
                  <p className="text-xs text-[#1F5C3A] dark:text-[#6EE7B7]" role="status">
                    {offlineStatusMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-3 w-full min-h-[44px] rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                Fechar
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {isInstalled ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2 rounded-xl border border-[#1F5C3A]/25 dark:border-[#6EE7B7]/30 bg-[#1F5C3A]/8 dark:bg-[#1F5C3A]/20 text-sm font-medium text-[#1F5C3A] dark:text-[#6EE7B7]">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Aplicação Instalada</span>
          </span>
          <button
            type="button"
            onClick={handleIOSClick}
            className="inline-flex items-center gap-1.5 min-h-[48px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            <Share className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Tutorial iOS</span>
          </button>
        </div>
      ) : (
        <div
          className={
            isSidebarLayout
              ? 'flex flex-col gap-2 w-full'
              : isMobileHeaderLayout
                ? 'flex items-center gap-1.5 shrink-0'
                : 'flex flex-wrap items-center gap-2.5'
          }
        >
          <button
            type="button"
            onClick={() => void handleAndroidClick()}
            aria-label="Baixar App (Android)"
            className={
              isMobileHeaderLayout
                ? 'inline-flex items-center justify-center gap-1 min-h-[44px] px-2.5 py-2 text-[11px] sm:text-xs font-medium rounded-lg bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
                : isSidebarLayout
                  ? 'w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] hover:opacity-90 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
                  : 'inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
            }
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
            <span>{isMobileHeaderLayout ? 'App Android' : 'Baixar App (Android)'}</span>
          </button>

          <button
            type="button"
            onClick={handleIOSClick}
            aria-label="Baixar App (iOS)"
            className={
              isMobileHeaderLayout
                ? 'inline-flex items-center justify-center gap-1 min-h-[44px] px-2.5 py-2 text-[11px] sm:text-xs font-medium rounded-lg border border-[#13294B]/25 dark:border-[#D4A84E]/35 text-[#13294B] dark:text-[#F2EFE9] hover:bg-[#13294B]/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
                : isSidebarLayout
                  ? 'w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg border border-[#13294B]/25 dark:border-[#D4A84E]/35 text-[#13294B] dark:text-[#F2EFE9] hover:bg-[#13294B]/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
                  : 'inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 text-sm font-medium rounded-xl border border-[#13294B]/25 dark:border-[#D4A84E]/35 text-[#13294B] dark:text-[#F2EFE9] hover:bg-[#13294B]/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
            }
          >
            <Share className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
            <span>{isMobileHeaderLayout ? 'App iOS' : 'Baixar App (iOS)'}</span>
          </button>
        </div>
      )}

      {modalContent}
    </>
  );
};
