import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';
import type {
  BibleCorpus,
  BibleVersionId,
  SermonNote,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
} from '../types';
import { extractBibleReferences, type DetectedBibleRef } from '../utils/bible';

type NotesSectionTab = 'apontamentos' | 'versiculos' | 'marcadores';

interface NotesViewProps {
  initialSelectedNoteId?: string | null;
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  notes: SermonNote[];
  onSaveNote: (note: SermonNote) => void;
  onDeleteNote: (id: string) => void;
  verseNotes: Record<string, VerseNote>;
  onSaveVerseNote: (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    text: string
  ) => void;
  bookmarks: VerseBookmark[];
  highlights: Record<string, VerseHighlight>;
  onOpenBibleChapter: (bookId: string, chapter: number, verse?: number) => void;
}

const CONTEXT_SUGGESTIONS = [
  'Apontamento da Mensagem',
  'Estudo Pessoal',
  'Grupo nos Lares',
  'Leitura Bíblica',
  'Oração',
];

export const NotesView: React.FC<NotesViewProps> = ({
  initialSelectedNoteId,
  bibleVersion,
  primaryCorpus,
  notes,
  onSaveNote,
  onDeleteNote,
  verseNotes,
  onSaveVerseNote,
  bookmarks,
  highlights,
  onOpenBibleChapter,
}) => {
  const [sectionTab, setSectionTab] = useState<NotesSectionTab>('apontamentos');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeNoteId, setActiveNoteId] = useState<string>(
    initialSelectedNoteId || notes[0]?.id || 'new'
  );
  const currentNote = notes.find((n) => n.id === activeNoteId);

  const [editTitle, setEditTitle] = useState(currentNote?.title ?? '');
  const [editContext, setEditContext] = useState(
    currentNote?.preacher ?? 'Apontamento da Mensagem'
  );
  const [editContent, setEditContent] = useState(currentNote?.content ?? '');
  const [previewRef, setPreviewRef] = useState<DetectedBibleRef | null>(null);
  const [savedFeedback, setSavedFeedback] = useState('');

  // Inline editing for verse notes
  const [editingVerseKey, setEditingVerseKey] = useState<string | null>(null);
  const [editingVerseText, setEditingVerseText] = useState('');

  useEffect(() => {
    if (initialSelectedNoteId) {
      const target = notes.find((n) => n.id === initialSelectedNoteId);
      if (target) {
        setSectionTab('apontamentos');
        setActiveNoteId(target.id);
        setEditTitle(target.title);
        setEditContext(target.preacher);
        setEditContent(target.content);
        setSavedFeedback('');
      }
    }
  }, [initialSelectedNoteId, notes]);

  const selectNoteForEdit = (note: SermonNote) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContext(note.preacher);
    setEditContent(note.content);
    setSavedFeedback('');
  };

  const handleCreateNewNote = () => {
    const newId = `sn-${Date.now()}`;
    const todayStr = new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    const fresh: SermonNote = {
      id: newId,
      title: 'Novo Apontamento',
      preacher: 'Apontamento da Mensagem',
      date: todayStr,
      content: '',
      updatedAt: todayStr,
    };
    onSaveNote(fresh);
    selectNoteForEdit(fresh);
  };

  const handleSaveCurrentNote = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    const noteToSave: SermonNote = {
      id: currentNote ? currentNote.id : `sn-${Date.now()}`,
      title: editTitle.trim() || 'Apontamento sem título',
      preacher: editContext.trim() || 'Apontamento Pessoal',
      date: currentNote?.date ?? todayStr,
      content: editContent,
      updatedAt: todayStr,
    };
    onSaveNote(noteToSave);
    setActiveNoteId(noteToSave.id);
    setSavedFeedback('Nota guardada neste dispositivo.');
    window.setTimeout(() => setSavedFeedback(''), 2500);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredNotes = useMemo(() => {
    if (!normalizedSearch) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(normalizedSearch) ||
        n.preacher.toLowerCase().includes(normalizedSearch) ||
        n.content.toLowerCase().includes(normalizedSearch)
    );
  }, [notes, normalizedSearch]);

  const verseNotesList = useMemo(() => {
    const all = Object.values(verseNotes).filter((n) => n.text.trim().length > 0);
    if (!normalizedSearch) return all;
    return all.filter(
      (vn) =>
        `${vn.bookName} ${vn.chapter}:${vn.verse}`.toLowerCase().includes(normalizedSearch) ||
        vn.text.toLowerCase().includes(normalizedSearch)
    );
  }, [verseNotes, normalizedSearch]);

  const filteredBookmarks = useMemo(() => {
    if (!normalizedSearch) return bookmarks;
    return bookmarks.filter(
      (bm) =>
        `${bm.bookName} ${bm.chapter}:${bm.verse}`.toLowerCase().includes(normalizedSearch) ||
        bm.theme.toLowerCase().includes(normalizedSearch)
    );
  }, [bookmarks, normalizedSearch]);

  const highlightCount = Object.keys(highlights).length;
  const detectedRefs = useMemo(() => extractBibleReferences(editContent), [editContent]);

  const renderContentWithClickableRefs = (text: string) => {
    const refs = extractBibleReferences(text);
    if (refs.length === 0) return <p className="whitespace-pre-line">{text}</p>;

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    refs.forEach((r, idx) => {
      if (r.startIndex > cursor) {
        parts.push(<span key={`txt-${idx}`}>{text.slice(cursor, r.startIndex)}</span>);
      }
      parts.push(
        <button
          key={`ref-${idx}`}
          type="button"
          onClick={() => setPreviewRef(r)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-[#EFE9DD] dark:bg-[#1E2F4A] text-[#13294B] dark:text-[#E5BE6D] font-semibold underline decoration-[#B8862D]/60 underline-offset-2 hover:opacity-85"
        >
          {r.raw}
        </button>
      );
      cursor = r.endIndex;
    });
    if (cursor < text.length) {
      parts.push(<span key="txt-end">{text.slice(cursor)}</span>);
    }
    return <div className="whitespace-pre-line leading-relaxed">{parts}</div>;
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <section className="pb-6 border-b border-[#141E2E]/10 dark:border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
              Arquivo Pessoal de Estudo · {notes.length}{' '}
              {notes.length === 1 ? 'apontamento' : 'apontamentos'} ·{' '}
              {Object.values(verseNotes).filter((n) => n.text.trim()).length}{' '}
              {Object.values(verseNotes).filter((n) => n.text.trim()).length === 1
                ? 'nota em versículo'
                : 'notas em versículos'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1 text-balance">
              As Minhas Notas
            </h1>
            <p className="text-sm text-[#556173] dark:text-[#A3B0C2] mt-1 max-w-[60ch]">
              Consulte, organize e edite todos os apontamentos guardados, notas por versículo e
              marcadores bíblicos.
            </p>
          </div>

          <div className="w-full lg:w-80 relative">
            <label htmlFor="notes-search" className="sr-only">
              Pesquisar nas minhas notas
            </label>
            <Search
              className="w-4 h-4 text-[#556173] dark:text-[#A3B0C2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="notes-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar notas ou versículos..."
              className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-base sm:text-sm text-[#141E2E] dark:text-[#F2EFE9] placeholder:text-[#7A8699] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#131E30] w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setSectionTab('apontamentos')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
              sectionTab === 'apontamentos'
                ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
            }`}
          >
            <NotebookPen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Apontamentos ({notes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('versiculos')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
              sectionTab === 'versiculos'
                ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Versículos ({Object.values(verseNotes).filter((n) => n.text.trim()).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSectionTab('marcadores')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
              sectionTab === 'marcadores'
                ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
            }`}
          >
            <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Marcadores ({bookmarks.length})</span>
          </button>
        </div>
      </section>

      {/* SECTION 1: SAVED NOTES & NOTEBOOK */}
      {sectionTab === 'apontamentos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Saved Notes List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                Guardadas ({filteredNotes.length})
              </h2>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Nova Nota</span>
              </button>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6 text-sm text-[#556173] dark:text-[#A3B0C2]">
                {normalizedSearch
                  ? 'Nenhum apontamento corresponde à sua pesquisa.'
                  : 'Ainda não tem apontamentos guardados. Clique em «Nova Nota» para começar.'}
              </div>
            ) : (
              <div className="divide-y divide-[#141E2E]/10 dark:divide-white/10 border border-[#141E2E]/10 dark:border-white/10 rounded-2xl overflow-hidden bg-[#FAF8F4] dark:bg-[#131E30]">
                {filteredNotes.map((note) => {
                  const active = note.id === activeNoteId;
                  const refCount = extractBibleReferences(note.content).length;
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => selectNoteForEdit(note)}
                      className={`w-full text-left p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B8862D] ${
                        active
                          ? 'bg-[#EFE9DD] dark:bg-[#1B2B44]'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <p className="text-xs text-[#556173] dark:text-[#A3B0C2] truncate">
                        {note.date} · {note.preacher}
                        {refCount > 0 ? ` · ${refCount} ref.` : ''}
                      </p>
                      <h3 className="font-display text-base font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-0.5 truncate">
                        {note.title}
                      </h3>
                      {note.content.trim() && (
                        <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-1 line-clamp-2">
                          {note.content}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Editor + Interactive Preview (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <form
              onSubmit={handleSaveCurrentNote}
              className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/60 dark:bg-[#131E30] p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="note-title"
                    className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                  >
                    Título do apontamento
                  </label>
                  <input
                    id="note-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Ex.: Oração e Confiança em Salmos 121"
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="note-context"
                    className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                  >
                    Tema ou contexto
                  </label>
                  <input
                    id="note-context"
                    list="note-context-options"
                    type="text"
                    value={editContext}
                    onChange={(e) => setEditContext(e.target.value)}
                    placeholder="Ex.: Estudo Pessoal"
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base"
                  />
                  <datalist id="note-context-options">
                    {CONTEXT_SUGGESTIONS.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label
                  htmlFor="note-body"
                  className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1"
                >
                  Texto da nota (escreva referências como «Romanos 8:28» ou «João 3:16» para abrir o versículo)
                </label>
                <textarea
                  id="note-body"
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Escreva aqui os seus apontamentos, reflexões ou pedidos de oração..."
                  className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] p-4 text-base leading-relaxed"
                />
              </div>

              {/* Detected Bible References */}
              <div className="pt-1">
                <p className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>Referências bíblicas detetadas automaticamente (toque para ler):</span>
                </p>
                {detectedRefs.length === 0 ? (
                  <p className="text-xs text-[#647084] dark:text-[#8E9BB0]">
                    Nenhuma referência detetada ainda. Experimente escrever «Romanos 8:28» ou «Salmos 23:1».
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detectedRefs.map((ref, idx) => (
                      <button
                        key={`${ref.raw}-${idx}`}
                        type="button"
                        onClick={() => setPreviewRef(ref)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFE9DD] dark:bg-[#1B2B44] border border-[#13294B]/15 dark:border-[#D4A84E]/30 text-xs font-semibold text-[#13294B] dark:text-[#E5BE6D] hover:opacity-85 transition-opacity whitespace-nowrap"
                      >
                        {ref.raw}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#1F5C3A] dark:text-[#6EE7B7] min-h-[20px] flex items-center gap-1">
                  {savedFeedback && (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{savedFeedback}</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {currentNote && (
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = notes.filter((n) => n.id !== currentNote.id);
                        onDeleteNote(currentNote.id);
                        if (remaining[0]) {
                          selectNoteForEdit(remaining[0]);
                        } else {
                          setActiveNoteId('new');
                          setEditTitle('');
                          setEditContext('Apontamento da Mensagem');
                          setEditContent('');
                        }
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#9A3412]/30 text-xs font-medium text-[#9A3412] dark:text-[#FCA5A5] inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Apagar</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90 whitespace-nowrap"
                  >
                    Guardar Nota
                  </button>
                </div>
              </div>
            </form>

            {editContent.trim() && (
              <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-6">
                <h3 className="text-xs font-semibold tracking-wider text-[#556173] dark:text-[#A3B0C2] mb-3">
                  Leitura com referências interativas
                </h3>
                <div className="text-base text-[#141E2E] dark:text-[#F2EFE9] max-w-[65ch]">
                  {renderContentWithClickableRefs(editContent)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: VERSE NOTES */}
      {sectionTab === 'versiculos' && (
        <section aria-label="Notas guardadas em versículos" className="space-y-4">
          {verseNotesList.length === 0 ? (
            <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-8 text-center">
              <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
                {normalizedSearch
                  ? 'Nenhuma nota em versículo encontrada para esta pesquisa.'
                  : 'Ainda não escreveu notas ligadas a versículos. Na Bíblia, toque num versículo para adicionar uma nota pessoal.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verseNotesList.map((vn) => {
                const isEditing = editingVerseKey === vn.key;
                const verseText = getVerseFromCorpusOrFallback(
                  bibleVersion,
                  vn.bookId,
                  vn.chapter,
                  vn.verse
                );
                return (
                  <article
                    key={vn.key}
                    className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#13294B] dark:text-[#D4A84E]">
                          {vn.bookName} {vn.chapter}:{vn.verse} · {bibleVersion}
                        </span>
                        <span className="text-[#556173] dark:text-[#A3B0C2]">{vn.updatedAt}</span>
                      </div>

                      {verseText && (
                        <p className="mt-2 font-bible-serif text-sm italic text-[#556173] dark:text-[#A3B0C2] line-clamp-2">
                          «{verseText}»
                        </p>
                      )}

                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={3}
                            value={editingVerseText}
                            onChange={(e) => setEditingVerseText(e.target.value)}
                            className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/60 dark:bg-[#0C1320] p-3 text-base sm:text-sm"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingVerseKey(null)}
                              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSaveVerseNote(
                                  vn.bookId,
                                  vn.bookName,
                                  vn.chapter,
                                  vn.verse,
                                  editingVerseText
                                );
                                setEditingVerseKey(null);
                              }}
                              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-medium"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-base leading-relaxed text-[#141E2E] dark:text-[#F2EFE9] max-w-[60ch]">
                          {vn.text}
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="pt-3 border-t border-[#141E2E]/8 dark:border-white/8 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenBibleChapter(vn.bookId, vn.chapter, vn.verse)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium text-[#13294B] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Abrir na Bíblia</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVerseKey(vn.key);
                              setEditingVerseText(vn.text);
                            }}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium text-[#556173] dark:text-[#A3B0C2] hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onSaveVerseNote(vn.bookId, vn.bookName, vn.chapter, vn.verse, '')
                            }
                            aria-label={`Apagar nota de ${vn.bookName} ${vn.chapter}:${vn.verse}`}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium text-[#9A3412] dark:text-[#FCA5A5] hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: BOOKMARKS & HIGHLIGHTS */}
      {sectionTab === 'marcadores' && (
        <section aria-label="Marcadores e sublinhados guardados" className="space-y-4">
          <p className="text-xs text-[#556173] dark:text-[#A3B0C2] tabular-nums">
            {filteredBookmarks.length} {filteredBookmarks.length === 1 ? 'marcador' : 'marcadores'} por
            tema · {highlightCount} {highlightCount === 1 ? 'versículo sublinhado' : 'versículos sublinhados'}
          </p>

          {filteredBookmarks.length === 0 ? (
            <div className="rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30] p-8 text-center">
              <p className="text-sm text-[#556173] dark:text-[#A3B0C2]">
                Nenhum marcador encontrado. Na Bíblia, toque num versículo para o guardar num tema (ex.: Fé, Gratidão).
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#141E2E]/10 dark:divide-white/10 rounded-2xl border border-[#141E2E]/10 dark:border-white/10 bg-[#FAF8F4] dark:bg-[#131E30]">
              {filteredBookmarks.map((bm) => (
                <button
                  key={bm.key}
                  type="button"
                  onClick={() => onOpenBibleChapter(bm.bookId, bm.chapter, bm.verse)}
                  className="w-full text-left p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                      {bm.bookName} {bm.chapter}:{bm.verse} · Tema: {bm.theme} · {bm.createdAt}
                    </p>
                    <p className="mt-1 font-bible-serif text-base text-[#141E2E] dark:text-[#F2EFE9] line-clamp-2 max-w-[65ch]">
                      «
                      {getVerseFromCorpusOrFallback(
                        bibleVersion,
                        bm.bookId,
                        bm.chapter,
                        bm.verse
                      )}
                      »
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#13294B] dark:text-[#D4A84E] shrink-0 whitespace-nowrap">
                    Abrir capítulo →
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Detected Reference Quick Verse Modal */}
      {previewRef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-ref-preview-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="notes-ref-preview-title"
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
