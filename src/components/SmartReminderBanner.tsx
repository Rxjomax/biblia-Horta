import React from 'react';
import { Bell, BookOpen, CalendarCheck, Users, X } from 'lucide-react';
import type { SmartReminderPayload } from '../utils/reminders';

interface SmartReminderBannerProps {
  reminder: SmartReminderPayload | null;
  onDismiss: () => void;
  onAction: (reminder: SmartReminderPayload) => void;
}

export const SmartReminderBanner: React.FC<SmartReminderBannerProps> = ({
  reminder,
  onDismiss,
  onAction,
}) => {
  if (!reminder) return null;

  const Icon =
    reminder.kind === 'reading-plan'
      ? CalendarCheck
      : reminder.kind === 'church-service'
        ? Users
        : BookOpen;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[400px] z-50 rounded-2xl border border-[#141E2E]/15 dark:border-[#D4A84E]/35 bg-[#FAF8F4] dark:bg-[#131E30] shadow-xl p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
          <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Lembrete Inteligente · {reminder.scheduledForLabel}</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar lembrete"
          className="min-h-[44px] min-w-[44px] -mt-2.5 -mr-2.5 flex items-center justify-center rounded-xl text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="font-display text-lg font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1 leading-snug">
        {reminder.title}
      </h3>
      <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1.5 leading-relaxed">
        {reminder.body}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onAction(reminder)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{reminder.actionLabel}</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
        >
          Agora não
        </button>
      </div>
    </aside>
  );
};
