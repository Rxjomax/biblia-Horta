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
    isAndroid,
    isInIframe,
    swReady,
    offlineVersions,
    downloadingVersion,
    offlineStatusMessage,
    install,
    downloadBibleForOffline,
  } = usePWAInstall();

  const [showGuide, setShowGuide] = useState(false);
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

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    const ok = await copyTextToClipboard(currentUrl);
    if (ok) {
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

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
            <div className="w-full max-w-md max-h-[88dvh] overflow-y-auto overscroll-contain rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/12 dark:border-white/12 p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                    {isIOS ? 'Instalação no iPhone e iPad (iOS)' : 'Aplicação Web Progressiva (PWA)'}
                  </p>
                  <h3
                    id="pwa-guide-title"
                    className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 leading-snug"
                  >
                    Instalar IEB Horta no Ecrã Principal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Fechar instruções de instalação"
                  className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isInIframe && (
                <div className="mt-4 rounded-xl border border-[#B8862D]/30 bg-[#F4F0E8] dark:bg-[#0C1320] p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
                    <span>Janela embutida detetada</span>
                  </p>
                  <p className="text-xs leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                    Por segurança do navegador, a instalação direta não funciona dentro de pré-visualizações embutidas. Abra a aplicação num separador próprio.
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

              {isIOS ? (
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                  {iosBrowser === 'in-app' ? (
                    <>
                      <div className="rounded-xl border border-[#B8862D]/40 bg-[#F4F0E8] dark:bg-[#0C1320] p-4 space-y-2.5">
                        <p className="text-sm font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
                          <span>Abra primeiro no Safari</span>
                        </p>
                        <p className="text-xs leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                          Abriu esta ligação dentro de outra aplicação (como o WhatsApp ou Instagram). O iPhone só mostra a opção <strong>Adicionar ao ecrã principal</strong> dentro do <strong>Safari</strong>.
                        </p>
                        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#141E2E] dark:text-[#E5E9F0]">
                          <li>
                            Toque no ícone da bússola do <strong>Safari</strong> (no canto inferior direito) ou em <strong>⋯</strong> → <strong>Abrir no Safari</strong>.
                          </li>
                          <li>
                            Se não encontrar esse botão, copie a ligação abaixo e cole-a no <strong>Safari</strong>.
                          </li>
                        </ol>
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl()}
                          className="mt-1 w-full min-h-[46px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                        >
                          {copiedUrl ? (
                            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {copiedUrl
                              ? 'Ligação copiada! Cole agora no Safari'
                              : 'Copiar ligação para abrir no Safari'}
                          </span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                        <p className="font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                          Depois de abrir no Safari:
                        </p>
                        <p>
                          Toque em <strong>Partilhar</strong> (quadrado com seta para cima) → <strong>Adicionar ao ecrã principal</strong> → <strong>Adicionar</strong>.
                        </p>
                      </div>
                    </>
                  ) : iosBrowser === 'chrome' || iosBrowser === 'other' ? (
                    <>
                      <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                        {iosBrowser === 'chrome'
                          ? 'No Chrome para iPhone/iPad (iOS 16.4+), siga estes passos:'
                          : 'No iPhone/iPad, recomendamos abrir no Safari ou seguir o menu Partilhar do navegador:'}
                      </p>
                      <ol className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            Toque no ícone{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <Share className="w-3.5 h-3.5" aria-hidden="true" /> Partilhar
                            </strong>{' '}
                            no canto superior direito (junto ao endereço do site).
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Deslize a lista e toque em{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" /> Adicionar ao ecrã principal
                            </strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Confirme tocando em <strong className="text-[#141E2E] dark:text-[#F2EFE9]">Adicionar</strong>.
                          </span>
                        </li>
                      </ol>

                      <div className="rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/70 p-3.5 space-y-2.5">
                        <p className="text-xs text-[#3F4B5E] dark:text-[#C8D1DE]">
                          Não aparece a opção? Copie a ligação e abra-a no <strong>Safari</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl()}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação para abrir no Safari'}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                        No iPhone e iPad, a Apple não permite descarga automática com 1 toque pelo navegador — a instalação faz-se em 3 passos rápidos no Safari:
                      </p>
                      <ol className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            Toque no ícone{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <Share className="w-3.5 h-3.5" aria-hidden="true" /> Partilhar
                            </strong>{' '}
                            (quadrado com seta para cima) na barra {isIPad ? 'superior' : 'inferior'} do Safari.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Deslize para baixo no menu e selecione{' '}
                            <strong className="inline-flex items-center gap-1 text-[#141E2E] dark:text-[#F2EFE9]">
                              <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" /> Adicionar ao ecrã principal
                            </strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13294B]/10 dark:bg-[#D4A84E]/15 text-[#13294B] dark:text-[#D4A84E] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Toque em <strong className="text-[#141E2E] dark:text-[#F2EFE9]">Adicionar</strong> no canto superior direito. O ícone da IEB Horta aparecerá junto às suas outras apps.
                          </span>
                        </li>
                      </ol>

                      {!isIPad && (
                        <div className="rounded-xl border border-[#13294B]/12 dark:border-[#D4A84E]/25 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/70 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#13294B] dark:text-[#D4A84E]">
                          <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>O botão Partilhar fica centrado na barra inferior do Safari.</span>
                        </div>
                      )}

                      {!isInIframe && (
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl()}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação da aplicação'}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                  <p>
                    {isAndroid
                      ? 'Para instalar no seu telemóvel Android (Chrome):'
                      : 'Para instalar no seu computador ou telemóvel:'}
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Abra o menu do navegador (<strong>⋮</strong> no canto superior direito) ou toque no ícone de instalação na barra de endereço.
                    </li>
                    <li>
                      Selecione <strong>Instalar aplicação</strong> ou{' '}
                      <strong>Adicionar ao ecrã principal</strong>.
                    </li>
                  </ol>
                  {!isInIframe && (
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl()}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação para enviar para o telemóvel'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Real Offline Package Download */}
              <div className="mt-5 pt-4 border-t border-[#141E2E]/10 dark:border-white/10 space-y-2.5">
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
                  className="w-full min-h-[46px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] inline-flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
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
                className="mt-5 w-full min-h-[48px] rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
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
        <span className="inline-flex items-center gap-2 min-h-[48px] px-4 py-2 rounded-xl border border-[#1F5C3A]/25 dark:border-[#6EE7B7]/30 bg-[#1F5C3A]/8 dark:bg-[#1F5C3A]/20 text-sm font-medium text-[#1F5C3A] dark:text-[#6EE7B7]">
          <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Aplicação Instalada</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void handleClick()}
          aria-label="Instalar aplicação IEB Horta"
          className={
            compact
              ? 'inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg border border-[#13294B]/20 dark:border-[#D4A84E]/30 text-[#13294B] dark:text-[#F2EFE9] hover:bg-[#13294B]/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
              : 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 text-sm font-medium rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]'
          }
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{shortMobileLabel ? 'Instalar' : 'Instalar App'}</span>
        </button>
      )}

      {modalContent}
    </>
  );
};
