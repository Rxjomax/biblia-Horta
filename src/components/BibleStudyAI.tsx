import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  BookOpenText,
  BookmarkPlus,
  Check,
  History,
  Languages,
  Layers,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  type BibleStudyAnalysis,
  type BibleStudyChatMessage,
  type BibleStudyTabId,
  type BibleStudyTarget,
  formatBibleStudyCacheKey,
  formatBibleStudyReference,
  getBibleStudyQuickPrompts,
  getBibleStudyTabs,
  normalizeBibleStudyAnalysis,
  parseInlineMarkdownSegments,
  parseStudyMarkdownBlocks,
} from '../utils/bibleStudy';

const renderInlineBold = (text: string) =>
  parseInlineMarkdownSegments(text).map((seg, idx) =>
    seg.type === 'bold' ? (
      <strong key={idx} className="font-semibold text-[#13294B] dark:text-[#F2EFE9]">
        {seg.text}
      </strong>
    ) : (
      <React.Fragment key={idx}>{seg.text}</React.Fragment>
    )
  );

const FormattedStudyText: React.FC<{ text: string }> = ({ text }) => {
  const blocks = parseStudyMarkdownBlocks(text);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return (
            <h4
              key={idx}
              className="font-display text-base font-semibold text-[#13294B] dark:text-[#E5BE6D] pt-1"
            >
              {block.text}
            </h4>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInlineBold(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={idx}>{renderInlineBold(block.text)}</p>;
      })}
    </div>
  );
};

interface BibleStudyAIProps {
  isOpen: boolean;
  onClose: () => void;
  target: BibleStudyTarget | null;
  onSwitchToChapterStudy?: () => void;
  onSwitchToBookStudy?: () => void;
  onSaveStudyToNote?: (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    content: string
  ) => void;
}

const analysisCache = new Map<string, BibleStudyAnalysis>();

export const BibleStudyAI: React.FC<BibleStudyAIProps> = ({
  isOpen,
  onClose,
  target,
  onSwitchToChapterStudy,
  onSwitchToBookStudy,
  onSaveStudyToNote,
}) => {
  const [activeTab, setActiveTab] = useState<BibleStudyTabId>('teologia');
  const [analysis, setAnalysis] = useState<BibleStudyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Interactive specialist AI chat state
  const [chatMessages, setChatMessages] = useState<BibleStudyChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [savedNoteFeedback, setSavedNoteFeedback] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const cacheKey = target ? formatBibleStudyCacheKey(target) : '';

  // Reset conversation and active tab when opening a new verse/excerpt
  useEffect(() => {
    if (!isOpen || !target) return;
    setActiveTab('teologia');
    setChatMessages([]);
    setChatInput('');
    setChatError('');
    setSavedNoteFeedback(false);
  }, [isOpen, cacheKey]);

  // Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Fetch initial exegetical analysis from server-side Gemini endpoint
  useEffect(() => {
    if (!isOpen || !target) return;

    const cached = analysisCache.get(cacheKey);
    if (cached && reloadNonce === 0) {
      setAnalysis(cached);
      setErrorMsg('');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setErrorMsg('');

    fetch('/api/bible-study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: target.scope ?? 'verse',
        bookName: target.bookName,
        testament: target.testament,
        totalChapters: target.totalChapters,
        chapter: target.chapter,
        verse: target.verse,
        verseCount: target.verseCount,
        version: target.version,
        verseText: target.verseText ?? '',
        chapterText: target.chapterText ?? '',
        selectedExcerpt: target.selectedExcerpt ?? '',
        surroundingContext: target.surroundingContext ?? '',
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(
            data.error || `Não foi possível obter a explicação (${res.status}).`
          );
        }
        return normalizeBibleStudyAnalysis(data);
      })
      .then((normalized) => {
        if (cancelled) return;
        analysisCache.set(cacheKey, normalized);
        setAnalysis(normalized);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Erro ao consultar o assistente bíblico. Tente novamente.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, target, cacheKey, reloadNonce]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen || !target) return null;

  const scope =
    target.scope === 'book' ? 'book' : target.scope === 'chapter' ? 'chapter' : 'verse';
  const isBookStudy = scope === 'book';
  const isChapterStudy = scope === 'chapter';
  const refLabel = formatBibleStudyReference(target);
  const studyTabs = getBibleStudyTabs(scope);
  const quickPrompts = getBibleStudyQuickPrompts(scope);
  const testamentLabel =
    target.testament === 'NT'
      ? 'Novo Testamento'
      : target.testament === 'AT'
        ? 'Antigo Testamento'
        : '';

  const handleSendChat = async (questionRaw?: string) => {
    const question = (questionRaw ?? chatInput).trim();
    if (!question || isSendingChat) return;

    const userMsg: BibleStudyChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
      createdAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    if (!questionRaw) setChatInput('');
    setChatError('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/bible-study/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: {
            scope,
            bookName: target.bookName,
            testament: target.testament,
            totalChapters: target.totalChapters,
            chapter: target.chapter,
            verse: target.verse,
            verseCount: target.verseCount,
            version: target.version,
            verseText: target.verseText ?? '',
            chapterText: target.chapterText ?? '',
            selectedExcerpt: target.selectedExcerpt ?? '',
            surroundingContext: target.surroundingContext ?? '',
          },
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          question,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        throw new Error(data.error || 'Não foi possível gerar uma resposta neste momento.');
      }
      const aiMsg: BibleStudyChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.answer,
        createdAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Falha na comunicação com o assistente bíblico.'
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSaveNote = () => {
    if (!analysis || !onSaveStudyToNote) return;
    const summary = [
      isBookStudy
        ? `Estudo Panorâmico do Livro (${target.bookName} · ${target.version})`
        : isChapterStudy
          ? `Estudo do Capítulo Completo (${refLabel} · ${target.version})`
          : `Estudo (${refLabel} · ${target.version})`,
      `Ponto principal: ${analysis.mainPoint}`,
      `Teologia: ${analysis.theologicalExplanation}`,
      `Aplicação: ${analysis.practicalApplication}`,
    ].join('\n\n');
    onSaveStudyToNote(
      target.bookId,
      target.bookName,
      target.chapter ?? 1,
      target.verse ?? 1,
      summary
    );
    setSavedNoteFeedback(true);
    window.setTimeout(() => setSavedNoteFeedback(false), 3000);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#0C1320]/65 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bible-study-ai-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/12 dark:border-white/12 shadow-2xl overflow-hidden">
        {/* Editorial Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#141E2E]/10 dark:border-white/10 shrink-0 space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                {isBookStudy
                  ? `Estudo Panorâmico do Livro · ${target.bookName}${testamentLabel ? ` · ${testamentLabel}` : ''}`
                  : isChapterStudy
                    ? `Estudo do Capítulo Completo · ${refLabel} · ${target.version}`
                    : `Estudo Bíblico Exegético · ${refLabel} · ${target.version}`}
              </p>
              <h2
                id="bible-study-ai-title"
                className="font-display text-lg sm:text-2xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 text-balance"
              >
                {isBookStudy
                  ? `Estudo Completo de ${target.bookName}`
                  : isChapterStudy
                    ? `Estudo Completo de ${refLabel}`
                    : target.selectedExcerpt
                      ? `Estudo do trecho em ${refLabel}`
                      : `Compreender ${refLabel}`}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {analysis && onSaveStudyToNote && (
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#D4A84E] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5"
                >
                  {savedNoteFeedback ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline">Guardado nas Notas</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline">Guardar Estudo</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar estudo bíblico com IA"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[#141E2E] dark:text-[#F2EFE9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quoted Passage or Book / Chapter Scope Banner */}
          {isBookStudy ? (
            <div className="rounded-xl bg-[#F4F0E8] dark:bg-[#0C1320] px-3.5 py-2.5 sm:px-4 sm:py-3 border border-[#141E2E]/8 dark:border-white/8 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-[#3F4B5E] dark:text-[#C8D1DE] leading-relaxed flex-1 min-w-[200px]">
                Panorama completo de <strong className="text-[#141E2E] dark:text-[#F2EFE9]">{target.bookName}</strong>
                {target.totalChapters ? ` (${target.totalChapters} ${target.totalChapters === 1 ? 'capítulo' : 'capítulos'})` : ''}: autoria, esboço estrutural, teologia, termos no original e aplicação.
              </p>
              {onSwitchToChapterStudy && target.chapter && (
                <button
                  type="button"
                  onClick={onSwitchToChapterStudy}
                  className="text-xs font-semibold text-[#8C6218] dark:text-[#D4A84E] hover:underline underline-offset-4 whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded"
                >
                  Estudar Cap. {target.chapter} →
                </button>
              )}
            </div>
          ) : isChapterStudy ? (
            <div className="rounded-xl bg-[#F4F0E8] dark:bg-[#0C1320] px-3.5 py-2.5 sm:px-4 sm:py-3 border border-[#141E2E]/8 dark:border-white/8 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-[#3F4B5E] dark:text-[#C8D1DE] leading-relaxed flex-1 min-w-[200px]">
                Capítulo completo <strong className="text-[#141E2E] dark:text-[#F2EFE9]">{refLabel}</strong>
                {target.verseCount ? ` (${target.verseCount} versículos)` : ''}: fluxo versículo a versículo, teologia, contexto, termos no original e aplicação.
              </p>
              {onSwitchToBookStudy && (
                <button
                  type="button"
                  onClick={onSwitchToBookStudy}
                  className="text-xs font-semibold text-[#8C6218] dark:text-[#D4A84E] hover:underline underline-offset-4 whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded"
                >
                  Estudar livro de {target.bookName} →
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#F4F0E8] dark:bg-[#0C1320] px-3.5 py-2.5 sm:px-4 sm:py-3 border border-[#141E2E]/8 dark:border-white/8 space-y-1">
              {target.selectedExcerpt && (
                <p className="text-xs sm:text-sm font-medium text-[#8C6218] dark:text-[#E5BE6D] leading-relaxed">
                  Trecho selecionado: «{target.selectedExcerpt}»
                </p>
              )}
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="font-bible-serif text-sm sm:text-base text-[#141E2E] dark:text-[#F2EFE9] leading-relaxed flex-1 min-w-[200px]">
                  «{target.verseText}»
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {onSwitchToChapterStudy && target.chapter && (
                    <button
                      type="button"
                      onClick={onSwitchToChapterStudy}
                      className="text-xs font-semibold text-[#13294B] dark:text-[#E5BE6D] hover:underline underline-offset-4 whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded"
                    >
                      Estudar Cap. {target.chapter} →
                    </button>
                  )}
                  {onSwitchToBookStudy && (
                    <button
                      type="button"
                      onClick={onSwitchToBookStudy}
                      className="text-xs font-semibold text-[#8C6218] dark:text-[#D4A84E] hover:underline underline-offset-4 whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded"
                    >
                      Estudar livro de {target.bookName} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Study Tabs */}
          <div
            role="tablist"
            aria-label="Secções do estudo bíblico"
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1"
          >
            {studyTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    active
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] font-semibold'
                      : 'text-[#556173] dark:text-[#A3B0C2] bg-[#EAE4D9]/65 dark:bg-[#0C1320]/70 hover:bg-[#EAE4D9] dark:hover:bg-[#1B2B44]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab !== 'chat' && isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#13294B] dark:text-[#D4A84E]" />
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                  {isBookStudy
                    ? `A preparar o estudo panorâmico completo de ${target.bookName}...`
                    : isChapterStudy
                      ? `A preparar o estudo completo do capítulo ${refLabel}...`
                      : 'A analisar o texto original, contexto histórico e literário...'}
                </p>
                <p className="text-xs text-[#556173] dark:text-[#A3B0C2]">
                  {isBookStudy
                    ? 'A estruturar autoria, esboço por capítulos, teologia central e termos no original.'
                    : isChapterStudy
                      ? 'A analisar o fluxo versículo a versículo, teologia, contexto e palavras no original.'
                      : `A preparar síntese teológica e referências para ${refLabel} (${target.version}).`}
                </p>
              </div>
            </div>
          )}

          {activeTab !== 'chat' && !isLoading && errorMsg && (
            <div className="rounded-xl border border-[#9A3412]/25 dark:border-[#FCA5A5]/25 bg-[#FEF2F2] dark:bg-[#2A1515] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 text-[#9A3412] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#9A3412] dark:text-[#FCA5A5]">
                    Não foi possível carregar a análise teológica
                  </p>
                  <p className="text-sm text-[#556173] dark:text-[#D6B4B4] leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-semibold inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Abrir Conversa com IA</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: TEOLOGIA / VISÃO GERAL / VISÃO DO CAPÍTULO */}
          {activeTab === 'teologia' && !isLoading && analysis && (
            <div className="space-y-6 max-w-[65ch]">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C6218] dark:text-[#D4A84E] flex items-center gap-2">
                  <BookOpenText className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isBookStudy
                      ? 'Tema Central e Propósito do Livro'
                      : isChapterStudy
                        ? 'Mensagem Central do Capítulo'
                        : 'Ponto Principal do Texto'}
                  </span>
                </h3>
                <p className="font-display text-lg sm:text-xl font-medium text-[#141E2E] dark:text-[#F2EFE9] leading-relaxed">
                  {analysis.mainPoint}
                </p>
              </section>

              <div className="border-t border-[#141E2E]/10 dark:border-white/10 pt-5 space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#556173] dark:text-[#A3B0C2]">
                  {isBookStudy
                    ? 'Teologia Principal do Livro'
                    : isChapterStudy
                      ? 'Exposição Teológica do Capítulo'
                      : 'Explicação Teológica'}
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#E6EBF2] leading-[1.7]">
                  <FormattedStudyText text={analysis.theologicalExplanation} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTEXTO HISTÓRICO */}
          {activeTab === 'historico' && !isLoading && analysis && (
            <div className="space-y-5 max-w-[65ch]">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C6218] dark:text-[#D4A84E] flex items-center gap-2">
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isBookStudy
                      ? 'Autoria, Data, Destinatários e Contexto Histórico'
                      : isChapterStudy
                        ? 'Contexto Histórico e Cultural do Capítulo'
                        : 'Contexto Histórico e Cultural'}
                  </span>
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#E6EBF2] leading-[1.7]">
                  <FormattedStudyText text={analysis.historicalContext} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTEXTO LITERÁRIO & CANÓNICO */}
          {activeTab === 'literario' && !isLoading && analysis && (
            <div className="space-y-6 max-w-[65ch]">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C6218] dark:text-[#D4A84E] flex items-center gap-2">
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isBookStudy
                      ? 'Género Literário e Esboço Estrutural do Livro'
                      : isChapterStudy
                        ? 'Estrutura e Fluxo do Capítulo (por Blocos de Versículos)'
                        : 'Contexto Literário e Estrutura'}
                  </span>
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#E6EBF2] leading-[1.7]">
                  <FormattedStudyText text={analysis.literaryContext} />
                </div>
              </section>

              <div className="border-t border-[#141E2E]/10 dark:border-white/10 pt-5 space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#556173] dark:text-[#A3B0C2]">
                  Contexto Canónico (Ligação com Toda a Bíblia)
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#E6EBF2] leading-[1.7]">
                  <FormattedStudyText text={analysis.canonicalContext} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORIGINAL, QUESTÕES INTERPRETATIVAS & FONTES */}
          {activeTab === 'original' && !isLoading && analysis && (
            <div className="space-y-6 max-w-[65ch]">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C6218] dark:text-[#D4A84E] flex items-center gap-2">
                  <Languages className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isBookStudy
                      ? 'Termos-Chave Recorrentes no Original'
                      : isChapterStudy
                        ? 'Palavras-Chave do Capítulo no Original'
                        : 'Palavras Importantes no Texto Original'}
                  </span>
                </h3>
                {analysis.keyWords.length === 0 ? (
                  <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
                    Pergunte na aba «Conversar» para aprofundar um termo específico.
                  </p>
                ) : (
                  <div className="divide-y divide-[#141E2E]/10 dark:divide-white/10 border-t border-b border-[#141E2E]/10 dark:border-white/10">
                    {analysis.keyWords.map((word, idx) => (
                      <div key={idx} className="py-3.5 space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-lg font-semibold text-[#13294B] dark:text-[#D4A84E]">
                            {word.originalWord}
                          </span>
                          <span className="font-mono-tabular text-xs text-[#556173] dark:text-[#A3B0C2]">
                            ({word.transliteration}) · {word.language}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9]">
                          {word.meaning}
                        </p>
                        <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] leading-relaxed">
                          {word.significance}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {analysis.interpretiveQuestions.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-xs font-semibold tracking-wide text-[#556173] dark:text-[#A3B0C2]">
                    {isBookStudy
                      ? 'Principais Questões Interpretativas do Livro'
                      : isChapterStudy
                        ? 'Questões Interpretativas do Capítulo'
                        : 'Questões Interpretativas e Nuances'}
                  </h3>
                  <ul className="space-y-2.5 list-disc pl-5 text-sm sm:text-base text-[#141E2E] dark:text-[#E6EBF2] leading-relaxed">
                    {analysis.interpretiveQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </section>
              )}

              {analysis.sources.length > 0 && (
                <section className="border-t border-[#141E2E]/10 dark:border-white/10 pt-5 space-y-2">
                  <h3 className="text-xs font-semibold tracking-wide text-[#556173] dark:text-[#A3B0C2] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                    <span>
                      {isBookStudy
                        ? 'Passagens-Chave, Léxicos e Fontes de Referência'
                        : 'Fontes, Léxicos e Referências Cruzadas'}
                    </span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#3F4B5E] dark:text-[#C8D1DE]">
                    {analysis.sources.map((src, idx) => (
                      <li key={idx}>• {src}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* TAB 5: APLICAÇÃO PRÁTICA RESPONSÁVEL */}
          {activeTab === 'aplicacao' && !isLoading && analysis && (
            <div className="space-y-5 max-w-[65ch]">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C6218] dark:text-[#D4A84E]">
                  {isBookStudy
                    ? 'Aplicação Prática do Livro para a Igreja e Vida Cristã'
                    : isChapterStudy
                      ? 'Aplicação Prática do Capítulo Completo'
                      : 'Aplicação Prática Responsável'}
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#E6EBF2] leading-[1.7]">
                  <FormattedStudyText text={analysis.practicalApplication} />
                </div>
              </section>
            </div>
          )}

          {/* TAB 6: CONVERSAR COM IA ESPECIALISTA */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2]">
                  {isBookStudy
                    ? `Perguntas sugeridas sobre o livro de ${target.bookName}:`
                    : isChapterStudy
                      ? `Perguntas sugeridas sobre ${refLabel}:`
                      : `Perguntas sugeridas para estudar ${refLabel}:`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      disabled={isSendingChat}
                      onClick={() => void handleSendChat(promptText)}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/14 dark:border-white/14 bg-[#F4F0E8]/80 dark:bg-[#0C1320] text-xs font-medium text-left text-[#13294B] dark:text-[#E5BE6D] hover:bg-[#EAE4D9] dark:hover:bg-[#1B2B44] transition-colors disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {chatMessages.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-[#141E2E]/10 dark:border-white/10">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] ml-6 sm:ml-14'
                          : 'bg-[#F4F0E8] dark:bg-[#0C1320] text-[#141E2E] dark:text-[#F2EFE9] border border-[#141E2E]/10 dark:border-white/10 mr-4 sm:mr-10'
                      }`}
                    >
                      <div className="text-[11px] opacity-70 mb-1.5 font-medium">
                        {msg.role === 'user' ? 'Você' : 'Estudo Bíblico · IA'} · {msg.createdAt}
                      </div>
                      {msg.role === 'assistant' ? (
                        <FormattedStudyText text={msg.text} />
                      ) : (
                        <p className="whitespace-pre-line">{msg.text}</p>
                      )}
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex items-center gap-2 text-xs text-[#556173] dark:text-[#A3B0C2] px-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A consultar fontes e responder...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {chatError && (
                <p className="text-xs text-[#9A3412] dark:text-[#FCA5A5]">{chatError}</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Ask-AI Bar (visible in Chat or quick jump from any tab) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeTab !== 'chat') setActiveTab('chat');
            void handleSendChat();
          }}
          className="p-4 sm:p-5 border-t border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] shrink-0"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="bible-study-chat-input" className="sr-only">
              Fazer uma pergunta sobre {refLabel}
            </label>
            <input
              id="bible-study-chat-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => {
                if (activeTab !== 'chat' && chatMessages.length > 0) setActiveTab('chat');
              }}
              placeholder={
                isBookStudy
                  ? `Pergunte sobre o livro de ${target.bookName} (esboço, autoria, teologia...)`
                  : isChapterStudy
                    ? `Pergunte sobre ${refLabel} (fluxo, versículos, original...)`
                    : `Pergunte sobre ${refLabel} (contexto, original, aplicação...)`
              }
              className="flex-1 min-h-[46px] px-4 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/70 dark:bg-[#0C1320] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            />
            <button
              type="submit"
              disabled={isSendingChat || !chatInput.trim()}
              aria-label="Enviar pergunta ao estudo bíblico"
              className="min-h-[46px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 hover:opacity-95 transition-opacity shrink-0"
            >
              {isSendingChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
