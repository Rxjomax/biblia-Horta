import React from 'react';
import {
  BookOpen,
  CalendarCheck,
  Home,
  Menu,
  Moon,
  NotebookPen,
  QrCode,
  Sun,
  Users,
} from 'lucide-react';
import type { AppTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  streak: number;
  bibleVersion?: import('../types').BibleVersionId;
  onOpenSocialQR?: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'biblia', label: 'Bíblia', icon: BookOpen },
  { id: 'planos', label: 'Planos', icon: CalendarCheck },
  { id: 'notas', label: 'Notas', icon: NotebookPen },
  { id: 'comunidade', label: 'Comunidade', icon: Users },
  { id: 'mais', label: 'Mais', icon: Menu },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  streak,
  bibleVersion = 'NVI',
  onOpenSocialQR,
}) => {
  return (
    <>
      {/* Mobile Top Header (compact 52px + safe-area top for standalone iPhone notch) */}
      <header className="lg:hidden sticky top-0 z-30 min-h-[52px] pt-[env(safe-area-inset-top)] bg-[#FAF8F4]/95 dark:bg-[#0C1320]/95 backdrop-blur-md border-b border-[#141E2E]/10 dark:border-white/10 px-3 sm:px-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectTab('inicio')}
          className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#13294B] dark:text-[#F2EFE9] whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
        >
          IEB Horta
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline text-xs text-[#556173] dark:text-[#A3B0C2] tabular-nums mr-0.5 whitespace-nowrap">
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
          <PWAInstallButton compact shortMobileLabel bibleVersion={bibleVersion} />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside
        aria-label="Navegação principal"
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-[#F3EFE7] dark:bg-[#10192A] border-r border-[#141E2E]/10 dark:border-white/10 px-5 py-6 justify-between z-30"
      >
        <div>
          <div className="pb-6 border-b border-[#141E2E]/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => onSelectTab('inicio')}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded-lg"
            >
              <span className="font-display text-2xl font-semibold tracking-tight text-[#13294B] dark:text-[#F2EFE9] block">
                IEB Horta
              </span>
              <span className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-1 block">
                Horta · Ilha do Faial · @iebhorta
              </span>
            </button>
          </div>

          <nav className="mt-6 space-y-1.5" aria-label="Secções da igreja">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    isActive
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-[#141E2E]/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-5 border-t border-[#141E2E]/10 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#556173] dark:text-[#A3B0C2]">
            <span>Sequência de leitura</span>
            <span className="font-semibold text-[#13294B] dark:text-[#D4A84E] tabular-nums">
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-[#141E2E]/12 dark:border-white/12 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full">
            <PWAInstallButton compact bibleVersion={bibleVersion} />
          </div>

          {onOpenSocialQR && (
            <button
              type="button"
              onClick={onOpenSocialQR}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#141E2E]/12 dark:border-white/12 text-xs font-medium text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              <QrCode className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0" aria-hidden="true" />
              <span>QR Code Redes Sociais</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (6 tabs, fixed height 64px) */}
      <nav
        aria-label="Navegação inferior"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F4]/95 dark:bg-[#0C1320]/95 backdrop-blur-md border-t border-[#141E2E]/10 dark:border-white/10 pb-safe"
      >
        <div className="grid grid-cols-6 h-16 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B8862D] ${
                  isActive
                    ? 'text-[#13294B] dark:text-[#D4A84E] font-semibold'
                    : 'text-[#556173] dark:text-[#96A3B8] font-medium'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'scale-105' : ''
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[10px] sm:text-[11px] leading-none tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
