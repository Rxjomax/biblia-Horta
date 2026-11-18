import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Bookmark,
  Check,
  Clock,
  Cloud,
  ExternalLink,
  HardDriveDownload,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Navigation as NavIcon,
  RefreshCw,
  Sun,
} from 'lucide-react';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';
import { CHURCH_EVENTS, CHURCH_INFO } from '../data/churchData';
import type {
  BibleCorpus,
  BibleVersionId,
  NotificationSettings,
  ReadingPlan,
  ReadingPlanDay,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
  VisitorSubmission,
} from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type {
  NotificationPermissionState,
  ReminderDeliveryFeedback,
} from '../hooks/useSmartReminders';
import { getUpcomingRemindersSchedule, type ReminderKind } from '../utils/reminders';
import { PWAInstallButton } from './PWAInstallButton';

interface MoreViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  highlights: Record<string, VerseHighlight>;
  verseNotes: Record<string, VerseNote>;
  bookmarks: VerseBookmark[];
  onOpenBibleChapter: (bookId: string, chapter: number, verse?: number) => void;
  notifications: NotificationSettings;
  onUpdateNotifications: (next: NotificationSettings) => void;
  notificationPermission: NotificationPermissionState;
  onRequestNotificationPermission: () => Promise<NotificationPermissionState>;
  onTestReminder: (kind?: ReminderKind) => Promise<void>;
  reminderFeedback: ReminderDeliveryFeedback | null;
  activePlan?: ReadingPlan;
  nextPlanDay?: ReadingPlanDay;
  visitorSubmissions: VisitorSubmission[];
  onSubmitVisitorCard: (submission: Omit<VisitorSubmission, 'id' | 'submittedAt'>) => void;
  onOpenNotesTab?: () => void;
  cloudUserEmail?: string | null;
  cloudUserName?: string | null;
  cloudSyncStatus?: 'local' | 'syncing' | 'synced' | 'error';
  cloudSyncMessage?: string;
  onSignInGoogle?: () => Promise<void>;
  onSignOutCloud?: () => Promise<void>;
  onForceCloudSync?: () => Promise<void>;
}

export const MoreView: React.FC<MoreViewProps> = ({
  theme,
  onToggleTheme,
  bibleVersion,
  highlights,
  verseNotes,
  bookmarks,
  onOpenBibleChapter,
  notifications,
  onUpdateNotifications,
  notificationPermission,
  onRequestNotificationPermission,
  onTestReminder,
  reminderFeedback,
  activePlan,
  nextPlanDay,
  visitorSubmissions,
  onSubmitVisitorCard,
  onOpenNotesTab,
  cloudUserEmail,
  cloudUserName,
  cloudSyncStatus = 'local',
  cloudSyncMessage,
  onSignInGoogle,
  onSignOutCloud,
  onForceCloudSync,
}) => {
  const {
    isInstalled,
    isInIframe,
    swReady,
    offlineVersions,
    downloadingVersion,
    offlineStatusMessage,
    downloadBibleForOffline,
  } = usePWAInstall();

  const [testReminderKind, setTestReminderKind] = useState<ReminderKind>('daily-verse');
  const [isTestingReminder, setIsTestingReminder] = useState(false);

  // Visitor card form
  const [visitorName, setVisitorName] = useState('');
  const [visitorContact, setVisitorContact] = useState('');
  const [visitorChannel, setVisitorChannel] =
    useState<VisitorSubmission['preferredChannel']>('WhatsApp / Telemóvel');
  const [visitorMessage, setVisitorMessage] = useState('');
  const [visitorError, setVisitorError] = useState('');
  const [visitorSuccess, setVisitorSuccess] = useState(false);

  const upcomingSchedule = useMemo(
    () =>
      getUpcomingRemindersSchedule({
        settings: notifications,
        activePlan,
        nextDay: nextPlanDay,
        events: CHURCH_EVENTS,
      }),
    [notifications, activePlan, nextPlanDay]
  );

  const handleTestNotification = async () => {
    setIsTestingReminder(true);
    try {
      await onTestReminder(testReminderKind);
    } finally {
      setIsTestingReminder(false);
    }
  };

  const handleVisitorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorContact.trim()) {
      setVisitorError('Por favor, indique o seu nome e um contacto (telemóvel ou email).');
      return;
    }
    setVisitorError('');
    onSubmitVisitorCard({
      name: visitorName.trim(),
      contact: visitorContact.trim(),
      preferredChannel: visitorChannel,
      message: visitorMessage.trim(),
    });
    setVisitorName('');
    setVisitorContact('');
    setVisitorMessage('');
    setVisitorSuccess(true);
    window.setTimeout(() => setVisitorSuccess(false), 5000);
  };

  const notesList = Object.values(verseNotes).filter((n) => n.text.trim().length > 0);
  const highlightList = Object.values(highlights);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Header */}
      <section className="pb-6 border-b border-[#141E2E]/10 dark:border-white/10">
        <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
          Acolhimento, Estudos, Base de Dados e Preferências
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1">
          Mais sobre a IEB Horta
        </h1>
      </section>

      {/* 0. Cloud Database & Real-Time Synchronization (Firebase Firestore) */}
      <section aria-labelledby="cloud-db-heading">
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-[64ch]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                <Cloud className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Base de Dados Firebase Firestore + Cache Local</span>
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-md border ${
                  cloudUserEmail
                    ? 'border-[#1F5C3A]/30 bg-[#1F5C3A]/10 text-[#1F5C3A] dark:border-[#6EE7B7]/30 dark:text-[#6EE7B7]'
                    : 'border-[#141E2E]/15 dark:border-white/15 text-[#556173] dark:text-[#A3B0C2]'
                }`}
              >
                {cloudUserEmail
                  ? cloudSyncStatus === 'syncing'
                    ? 'A sincronizar com a nuvem...'
                    : 'Sincronização em Tempo Real Ativa'
                  : 'Guardado Neste Dispositivo (Pronto para Nuvem)'}
              </span>
            </div>

            <h2
              id="cloud-db-heading"
              className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              {cloudUserEmail
                ? `Conta sincronizada: ${cloudUserName || cloudUserEmail}`
                : 'Sincronização na Nuvem e Base de Dados da Igreja'}
            </h2>

            <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] leading-relaxed">
              {cloudUserEmail
                ? `Os seus apontamentos, sublinhados, marcadores, progresso nos 12 planos de leitura e pedidos no Mural de Oração estão sincronizados de forma segura no Firestore (${cloudUserEmail}).`
                : 'Todos os seus dados funcionam offline automaticamente. Entre com a sua conta Google para guardar uma cópia segura na base de dados Firebase da IEB Horta e sincronizar entre o telemóvel e o computador.'}
            </p>

            {cloudSyncMessage && (
              <p
                className={`text-xs font-medium ${
                  cloudSyncStatus === 'error'
                    ? 'text-[#9A3412] dark:text-[#FCA5A5]'
                    : 'text-[#1F5C3A] dark:text-[#6EE7B7]'
                }`}
                role="status"
              >
                {cloudSyncMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {cloudUserEmail ? (
              <>
                {onForceCloudSync && (
                  <button
                    type="button"
                    disabled={cloudSyncStatus === 'syncing'}
                    onClick={() => void onForceCloudSync()}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-xs font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] ${
                        cloudSyncStatus === 'syncing' ? 'animate-spin' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>Sincronizar Agora</span>
                  </button>
                )}
                {onSignOutCloud && (
                  <button
                    type="button"
                    onClick={() => void onSignOutCloud()}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Terminar Sessão</span>
                  </button>
                )}
              </>
            ) : (
              onSignInGoogle && (
                <button
                  type="button"
                  onClick={() => void onSignInGoogle()}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Entrar com Google (Sincronizar)</span>
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* 1. Saved Studies (Bookmarks, Notes, Highlights) */}
      <section aria-labelledby="studies-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="studies-heading"
              className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              Os Meus Estudos Bíblicos
            </h2>
            <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-1 tabular-nums">
              {highlightList.length} {highlightList.length === 1 ? 'sublinhado' : 'sublinhados'} ·{' '}
              {notesList.length} {notesList.length === 1 ? 'apontamento' : 'apontamentos'} ·{' '}
              {bookmarks.length} {bookmarks.length === 1 ? 'marcador' : 'marcadores'}
            </p>
          </div>
          {onOpenNotesTab && (
            <button
              type="button"
              onClick={onOpenNotesTab}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
            >
              Gerir na aba Notas →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bookmarks by Theme */}
          <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-5">
            <h3 className="text-sm font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
              <span>Marcadores por Tema</span>
            </h3>
            {bookmarks.length === 0 ? (
              <p className="mt-3 text-sm text-[#556173] dark:text-[#A3B0C2]">
                Ainda não guardou marcadores. Toque em qualquer versículo na Bíblia para guardar por tema.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#141E2E]/8 dark:divide-white/8">
                {bookmarks.map((bm) => (
                  <button
                    key={bm.key}
                    type="button"
                    onClick={() => onOpenBibleChapter(bm.bookId, bm.chapter, bm.verse)}
                    className="w-full text-left py-3 hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#8C6218] dark:text-[#D4A84E] font-medium">
                      <span>{bm.bookName} {bm.chapter}:{bm.verse}</span>
                      <span>{bm.theme}</span>
                    </div>
                    <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1 line-clamp-2">
                      {getVerseFromCorpusOrFallback(
                        bibleVersion,
                        bm.bookId,
                        bm.chapter,
                        bm.verse
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Verse Notes */}
          <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-5">
            <h3 className="text-sm font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
              Notas em Versículos
            </h3>
            {notesList.length === 0 ? (
              <p className="mt-3 text-sm text-[#556173] dark:text-[#A3B0C2]">
                Sem notas pessoais em versículos. Toque num versículo na Bíblia para escrever uma nota.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#141E2E]/8 dark:divide-white/8">
                {notesList.map((vn) => (
                  <button
                    key={vn.key}
                    type="button"
                    onClick={() => onOpenBibleChapter(vn.bookId, vn.chapter, vn.verse)}
                    className="w-full text-left py-3 hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-[#13294B] dark:text-[#D4A84E] font-semibold">
                      <span>{vn.bookName} {vn.chapter}:{vn.verse}</span>
                      <span className="font-normal text-[#556173] dark:text-[#A3B0C2]">
                        {vn.updatedAt}
                      </span>
                    </div>
                    <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1">
                      {vn.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Visitor Card ("Sou Novo Aqui") + Church History + Maps/Waze */}
      <section aria-labelledby="visitor-heading">
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                Sou Novo Aqui · Acolhimento
              </p>
              <h2
                id="visitor-heading"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1"
              >
                Seja bem-vindo à nossa casa na Horta
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE] max-w-[60ch]">
                {CHURCH_INFO.history.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#141E2E]/10 dark:border-white/10">
                <p className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>{CHURCH_INFO.address}</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a
                    href={CHURCH_INFO.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center gap-2 hover:opacity-90"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Abrir no Google Maps</span>
                  </a>
                  <a
                    href={CHURCH_INFO.wazeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-xs font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <NavIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Abrir no Waze</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#FAF8F4] dark:bg-[#10192A] border-t lg:border-t-0 lg:border-l border-[#141E2E]/10 dark:border-white/10">
            <h3 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
              Cartão de Visitante
            </h3>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-1">
              Deixe o seu contacto para lhe darmos as boas-vindas e esclarecermos qualquer questão.
            </p>

            <form onSubmit={handleVisitorSubmit} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="visitor-name"
                  className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                >
                  Nome completo
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Ex.: Diogo Bettencourt"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="visitor-contact"
                    className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                  >
                    Telemóvel ou Email
                  </label>
                  <input
                    id="visitor-contact"
                    type="text"
                    value={visitorContact}
                    onChange={(e) => setVisitorContact(e.target.value)}
                    placeholder="+351 91..."
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="visitor-channel"
                    className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                  >
                    Como prefere contacto?
                  </label>
                  <select
                    id="visitor-channel"
                    value={visitorChannel}
                    onChange={(e) =>
                      setVisitorChannel(e.target.value as VisitorSubmission['preferredChannel'])
                    }
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] text-base sm:text-sm"
                  >
                    <option value="WhatsApp / Telemóvel">WhatsApp / Telemóvel</option>
                    <option value="Email">Email</option>
                    <option value="Pessoalmente no domingo">Pessoalmente no domingo</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="visitor-msg"
                  className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                >
                  Mensagem (opcional)
                </label>
                <textarea
                  id="visitor-msg"
                  rows={2}
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  placeholder="Gostaria de saber mais sobre os grupos nos lares..."
                  className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] p-3 text-base"
                />
              </div>

              {visitorError && (
                <p className="text-xs text-[#9A3412] dark:text-[#FCA5A5]">{visitorError}</p>
              )}

              {visitorSuccess && (
                <p
                  role="status"
                  className="text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7] flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cartão enviado! A equipa pastoral da IEB Horta entrará em contacto consigo.</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90"
              >
                Enviar Cartão de Visitante
              </button>

              {visitorSubmissions.length > 0 && (
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2] tabular-nums">
                  Registos enviados neste dispositivo: {visitorSubmissions.length}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* 3. Smart Notifications + Appearance & PWA Install */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
              <span>Lembretes Inteligentes</span>
            </h2>

            {notificationPermission === 'granted' ? (
              <span className="text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7]">
                Notificações ativas
              </span>
            ) : notificationPermission === 'default' ? (
              <button
                type="button"
                onClick={() => void onRequestNotificationPermission()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90"
              >
                <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ativar Notificações</span>
              </button>
            ) : (
              <span className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                Avisos ativos na app
              </span>
            )}
          </div>

          {/* Live Next Scheduled Reminder Summary */}
          <div className="rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/70 p-3.5">
            {upcomingSchedule.length > 0 ? (
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                    Próximo lembrete · {upcomingSchedule[0].whenLabel} ({upcomingSchedule[0].countdownLabel})
                  </p>
                  <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9] mt-0.5">
                    {upcomingSchedule[0].label}
                  </p>
                  <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                    {upcomingSchedule[0].detail}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                Todos os lembretes automáticos estão desativados. Ative abaixo para receber avisos diários.
              </p>
            )}
          </div>

          <div className="divide-y divide-[#141E2E]/8 dark:divide-white/8">
            <div className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  Versículo do Dia
                </p>
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                  Receber a palavra diária no horário escolhido
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  type="time"
                  aria-label="Hora do versículo diário"
                  value={notifications.dailyVerseTime}
                  onChange={(e) =>
                    onUpdateNotifications({ ...notifications, dailyVerseTime: e.target.value })
                  }
                  className="min-h-[44px] px-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-transparent text-base sm:text-xs tabular-nums"
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.dailyVerseEnabled}
                  aria-label="Ativar lembrete do versículo do dia"
                  onClick={() =>
                    onUpdateNotifications({
                      ...notifications,
                      dailyVerseEnabled: !notifications.dailyVerseEnabled,
                    })
                  }
                  className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    notifications.dailyVerseEnabled
                      ? 'bg-[#13294B] dark:bg-[#D4A84E]'
                      : 'bg-[#141E2E]/20 dark:bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-[22px] w-[22px] rounded-full bg-[#FAF8F4] dark:bg-[#0C1320] transition-transform ${
                      notifications.dailyVerseEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  Plano de Leitura
                </p>
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                  Aviso diário para manter a sequência no seu plano ativo
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  type="time"
                  aria-label="Hora do plano de leitura"
                  value={notifications.readingPlanTime}
                  onChange={(e) =>
                    onUpdateNotifications({ ...notifications, readingPlanTime: e.target.value })
                  }
                  className="min-h-[44px] px-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-transparent text-base sm:text-xs tabular-nums"
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.readingPlanEnabled}
                  aria-label="Ativar lembrete do plano de leitura"
                  onClick={() =>
                    onUpdateNotifications({
                      ...notifications,
                      readingPlanEnabled: !notifications.readingPlanEnabled,
                    })
                  }
                  className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    notifications.readingPlanEnabled
                      ? 'bg-[#13294B] dark:bg-[#D4A84E]'
                      : 'bg-[#141E2E]/20 dark:bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-[22px] w-[22px] rounded-full bg-[#FAF8F4] dark:bg-[#0C1320] transition-transform ${
                      notifications.readingPlanEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  Avisos Antes dos Cultos
                </p>
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                  Lembrete automático 1 hora antes dos encontros semanais
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications.serviceReminderEnabled}
                aria-label="Ativar avisos antes dos cultos"
                onClick={() =>
                  onUpdateNotifications({
                    ...notifications,
                    serviceReminderEnabled: !notifications.serviceReminderEnabled,
                  })
                }
                className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                  notifications.serviceReminderEnabled
                    ? 'bg-[#13294B] dark:bg-[#D4A84E]'
                    : 'bg-[#141E2E]/20 dark:bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-[22px] w-[22px] rounded-full bg-[#FAF8F4] dark:bg-[#0C1320] transition-transform ${
                    notifications.serviceReminderEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <select
              aria-label="Escolher tipo de lembrete para testar"
              value={testReminderKind}
              onChange={(e) => setTestReminderKind(e.target.value as ReminderKind)}
              className="min-h-[44px] px-3 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/60 dark:bg-[#0C1320] text-base sm:text-xs font-medium"
            >
              <option value="daily-verse">Versículo do Dia</option>
              <option value="reading-plan">Plano de Leitura</option>
              <option value="church-service">Próximo Culto</option>
            </select>

            <button
              type="button"
              disabled={isTestingReminder}
              onClick={() => void handleTestNotification()}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/60 dark:bg-[#0C1320] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-2 disabled:opacity-60"
            >
              <BellRing className="w-3.5 h-3.5 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
              <span>{isTestingReminder ? 'A enviar...' : 'Testar Lembrete Agora'}</span>
            </button>
          </div>

          {reminderFeedback && (
            <div
              role="status"
              className="rounded-xl bg-[#EFE9DD] dark:bg-[#1B2B44] p-3 text-xs text-[#13294B] dark:text-[#F2EFE9]"
            >
              {reminderFeedback.message}
            </div>
          )}
        </div>

        {/* Appearance & PWA Installation */}
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                Tema e Aplicação no Telemóvel
              </h2>
              <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1">
                Instale a IEB Horta no telemóvel, guarde a Bíblia para ler sem internet e alterne o modo de leitura.
              </p>
            </div>

            <div className="rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#556173] dark:text-[#A3B0C2]">Estado no dispositivo</span>
                <span className="font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  {isInstalled
                    ? 'Instalada (Ecrã Principal)'
                    : swReady
                      ? 'Pronta para instalar (PWA ativa)'
                      : 'Aplicação web pronta'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#556173] dark:text-[#A3B0C2]">Bíblias offline guardadas</span>
                <span className="font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  {offlineVersions.length > 0 ? offlineVersions.join(', ') : 'Nenhuma ainda'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <PWAInstallButton bibleVersion={bibleVersion} />

              <button
                type="button"
                disabled={downloadingVersion !== null}
                onClick={() => void downloadBibleForOffline(bibleVersion)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-sm font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
              >
                <HardDriveDownload className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                <span>
                  {downloadingVersion === bibleVersion
                    ? `A descarregar ${bibleVersion}...`
                    : offlineVersions.includes(bibleVersion)
                      ? `Bíblia ${bibleVersion} Offline Pronta`
                      : `Descarregar Bíblia ${bibleVersion} Offline`}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-sm font-medium inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#D4A84E]" aria-hidden="true" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#13294B]" aria-hidden="true" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>
            </div>

            {isInIframe && !isInstalled && (
              <div className="pt-1">
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C6218] dark:text-[#D4A84E] hover:underline min-h-[44px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Abrir em separador próprio para instalar diretamente no telemóvel/PC →</span>
                </a>
              </div>
            )}

            {offlineStatusMessage && (
              <p className="text-xs font-medium text-[#1F5C3A] dark:text-[#6EE7B7]" role="status">
                {offlineStatusMessage}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[#141E2E]/10 dark:border-white/10 text-xs text-[#556173] dark:text-[#A3B0C2] space-y-1">
            <p className="font-medium text-[#141E2E] dark:text-[#F2EFE9]">
              {CHURCH_INFO.fullName} ({CHURCH_INFO.handle})
            </p>
            <p>{CHURCH_INFO.email} · {CHURCH_INFO.phone}</p>
            <p>Todos os seus planos, notas e sublinhados ficam guardados localmente neste dispositivo.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
