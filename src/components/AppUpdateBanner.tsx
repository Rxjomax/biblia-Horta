import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAppUpdater } from '../hooks/useAppUpdater';

export const AppUpdateBanner: React.FC = () => {
  const {
    updateAvailable,
    isUpdating,
    dismissedBanner,
    applyUpdate,
    dismissBanner,
  } = useAppUpdater();

  if (!isUpdating && (!updateAvailable || dismissedBanner)) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 sm:max-w-md rounded-2xl border border-[#B8862D]/35 bg-[#13294B] text-[#FAF8F4] dark:bg-[#131E30] dark:border-[#D4A84E]/40 px-4 py-3 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <RefreshCw
            className={`w-4 h-4 text-[#D4A84E] shrink-0 ${
              isUpdating ? 'motion-safe:animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug">
              {isUpdating ? 'A atualizar a IEB Horta...' : 'Nova atualização disponível'}
            </p>
            <p className="text-xs text-[#FAF8F4]/80 leading-snug mt-0.5">
              {isUpdating
                ? 'A carregar a versão mais recente sem perder os seus dados.'
                : 'Atualize com um toque — sem precisar de desinstalar.'}
            </p>
          </div>
        </div>

        {!isUpdating && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void applyUpdate({ clearAppShellCache: true })}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#D4A84E] text-[#0C1320] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F4]"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Fechar aviso de atualização"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#FAF8F4]/75 hover:text-[#FAF8F4] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A84E]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
