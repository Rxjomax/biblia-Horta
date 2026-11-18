import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  HardDriveDownload,
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

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  shortMobileLabel = false,
  bibleVersion = 'NVI',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
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
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      // Ignore clipboard failure
    }
  };

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
          onClick={handleClick}
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

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                  Aplicação Web Progressiva (PWA)
                </p>
                <h3
                  id="pwa-guide-title"
                  className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5"
                >
                  Descarregar e Instalar IEB Horta
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
                  <Smartphone className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>Janela embutida detetada</span>
                </p>
                <p className="text-xs leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                  Por segurança do navegador, o botão de instalação direta não aparece dentro de pré-visualizações embutidas. Abra a aplicação no seu próprio separador para instalar com 1 toque.
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
                    onClick={handleCopyUrl}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#1F5C3A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Ligação copiada!' : 'Copiar ligação'}</span>
                  </button>
                </div>
              </div>
            )}

            {isIOS ? (
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE]">
                <p>Para adicionar ao ecrã principal no iPhone ou iPad (Safari):</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Toque no botão{' '}
                    <strong className="inline-flex items-center gap-1">
                      <Share className="w-3.5 h-3.5" /> Partilhar
                    </strong>{' '}
                    na barra do Safari.
                  </li>
                  <li>
                    Deslize para baixo e escolha <strong>Adicionar ao ecrã principal</strong>.
                  </li>
                  <li>
                    Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                  </li>
                </ol>
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
                    onClick={handleCopyUrl}
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
                <span>Motor offline (Service Worker)</span>
                <span className="font-medium text-[#1F5C3A] dark:text-[#6EE7B7]">
                  {swReady ? 'Ativo' : 'A preparar'}
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
              Concluir
            </button>
          </div>
        </div>
      )}
    </>
  );
};
