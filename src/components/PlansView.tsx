import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  MessageSquare,
} from 'lucide-react';
import {
  CHURCH_INFO,
  COMMUNITY_CHALLENGE_INFO,
  READING_PLANS,
} from '../data/churchData';
import type { CommunityChallengeComment } from '../types';
import { calculatePlanProgress } from '../utils/bible';

type PlanCatalogFilter =
  | 'Todos'
  | 'Toda a Escritura'
  | 'Novo Testamento'
  | 'Sabedoria e Cartas'
  | 'Temáticos · 7 Dias';

const CATALOG_FILTERS: PlanCatalogFilter[] = [
  'Todos',
  'Toda a Escritura',
  'Novo Testamento',
  'Sabedoria e Cartas',
  'Temáticos · 7 Dias',
];

const DAYS_PER_WINDOW = 14;

interface PlansViewProps {
  activePlanId: string;
  onSelectActivePlan: (planId: string) => void;
  planProgress: Record<string, number[]>;
  onToggleDayComplete: (planId: string, day: number) => void;
  streak: number;
  challengeComments: CommunityChallengeComment[];
  onAddChallengeComment: (author: string, day: number, text: string) => void;
  onOpenBibleChapter: (bookId: string, chapter: number) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  activePlanId,
  onSelectActivePlan,
  planProgress,
  onToggleDayComplete,
  streak,
  challengeComments,
  onAddChallengeComment,
  onOpenBibleChapter,
}) => {
  const activePlan =
    READING_PLANS.find((p) => p.id === activePlanId) ?? READING_PLANS[0];
  const activeCompletedDays = planProgress[activePlan.id] ?? [];
  const activeStats = calculatePlanProgress(activePlan, activeCompletedDays);

  const [catalogFilter, setCatalogFilter] = useState<PlanCatalogFilter>('Todos');
  const [dayWindowIndex, setDayWindowIndex] = useState(0);
  const activePlanSectionRef = useRef<HTMLElement | null>(null);

  const totalWindows = Math.max(1, Math.ceil(activePlan.days.length / DAYS_PER_WINDOW));

  // Automatically jump to the 14-day window containing the next unread day when switching plans
  useEffect(() => {
    const firstUnreadIdx = activePlan.days.findIndex(
      (d) => !activeCompletedDays.includes(d.day)
    );
    const targetIdx = firstUnreadIdx === -1 ? 0 : Math.floor(firstUnreadIdx / DAYS_PER_WINDOW);
    setDayWindowIndex(targetIdx);
  }, [activePlan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const safeWindowIndex = Math.min(Math.max(0, dayWindowIndex), totalWindows - 1);
  const visibleDays = useMemo(() => {
    const start = safeWindowIndex * DAYS_PER_WINDOW;
    return activePlan.days.slice(start, start + DAYS_PER_WINDOW);
  }, [activePlan.days, safeWindowIndex]);

  const filteredCatalogPlans = useMemo(() => {
    if (catalogFilter === 'Todos') return READING_PLANS;
    if (catalogFilter === 'Toda a Escritura') {
      return READING_PLANS.filter((p) => p.category === 'Toda a Escritura');
    }
    if (catalogFilter === 'Novo Testamento') {
      return READING_PLANS.filter(
        (p) => p.category === 'Novo Testamento' || p.category === 'Vida de Jesus'
      );
    }
    if (catalogFilter === 'Sabedoria e Cartas') {
      return READING_PLANS.filter(
        (p) => p.category === 'Sabedoria e Oração' || p.category === 'Livros e Cartas'
      );
    }
    return READING_PLANS.filter((p) => p.category === 'Temático · 7 Dias');
  }, [catalogFilter]);

  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentDay, setCommentDay] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError('Escreva a sua reflexão antes de publicar.');
      return;
    }
    setCommentError('');
    onAddChallengeComment(
      commentAuthor.trim() || 'Membro da IEB Horta',
      commentDay,
      commentText.trim()
    );
    setCommentText('');
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Header & Streak */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#141E2E]/10 dark:border-white/10">
        <div>
          <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
            Leitura Diária das Escrituras
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1">
            Planos e Desafios
          </h1>
          <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-1 max-w-[60ch]">
            Acompanhe o seu ritmo pessoal de leitura e participe no desafio mensal da igreja.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl bg-[#EFE9DD] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 px-4 py-3 shrink-0">
          <Flame className="w-5 h-5 text-[#B8862D] dark:text-[#D4A84E]" aria-hidden="true" />
          <div>
            <span className="text-xs text-[#556173] dark:text-[#A3B0C2] block leading-none">
              Sequência atual
            </span>
            <span className="font-display text-lg font-semibold text-[#13294B] dark:text-[#F2EFE9] tabular-nums">
              {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
          </div>
        </div>
      </section>

      {/* Active Plan Detail */}
      <section ref={activePlanSectionRef} aria-labelledby="active-plan-heading">
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2]">
                Plano em curso · {activePlan.category} · {activePlan.durationDays} dias
              </p>
              <h2
                id="active-plan-heading"
                className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1"
              >
                {activePlan.title}
              </h2>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="font-mono-tabular text-2xl font-semibold text-[#13294B] dark:text-[#D4A84E]">
                {activeStats.percentage}%
              </span>
              <span className="text-xs text-[#556173] dark:text-[#A3B0C2] block tabular-nums">
                {activeStats.completedCount} de {activeStats.totalTrackableDays} dias concluídos
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="mt-4 h-2.5 w-full rounded-full bg-[#E3DCD0] dark:bg-[#0C1320] overflow-hidden"
            role="progressbar"
            aria-valuenow={activeStats.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso do plano ${activePlan.title}`}
          >
            <div
              className="h-full rounded-full bg-[#13294B] dark:bg-[#D4A84E] transition-all duration-300"
              style={{ width: `${activeStats.percentage}%` }}
            />
          </div>

          {/* 14-day window navigation for long plans */}
          {totalWindows > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#141E2E]/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="plan-window-select"
                  className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2]"
                >
                  Período:
                </label>
                <select
                  id="plan-window-select"
                  value={safeWindowIndex}
                  onChange={(e) => setDayWindowIndex(Number(e.target.value))}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-xs sm:text-sm font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  {Array.from({ length: totalWindows }, (_, wIdx) => {
                    const firstDay = wIdx * DAYS_PER_WINDOW + 1;
                    const lastDay = Math.min(
                      activePlan.days.length,
                      (wIdx + 1) * DAYS_PER_WINDOW
                    );
                    return (
                      <option key={wIdx} value={wIdx}>
                        Dias {firstDay}–{lastDay} de {activePlan.days.length}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeWindowIndex === 0}
                  onClick={() => setDayWindowIndex((w) => Math.max(0, w - 1))}
                  aria-label="Período anterior"
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-xs font-medium inline-flex items-center gap-1 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  disabled={safeWindowIndex >= totalWindows - 1}
                  onClick={() => setDayWindowIndex((w) => Math.min(totalWindows - 1, w + 1))}
                  aria-label="Próximo período"
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-xs font-medium inline-flex items-center gap-1 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <span>Seguinte</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Daily Checklist */}
          <div className="mt-5 divide-y divide-[#141E2E]/10 dark:divide-white/10">
            {visibleDays.map((dayItem) => {
              const isDone = activeCompletedDays.includes(dayItem.day);
              return (
                <div
                  key={dayItem.day}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleDayComplete(activePlan.id, dayItem.day)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone
                          ? `Desmarcar Dia ${dayItem.day} como lido`
                          : `Marcar Dia ${dayItem.day} como lido`
                      }
                      className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                        isDone
                          ? 'bg-[#13294B] border-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:border-[#D4A84E] dark:text-[#0C1320]'
                          : 'border-[#141E2E]/20 dark:border-white/20 bg-[#FAF8F4] dark:bg-[#0C1320] text-transparent hover:border-[#13294B]'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E] tabular-nums">
                        Dia {dayItem.day}
                      </p>
                      <h3
                        className={`font-display text-base font-semibold mt-0.5 ${
                          isDone
                            ? 'line-through text-[#647084] dark:text-[#8E9BB0]'
                            : 'text-[#141E2E] dark:text-[#F2EFE9]'
                        }`}
                      >
                        {dayItem.title}
                      </h3>
                      <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-0.5 max-w-[58ch]">
                        {dayItem.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-[58px] sm:pl-0 shrink-0 sm:max-w-[46%] sm:justify-end">
                    {dayItem.passages.map((passage) => (
                      <button
                        key={`${passage.bookId}-${passage.chapter}`}
                        type="button"
                        onClick={() => onOpenBibleChapter(passage.bookId, passage.chapter)}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Ler {passage.bookName} {passage.chapter}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog of All Pre-created Reading Plans */}
      <section aria-labelledby="catalog-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h2
              id="catalog-heading"
              className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
            >
              Catálogo de Planos de Leitura ({READING_PLANS.length})
            </h2>
            <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-1">
              Escolha um percurso anual, por livros da Bíblia ou temático de 7 a 21 dias.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {CATALOG_FILTERS.map((filterLabel) => (
            <button
              key={filterLabel}
              type="button"
              onClick={() => setCatalogFilter(filterLabel)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                catalogFilter === filterLabel
                  ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                  : 'border border-[#141E2E]/15 dark:border-white/15 text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {filterLabel}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCatalogPlans.map((plan) => {
            const completed = planProgress[plan.id] ?? [];
            const stats = calculatePlanProgress(plan, completed);
            const isSelected = plan.id === activePlan.id;

            return (
              <article
                key={plan.id}
                className={`rounded-2xl p-5 border transition-colors flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD]/75 dark:bg-[#17253B]'
                    : 'border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                    <span>{plan.category} · {plan.durationDays} dias</span>
                    <span className="font-mono-tabular font-semibold text-[#13294B] dark:text-[#D4A84E]">
                      {stats.percentage}%
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1.5">
                    {plan.title}
                  </h3>
                  <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1.5 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex-1 h-1.5 rounded-full bg-[#E3DCD0] dark:bg-[#0C1320] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#13294B] dark:bg-[#D4A84E]"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectActivePlan(plan.id);
                      activePlanSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'border border-[#141E2E]/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isSelected ? 'Plano Ativo' : 'Abrir Plano'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Community Challenge (IEB Horta) */}
      <section aria-labelledby="community-challenge-heading">
        <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-4 min-h-[200px] bg-[#13294B]">
              <img
                src={CHURCH_INFO.images.studyStill}
                alt="Bíblia aberta sobre mesa de madeira junto a caderno de apontamentos"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-8 p-6 sm:p-8">
              <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                {COMMUNITY_CHALLENGE_INFO.monthLabel} · {COMMUNITY_CHALLENGE_INFO.participantsCount} membros a participar
              </p>
              <h2
                id="community-challenge-heading"
                className="font-display text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1"
              >
                {COMMUNITY_CHALLENGE_INFO.title}
              </h2>
              <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-2 max-w-[60ch]">
                {COMMUNITY_CHALLENGE_INFO.subtitle}
              </p>

              <form onSubmit={handleSubmitComment} className="mt-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="challenge-author" className="sr-only">
                      O seu nome
                    </label>
                    <input
                      id="challenge-author"
                      type="text"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder="O seu nome (ex.: Ana Silveira)"
                      className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base"
                    />
                  </div>
                  <div>
                    <label htmlFor="challenge-day" className="sr-only">
                      Dia da leitura
                    </label>
                    <select
                      id="challenge-day"
                      value={commentDay}
                      onChange={(e) => setCommentDay(Number(e.target.value))}
                      className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base sm:text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          Dia {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="challenge-text" className="sr-only">
                    Partilhe uma reflexão sobre a leitura do dia
                  </label>
                  <textarea
                    id="challenge-text"
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="O que mais lhe falou na leitura de hoje?"
                    className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] p-3.5 text-base"
                  />
                </div>

                {commentError && (
                  <p className="text-xs text-[#9A3412] dark:text-[#FCA5A5]">{commentError}</p>
                )}

                <button
                  type="submit"
                  className="min-h-[46px] px-5 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Partilhar Reflexão</span>
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-[#141E2E]/10 dark:border-white/10 p-6 sm:p-8 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#556173] dark:text-[#A3B0C2]">
              Reflexões da Igreja ({challengeComments.length})
            </h3>
            <div className="divide-y divide-[#141E2E]/8 dark:divide-white/8">
              {challengeComments.map((c) => (
                <article key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                    <strong className="text-[#141E2E] dark:text-[#F2EFE9] font-semibold">
                      {c.author}
                    </strong>
                    <span aria-hidden="true">·</span>
                    <span>Dia {c.day}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.createdAt}</span>
                  </div>
                  <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1 leading-relaxed max-w-[65ch]">
                    {c.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
