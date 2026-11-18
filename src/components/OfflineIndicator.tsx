import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 lg:top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-[#9A5B13] text-[#FAF8F4] px-3.5 py-2 text-xs font-medium shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Modo sem ligação · A utilizar dados guardados</span>
    </div>
  );
};
