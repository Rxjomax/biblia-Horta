import React, { useState } from 'react';
import { HeartHandshake, NotebookPen } from 'lucide-react';
import type { PrayerRequest } from '../types';

interface CommunityViewProps {
  prayerRequests: PrayerRequest[];
  prayedIds: string[];
  onAddPrayerRequest: (
    author: string,
    isAnonymous: boolean,
    category: PrayerRequest['category'],
    content: string
  ) => void;
  onTogglePraying: (id: string) => void;
  onOpenNotesTab: () => void;
  isCloudSignedIn?: boolean;
  onGoToCloudSync?: () => void;
}

const PRAYER_CATEGORIES: PrayerRequest['category'][] = [
  'Família',
  'Saúde',
  'Gratidão',
  'Orientação',
  'Igreja',
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  prayerRequests,
  prayedIds,
  onAddPrayerRequest,
  onTogglePraying,
  onOpenNotesTab,
  isCloudSignedIn = false,
  onGoToCloudSync,
}) => {
  const [prayerFilter, setPrayerFilter] = useState<'Todos' | PrayerRequest['category']>('Todos');
  const [prayerAuthor, setPrayerAuthor] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayerCategory, setPrayerCategory] = useState<PrayerRequest['category']>('Família');
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerError, setPrayerError] = useState('');

  const handleSubmitPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerContent.trim()) {
      setPrayerError('Escreva o seu pedido de oração antes de publicar.');
      return;
    }
    setPrayerError('');
    onAddPrayerRequest(
      isAnonymous ? 'Pedido Anónimo' : prayerAuthor.trim() || 'Irmão(ã) da Igreja',
      isAnonymous,
      prayerCategory,
      prayerContent.trim()
    );
    setPrayerContent('');
    setPrayerAuthor('');
    setIsAnonymous(false);
  };

  const filteredPrayers =
    prayerFilter === 'Todos'
      ? prayerRequests
      : prayerRequests.filter((p) => p.category === prayerFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="pb-6 border-b border-[#141E2E]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
            Vida em Igreja · @iebhorta
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1">
            Mural de Oração
          </h1>
          <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-1 max-w-[60ch]">
            Partilhe pedidos de oração ou agradecimentos com a igreja e acompanhe os irmãos em intercessão.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNotesTab}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-2 self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <NotebookPen className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Ir para as Minhas Notas</span>
        </button>
      </section>

      {/* Prayer Wall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form (5 cols) */}
        <form
          onSubmit={handleSubmitPrayer}
          className="lg:col-span-5 rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] p-6 space-y-4"
        >
          <h2 className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
            Partilhar Pedido de Oração
          </h2>
          <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
            A igreja ora consigo. Pode identificar-se ou publicar de forma anónima.
          </p>
          {!isCloudSignedIn && onGoToCloudSync && (
            <p className="text-xs text-[#556173] dark:text-[#A3B0C2] leading-relaxed">
              Guardado localmente neste dispositivo.{' '}
              <button
                type="button"
                onClick={onGoToCloudSync}
                className="font-medium text-[#13294B] dark:text-[#D4A84E] underline underline-offset-2"
              >
                Entre com Google em Mais
              </button>{' '}
              para partilhar em tempo real com toda a igreja.
            </p>
          )}

          <div>
            <label
              htmlFor="prayer-category"
              className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5"
            >
              Motivo
            </label>
            <select
              id="prayer-category"
              value={prayerCategory}
              onChange={(e) => setPrayerCategory(e.target.value as PrayerRequest['category'])}
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base"
            >
              {PRAYER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="prayer-author"
              className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5"
            >
              O seu nome
            </label>
            <input
              id="prayer-author"
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? 'Anónimo' : prayerAuthor}
              onChange={(e) => setPrayerAuthor(e.target.value)}
              placeholder="Ex.: Joana Silva"
              className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base disabled:opacity-50"
            />
          </div>

          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer text-sm text-[#3F4B5E] dark:text-[#C8D1DE]">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded accent-[#13294B] dark:accent-[#D4A84E]"
            />
            <span>Publicar de forma anónima</span>
          </label>

          <div>
            <label
              htmlFor="prayer-content"
              className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5"
            >
              Pedido de oração
            </label>
            <textarea
              id="prayer-content"
              rows={4}
              value={prayerContent}
              onChange={(e) => setPrayerContent(e.target.value)}
              placeholder="Como podemos orar por si esta semana?"
              className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] p-3.5 text-base"
            />
          </div>

          {prayerError && (
            <p className="text-xs text-[#9A3412] dark:text-[#FCA5A5]">{prayerError}</p>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] px-5 py-2.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Publicar Pedido no Mural
          </button>
        </form>

        {/* List (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {(['Todos', ...PRAYER_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPrayerFilter(cat)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  prayerFilter === cat
                    ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                    : 'border border-[#141E2E]/15 dark:border-white/15 text-[#556173] dark:text-[#A3B0C2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredPrayers.map((req) => {
              const isPraying = prayedIds.includes(req.id);
              return (
                <article
                  key={req.id}
                  className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                    <span>
                      <strong className="text-[#141E2E] dark:text-[#F2EFE9] font-semibold">
                        {req.isAnonymous ? 'Pedido Anónimo' : req.author}
                      </strong>
                      {' · '}
                      {req.category}
                    </span>
                    <span>{req.createdAt}</span>
                  </div>

                  <p className="mt-2.5 text-base leading-relaxed text-[#3F4B5E] dark:text-[#C8D1DE] max-w-[65ch]">
                    {req.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#141E2E]/8 dark:border-white/8 flex items-center justify-between gap-4">
                    <span className="text-xs text-[#556173] dark:text-[#A3B0C2] tabular-nums">
                      {req.prayingCount} {req.prayingCount === 1 ? 'pessoa a orar' : 'pessoas a orar'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onTogglePraying(req.id)}
                      aria-pressed={isPraying}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
                        isPraying
                          ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                          : 'border border-[#13294B]/25 dark:border-[#D4A84E]/40 text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <HeartHandshake className="w-4 h-4" aria-hidden="true" />
                      <span>{isPraying ? 'A orar por ti' : 'Estou a orar por ti'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
