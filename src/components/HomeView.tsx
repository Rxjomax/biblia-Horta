import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Check,
  HeartHandshake,
  Image as ImageIcon,
  NotebookPen,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';
import { CHURCH_INFO, DAILY_VERSE_REF, READING_PLANS } from '../data/churchData';
import { useSpeechReader } from '../hooks/useSpeechReader';
import type {
  BibleCorpus,
  BibleVersionId,
  PrayerRequest,
  SermonNote,
} from '../types';
import {
  calculatePlanProgress,
  extractBibleReferences,
  getTimeGreeting,
  parseBibleReference,
  type DetectedBibleRef,
} from '../utils/bible';

interface HomeViewProps {
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  streak: number;
  activePlanId: string;
  planProgress: Record<string, number[]>;
  onToggleDayComplete: (planId: string, day: number) => void;
  onOpenBibleChapter: (bookId: string, chapter: number, verse?: number) => void;
  onOpenShareVerse: (referenceLabel: string, verseText: string) => void;
  onOpenPlansTab: () => void;
  onOpenNotesTab: (noteId?: string) => void;
  onOpenCommunityTab: () => void;
  savedNotes: SermonNote[];
  onSaveQuickNote: (title: string, content: string) => SermonNote;
  latestPrayerRequest?: PrayerRequest;
  prayedIds: string[];
  onTogglePraying: (id: string) => void;
}

const QUICK_PASSAGES = [
  { bookId: 'salmos', bookName: 'Salmos', chapter: 23, label: 'Salmos 23' },
  { bookId: 'salmos', bookName: 'Salmos', chapter: 91, label: 'Salmos 91' },
  { bookId: 'mateus', bookName: 'Mateus', chapter: 6, label: 'Mateus 6' },
  { bookId: 'joao', bookName: 'João', chapter: 15, label: 'João 15' },
  { bookId: 'romanos', bookName: 'Romanos', chapter: 8, label: 'Romanos 8' },
  { bookId: 'filipenses', bookName: 'Filipenses', chapter: 4, label: 'Filipenses 4' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  bibleVersion,
  primaryCorpus,
  streak,
  activePlanId,
  planProgress,
  onToggleDayComplete,
  onOpenBibleChapter,
  onOpenShareVerse,
  onOpenPlansTab,
  onOpenNotesTab,
  onOpenCommunityTab,
  savedNotes,
  onSaveQuickNote,
  latestPrayerRequest,
  prayedIds,
  onTogglePraying,
}) => {
  const greeting = getTimeGreeting();
  const dailyVerseText =
    getVerseFromCorpusOrFallback(
      bibleVersion,
      DAILY_VERSE_REF.bookId,
      DAILY_VERSE_REF.chapter,
      DAILY_VERSE_REF.verse
    ) || 'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?';
  const dailyVerseRefLabel = `${DAILY_VERSE_REF.bookName} ${DAILY_VERSE_REF.chapter}:${DAILY_VERSE_REF.verse}`;

  const {
    isPlaying: isSpeaking,
    isLoadingAudio,
    audioError,
    activeId,
    activePtPtVoice,
    ptPtVoices,
    rate,
    playSequence,
    stop,
    changeRate,
    selectVoice,
  } = useSpeechReader();

  // Quick personal notes draft
  const [noteTitleDraft, setNoteTitleDraft] = useState('');
  const [noteBodyDraft, setNoteBodyDraft] = useState('');
  const [lastSavedNoteId, setLastSavedNoteId] = useState<string | null>(null);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [previewRef, setPreviewRef] = useState<DetectedBibleRef | null>(null);

  // Quick Bible reference jump
  const [quickRefInput, setQuickRefInput] = useState('');
  const [quickRefError, setQuickRefError] = useState('');

  const activePlan =
    READING_PLANS.find((p) => p.id === activePlanId) ?? READING_PLANS[0];
  const completedDays = planProgress[activePlan.id] ?? [];
  const planStats = calculatePlanProgress(activePlan, completedDays);
  const nextPlanDay =
    activePlan.days.find((d) => !completedDays.includes(d.day)) ??
    activePlan.days[activePlan.days.length - 1];
  const isNextDayDone = nextPlanDay
    ? completedDays.includes(nextPlanDay.day)
    : false;

  const detectedRefs = useMemo(
    () => extractBibleReferences(noteBodyDraft),
    [noteBodyDraft]
  );

  const handleReadDailyVerse = () => {
    if (isSpeaking && activeId === 'daily-verse') {
      stop();
      return;
    }
    playSequence([
      {
        id: 'daily-verse',
        text: `${dailyVerseRefLabel}. ${dailyVerseText}`,
      },
    ]);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBodyDraft.trim() && !noteTitleDraft.trim()) return;
    const saved = onSaveQuickNote(noteTitleDraft, noteBodyDraft);
    setLastSavedNoteId(saved.id);
    setNoteTitleDraft('');
    setNoteBodyDraft('');
    setNoteSavedFeedback(true);
    window.setTimeout(() => setNoteSavedFeedback(false), 4000);
  };

  const handleQuickBibleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickRefInput.trim();
    if (!trimmed) return;
    const parsed = parseBibleReference(trimmed);
    if (!parsed) {
      setQuickRefError('Referência não reconhecida. Experimente ex.: «João 3:16» ou «Salmos 23».');
      return;
    }
    setQuickRefError('');
    setQuickRefInput('');
    onOpenBibleChapter(parsed.bookId, parsed.chapter, parsed.verse);
  };

  const rawDateFormatted = new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const todayDateFormatted =
    rawDateFormatted.charAt(0).toUpperCase() + rawDateFormatted.slice(1);

  const recentNotes = savedNotes.slice(0, 2);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Greeting & Church Masthead */}
      <section aria-labelledby="home-greeting" className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-[#141E2E]/10 dark:border-white/10">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#556173] dark:text-[#A3B0C2]">
              {todayDateFormatted} · Horta, Ilha do Faial
            </p>
            <h1
              id="home-greeting"
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#141E2E] dark:text-[#F2EFE9] mt-1.5 text-balance leading-[1.12]"
            >
              {greeting}, comunidade da IEB Horta
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#556173] dark:text-[#A3B0C2] shrink-0">
            <span className="tabular-nums">
              Sequência: <strong className="text-[#13294B] dark:text-[#D4A84E]">{streak} dias</strong>
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenNotesTab()}
              className="tabular-nums hover:underline text-[#13294B] dark:text-[#D4A84E] font-medium min-h-[44px] inline-flex items-center"
            >
              {savedNotes.length} {savedNotes.length === 1 ? 'nota guardada' : 'notas guardadas'}
            </button>
          </div>
        </div>
      </section>

      {/* Featured Verse of the Day Card (Dominant Visual Anchor) */}
      <section aria-labelledby="daily-verse-heading">
        <div className="relative overflow-hidden rounded-2xl bg-[#13294B] text-[#FAF8F4] border border-[#13294B]/20 dark:border-white/10">
          <img
            src={CHURCH_INFO.images.heroVerse}
            alt="Costa basáltica do Faial ao nascer do sol sobre o Atlântico"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0A1526]/95 via-[#0E1D35]/70 to-[#0A1526]/65"
          />

          <div className="relative z-10 p-6 sm:p-10 max-w-3xl">
            <p
              id="daily-verse-heading"
              className="text-xs font-medium tracking-wide text-[#E5BE6D]"
            >
              Versículo do Dia · {bibleVersion}
            </p>

            <blockquote className="mt-4 font-display text-2xl sm:text-3xl leading-[1.32] font-medium text-[#FAF8F4] text-balance">
              «{dailyVerseText}»
            </blockquote>

            <p className="mt-4 text-sm font-medium text-[#E5BE6D]">
              {dailyVerseRefLabel}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onOpenBibleChapter(
                    DAILY_VERSE_REF.bookId,
                    DAILY_VERSE_REF.chapter,
                    DAILY_VERSE_REF.verse
                  )
                }
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#D4A84E] text-[#0C1320] text-sm font-semibold hover:bg-[#E0B965] transition-colors inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ler Capítulo Completo</span>
              </button>

              <button
                type="button"
                onClick={handleReadDailyVerse}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-[#FAF8F4] text-sm font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A84E]"
              >
                {isSpeaking && activeId === 'daily-verse' ? (
                  <>
                    <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Parar Áudio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Ouvir</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenShareVerse(dailyVerseRefLabel, dailyVerseText)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-[#FAF8F4] text-sm font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A84E]"
              >
                <ImageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Partilhar como Imagem</span>
              </button>
            </div>

            {(isSpeaking && activeId === 'daily-verse') || audioError ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0A1526]/85 border border-white/15 px-4 py-2.5 text-xs text-[#FAF8F4]">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-[#E5BE6D] shrink-0" aria-hidden="true" />
                  <span>
                    {audioError ? (
                      audioError
                    ) : isLoadingAudio ? (
                      <>A preparar voz <strong>Português (Portugal · pt-PT)</strong>...</>
                    ) : (
                      <>
                        A ouvir em <strong>Português (Portugal · pt-PT)</strong>
                        {activePtPtVoice ? ` · ${activePtPtVoice.name}` : ''}
                      </>
                    )}
                  </span>
                </div>
                {isSpeaking && activeId === 'daily-verse' && (
                  <div className="flex items-center gap-1.5">
                    {ptPtVoices.length > 1 && (
                      <select
                        aria-label="Escolher voz em Português de Portugal"
                        value={activePtPtVoice.id}
                        onChange={(e) => selectVoice(e.target.value)}
                        className="min-h-[32px] px-2 rounded bg-white/10 text-xs text-[#FAF8F4]"
                      >
                        {ptPtVoices.map((v) => (
                          <option key={v.id} value={v.id} className="text-[#141E2E]">
                            {v.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {[0.85, 1, 1.25].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => changeRate(r)}
                        className={`px-2 py-1 rounded text-xs tabular-nums ${
                          rate === r ? 'bg-[#D4A84E] text-[#0C1320] font-semibold' : 'bg-white/10'
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={stop}
                      className="ml-1 px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 font-medium"
                    >
                      Parar
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Active Reading Plan Today + Quick Message Notes (Asymmetric 7/5 Split) */}
      <section aria-labelledby="daily-rhythm-heading" className="pt-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Today's Reading Plan (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E] inline-flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Plano Ativo · {activePlan.category}</span>
                </p>
                <span className="font-mono-tabular text-xs font-semibold text-[#13294B] dark:text-[#D4A84E]">
                  {planStats.percentage}% · {planStats.completedCount}/{planStats.totalTrackableDays} dias
                </span>
              </div>

              <h2
                id="daily-rhythm-heading"
                className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-2 text-balance"
              >
                {activePlan.title}
              </h2>

              <div
                className="mt-3 h-2 w-full rounded-full bg-[#E3DCD0] dark:bg-[#0C1320] overflow-hidden"
                role="progressbar"
                aria-valuenow={planStats.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso do plano ${activePlan.title}`}
              >
                <div
                  className="h-full rounded-full bg-[#13294B] dark:bg-[#D4A84E] transition-all duration-300"
                  style={{ width: `${planStats.percentage}%` }}
                />
              </div>

              {nextPlanDay && (
                <div className="mt-6 pt-5 border-t border-[#141E2E]/10 dark:border-white/10">
                  <p className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] tabular-nums">
                    {isNextDayDone ? `Dia ${nextPlanDay.day} concluído` : `Próxima leitura · Dia ${nextPlanDay.day}`}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1">
                    {nextPlanDay.title}
                  </h3>
                  <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1.5 leading-relaxed max-w-[60ch]">
                    {nextPlanDay.summary}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    {nextPlanDay.passages.slice(0, 3).map((passage) => (
                      <button
                        key={`${passage.bookId}-${passage.chapter}`}
                        type="button"
                        onClick={() => onOpenBibleChapter(passage.bookId, passage.chapter)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Ler {passage.bookName} {passage.chapter}</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => onToggleDayComplete(activePlan.id, nextPlanDay.day)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
                        isNextDayDone
                          ? 'border-[#1F5C3A]/30 text-[#1F5C3A] dark:text-[#6EE7B7] bg-[#1F5C3A]/8'
                          : 'border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isNextDayDone ? 'Concluído' : 'Concluir Dia'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#141E2E]/10 dark:border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                12 planos completos disponíveis
              </span>
              <button
                type="button"
                onClick={onOpenPlansTab}
                className="min-h-[44px] text-sm font-medium text-[#13294B] dark:text-[#D4A84E] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Ver todos os planos</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quick Personal Notes Column (5 cols) */}
          <form
            onSubmit={handleSaveNote}
            className="lg:col-span-5 rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                <span>Apontamentos Rápidos</span>
              </h2>
              <button
                type="button"
                onClick={() => onOpenNotesTab()}
                className="text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:underline min-h-[44px] inline-flex items-center whitespace-nowrap"
              >
                Ver notas ({savedNotes.length})
              </button>
            </div>
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-0.5">
              Tome nota do que está a aprender. Tudo fica guardado na sua aba Notas.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="home-note-title" className="sr-only">
                  Título ou tema do apontamento
                </label>
                <input
                  id="home-note-title"
                  type="text"
                  value={noteTitleDraft}
                  onChange={(e) => setNoteTitleDraft(e.target.value)}
                  placeholder="Título ou tema (opcional)"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] placeholder:text-[#7A8699] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>

              <div>
                <label htmlFor="home-quick-notes" className="sr-only">
                  Escrever novo apontamento
                </label>
                <textarea
                  id="home-quick-notes"
                  rows={5}
                  value={noteBodyDraft}
                  onChange={(e) => setNoteBodyDraft(e.target.value)}
                  placeholder="Escreva os seus apontamentos ou versículos (ex.: Romanos 8:28, Salmos 23:1)..."
                  className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/50 dark:bg-[#0C1320] p-3.5 text-base leading-relaxed text-[#141E2E] dark:text-[#F2EFE9] placeholder:text-[#7A8699] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>
            </div>

            {detectedRefs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#141E2E]/8 dark:border-white/8">
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>Referências detetadas:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedRefs.map((r, idx) => (
                    <button
                      key={`${r.raw}-${idx}`}
                      type="button"
                      onClick={() => setPreviewRef(r)}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#EFE9DD] dark:bg-[#1B2B44] text-xs font-semibold text-[#13294B] dark:text-[#E5BE6D] hover:opacity-85"
                    >
                      {r.raw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs min-h-[20px] flex items-center gap-1.5">
                {noteSavedFeedback && (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1F5C3A] dark:text-[#6EE7B7]" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => onOpenNotesTab(lastSavedNoteId ?? undefined)}
                      className="text-[#1F5C3A] dark:text-[#6EE7B7] font-medium hover:underline"
                    >
                      Nota guardada! Abrir em Notas →
                    </button>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={!noteBodyDraft.trim() && !noteTitleDraft.trim()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                Guardar Nota
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Bottom Editorial Strip: Quick Bible Lookup + Recent Notes & Community Prayer */}
      <section
        aria-label="Atalhos de estudo, notas recentes e oração"
        className="pt-6 border-t border-[#141E2E]/10 dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left: Quick Bible Reference Jump & Popular Passages (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
              Acesso Direto às Escrituras
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5">
              Abrir Passagem Rápida
            </h2>
          </div>

          <form onSubmit={handleQuickBibleJump} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="home-quick-ref" className="sr-only">
                Ir para referência bíblica
              </label>
              <Search
                className="w-4 h-4 text-[#556173] dark:text-[#A3B0C2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="home-quick-ref"
                type="text"
                value={quickRefInput}
                onChange={(e) => setQuickRefInput(e.target.value)}
                placeholder="Ex.: João 3:16 ou Salmos 91"
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] placeholder:text-[#7A8699] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 whitespace-nowrap"
            >
              Abrir na Bíblia
            </button>
          </form>

          {quickRefError && (
            <p className="text-xs text-[#9A3412] dark:text-[#FCA5A5]">{quickRefError}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PASSAGES.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => onOpenBibleChapter(qp.bookId, qp.chapter)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/12 dark:border-white/12 bg-[#FAF8F4] dark:bg-[#131E30] text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap transition-colors"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Recent Saved Notes & Latest Community Prayer (6 cols) */}
        <div className="lg:col-span-6 divide-y divide-[#141E2E]/10 dark:divide-white/10">
          {/* Recent Notes */}
          <div className="pb-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                Notas Guardadas Recentemente
              </h2>
              <button
                type="button"
                onClick={() => onOpenNotesTab()}
                className="text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:underline min-h-[44px] inline-flex items-center whitespace-nowrap"
              >
                Ver todas →
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
                Ainda não guardou notas. Utilize o bloco acima para começar o seu caderno.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onOpenNotesTab(note.id)}
                    className="w-full text-left rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-3.5 hover:bg-[#F4F0E8]/80 dark:hover:bg-[#17253B] transition-colors"
                  >
                    <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                      {note.date} · {note.preacher}
                    </p>
                    <p className="font-display text-base font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 truncate">
                      {note.title}
                    </p>
                    {note.content.trim() && (
                      <p className="text-xs text-[#3F4B5E] dark:text-[#C8D1DE] mt-1 line-clamp-1">
                        {note.content}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Latest Community Prayer */}
          {latestPrayerRequest && (
            <div className="pt-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                  Mural de Oração · {latestPrayerRequest.category}
                </p>
                <button
                  type="button"
                  onClick={onOpenCommunityTab}
                  className="text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:underline min-h-[44px] inline-flex items-center whitespace-nowrap"
                >
                  Abrir Mural →
                </button>
              </div>
              <p className="text-sm leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE] max-w-[60ch]">
                «{latestPrayerRequest.content}»
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#556173] dark:text-[#A3B0C2] tabular-nums">
                  {latestPrayerRequest.isAnonymous ? 'Pedido Anónimo' : latestPrayerRequest.author} ·{' '}
                  {latestPrayerRequest.prayingCount} a orar
                </span>
                <button
                  type="button"
                  onClick={() => onTogglePraying(latestPrayerRequest.id)}
                  aria-pressed={prayedIds.includes(latestPrayerRequest.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    prayedIds.includes(latestPrayerRequest.id)
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'border border-[#13294B]/20 dark:border-[#D4A84E]/40 text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {prayedIds.includes(latestPrayerRequest.id)
                      ? 'A orar por ti'
                      : 'Estou a orar por ti'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Detected Reference Quick Verse Modal */}
      {previewRef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-ref-preview-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="home-ref-preview-title"
                className="font-display text-xl font-semibold text-[#13294B] dark:text-[#D4A84E]"
              >
                {previewRef.bookName} {previewRef.chapter}
                {previewRef.verse ? `:${previewRef.verse}` : ''} ({bibleVersion})
              </h3>
              <button
                type="button"
                onClick={() => setPreviewRef(null)}
                aria-label="Fechar pré-visualização do versículo"
                className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 font-bible-serif text-lg leading-relaxed text-[#141E2E] dark:text-[#F2EFE9]">
              «
              {getVerseFromCorpusOrFallback(
                bibleVersion,
                previewRef.bookId,
                previewRef.chapter,
                previewRef.verse ?? 1
              ) || (primaryCorpus ? 'Versículo não encontrado neste capítulo.' : 'A carregar versículo...')}
              »
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewRef(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-sm font-medium"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewRef;
                  setPreviewRef(null);
                  onOpenBibleChapter(target.bookId, target.chapter, target.verse);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium"
              >
                Abrir na Bíblia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
