import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenText,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  Image as ImageIcon,
  Loader2,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  StickyNote,
  Volume2,
  X,
} from 'lucide-react';
import {
  BIBLE_BOOKS_CATALOG,
  BIBLE_VERSIONS,
  getBookMetaById,
} from '../data/bibleBooksCatalog';
import { useSpeechReader } from '../hooks/useSpeechReader';
import {
  getChapterVersesFromCorpus,
  loadBibleVersion,
} from '../services/bibleLoader';
import type {
  BibleCorpus,
  BibleVersionId,
  BookmarkTheme,
  HighlightColor,
  ReaderSettings,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
} from '../types';
import { makeVerseKey, normalizeText, searchLoadedBible } from '../utils/bible';
import {
  type BibleStudyTarget,
  buildFullChapterContextText,
  buildSurroundingContextText,
  normalizeTextSelectionExcerpt,
} from '../utils/bibleStudy';
import { BibleStudyAI } from './BibleStudyAI';

interface BibleViewProps {
  bookId: string;
  chapter: number;
  highlightedVerse?: number;
  onNavigatePassage: (bookId: string, chapter: number, verse?: number) => void;
  primaryVersion: BibleVersionId;
  primaryCorpus: BibleCorpus | undefined;
  isLoadingPrimary: boolean;
  onChangePrimaryVersion: (v: BibleVersionId) => void;
  secondaryVersion: BibleVersionId;
  onChangeSecondaryVersion: (v: BibleVersionId) => void;
  readerSettings: ReaderSettings;
  onUpdateReaderSettings: (next: ReaderSettings) => void;
  highlights: Record<string, VerseHighlight>;
  onSetHighlight: (key: string, color: HighlightColor | null) => void;
  verseNotes: Record<string, VerseNote>;
  onSaveVerseNote: (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    text: string
  ) => void;
  bookmarks: VerseBookmark[];
  onToggleBookmark: (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    theme: BookmarkTheme
  ) => void;
  onOpenShareVerse: (referenceLabel: string, verseText: string) => void;
}

const HIGHLIGHT_STYLES: Record<HighlightColor, { label: string; bg: string; swatch: string }> = {
  amber: {
    label: 'Dourado',
    bg: 'bg-[#FDE68A]/45 dark:bg-[#D4A84E]/25',
    swatch: 'bg-[#EAB308]',
  },
  navy: {
    label: 'Azul Atlântico',
    bg: 'bg-[#BFDBFE]/50 dark:bg-[#3B82F6]/25',
    swatch: 'bg-[#2563EB]',
  },
  olive: {
    label: 'Verde Oliveira',
    bg: 'bg-[#BBF7D0]/50 dark:bg-[#22C55E]/22',
    swatch: 'bg-[#16A34A]',
  },
  terracotta: {
    label: 'Terracota',
    bg: 'bg-[#FECACA]/50 dark:bg-[#EF4444]/22',
    swatch: 'bg-[#DC2626]',
  },
};

const BOOKMARK_THEMES: BookmarkTheme[] = [
  'Fé',
  'Ansiedade',
  'Família',
  'Gratidão',
  'Esperança',
];

export const BibleView: React.FC<BibleViewProps> = ({
  bookId,
  chapter,
  highlightedVerse,
  onNavigatePassage,
  primaryVersion,
  primaryCorpus,
  isLoadingPrimary,
  onChangePrimaryVersion,
  secondaryVersion,
  onChangeSecondaryVersion,
  readerSettings,
  onUpdateReaderSettings,
  highlights,
  onSetHighlight,
  verseNotes,
  onSaveVerseNote,
  bookmarks,
  onToggleBookmark,
  onOpenShareVerse,
}) => {
  const currentBook = getBookMetaById(bookId) ?? BIBLE_BOOKS_CATALOG[0];
  const safeChapter = Math.min(Math.max(1, chapter), currentBook.totalChapters);

  const [parallelMode, setParallelMode] = useState(false);
  const [secondaryCorpus, setSecondaryCorpus] = useState<BibleCorpus | undefined>(undefined);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);

  const [showBookModal, setShowBookModal] = useState(false);
  const [modalTestament, setModalTestament] = useState<'ALL' | 'AT' | 'NT'>(currentBook.testament);
  const [modalBookId, setModalBookId] = useState<string>(currentBook.id);
  const [modalBookFilter, setModalBookFilter] = useState('');
  const [modalMobilePane, setModalMobilePane] = useState<'books' | 'chapters'>('books');

  const [showTypography, setShowTypography] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showVerseCompare, setShowVerseCompare] = useState(false);
  const [allVersionTexts, setAllVersionTexts] = useState<Partial<Record<BibleVersionId, string>>>(
    {}
  );
  const [isLoadingAllVersions, setIsLoadingAllVersions] = useState(false);

  // Floating context menu when user highlights text in a verse + BibleStudyAI target
  const chapterContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{
    verseNum: number;
    excerpt: string;
    x: number;
    y: number;
  } | null>(null);
  const [studyTarget, setStudyTarget] = useState<BibleStudyTarget | null>(null);

  const {
    isPlaying,
    isLoadingAudio,
    audioError,
    activeId,
    rate,
    ptPtVoices,
    activePtPtVoice,
    playSequence,
    stop,
    changeRate,
    selectVoice,
  } = useSpeechReader();

  // Load secondary version when parallel mode is active
  useEffect(() => {
    if (!parallelMode) return;
    let cancelled = false;
    setIsLoadingSecondary(true);
    loadBibleVersion(secondaryVersion)
      .then((data) => {
        if (!cancelled) setSecondaryCorpus(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSecondary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parallelMode, secondaryVersion]);

  const primaryVerses = useMemo(
    () => getChapterVersesFromCorpus(primaryCorpus, currentBook.id, safeChapter),
    [primaryCorpus, currentBook.id, safeChapter]
  );

  const secondaryVerses = useMemo(
    () => getChapterVersesFromCorpus(secondaryCorpus, currentBook.id, safeChapter),
    [secondaryCorpus, currentBook.id, safeChapter]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchLoadedBible(searchQuery, primaryCorpus, primaryVersion);
  }, [searchQuery, primaryCorpus, primaryVersion]);

  // Previous and Next chapter navigation across all 66 books
  const prevTarget = useMemo(() => {
    if (safeChapter > 1) {
      return { bookId: currentBook.id, chapter: safeChapter - 1, label: `Cap. ${safeChapter - 1}` };
    }
    if (currentBook.index > 0) {
      const prevBook = BIBLE_BOOKS_CATALOG[currentBook.index - 1];
      return {
        bookId: prevBook.id,
        chapter: prevBook.totalChapters,
        label: `${prevBook.shortName} ${prevBook.totalChapters}`,
      };
    }
    return null;
  }, [currentBook, safeChapter]);

  const nextTarget = useMemo(() => {
    if (safeChapter < currentBook.totalChapters) {
      return { bookId: currentBook.id, chapter: safeChapter + 1, label: `Cap. ${safeChapter + 1}` };
    }
    if (currentBook.index < BIBLE_BOOKS_CATALOG.length - 1) {
      const nextBook = BIBLE_BOOKS_CATALOG[currentBook.index + 1];
      return {
        bookId: nextBook.id,
        chapter: 1,
        label: `${nextBook.shortName} 1`,
      };
    }
    return null;
  }, [currentBook, safeChapter]);

  const openBibleStudy = useCallback(
    (verseNum: number, selectedExcerpt?: string) => {
      const text = primaryVerses[verseNum - 1] ?? '';
      if (!text) return;
      setStudyTarget({
        scope: 'verse',
        bookId: currentBook.id,
        bookName: currentBook.name,
        testament: currentBook.testament,
        totalChapters: currentBook.totalChapters,
        chapter: safeChapter,
        verse: verseNum,
        version: primaryVersion,
        verseText: text,
        selectedExcerpt: selectedExcerpt?.trim() ? selectedExcerpt.trim() : undefined,
        surroundingContext: buildSurroundingContextText(primaryVerses, verseNum, 2),
      });
    },
    [
      primaryVerses,
      currentBook.id,
      currentBook.name,
      currentBook.testament,
      currentBook.totalChapters,
      safeChapter,
      primaryVersion,
    ]
  );

  const openChapterStudy = useCallback(() => {
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
    setStudyTarget({
      scope: 'chapter',
      bookId: currentBook.id,
      bookName: currentBook.name,
      testament: currentBook.testament,
      totalChapters: currentBook.totalChapters,
      chapter: safeChapter,
      verse: 1,
      verseCount: primaryVerses.length,
      version: primaryVersion,
      chapterText: buildFullChapterContextText(primaryVerses),
    });
  }, [
    currentBook.id,
    currentBook.name,
    currentBook.testament,
    currentBook.totalChapters,
    safeChapter,
    primaryVerses,
    primaryVersion,
  ]);

  const openBookStudy = useCallback(
    (bookMeta = currentBook) => {
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
      setStudyTarget({
        scope: 'book',
        bookId: bookMeta.id,
        bookName: bookMeta.name,
        testament: bookMeta.testament,
        totalChapters: bookMeta.totalChapters,
        chapter: bookMeta.id === currentBook.id ? safeChapter : 1,
        verse: 1,
        version: primaryVersion,
      });
    },
    [currentBook, safeChapter, primaryVersion]
  );

  // Detect highlighted text selection inside any verse in the chapter container
  const updateSelectionContextMenu = useCallback(() => {
    const container = chapterContainerRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelectionMenu(null);
      return;
    }

    const excerpt = normalizeTextSelectionExcerpt(sel.toString());
    if (excerpt.length < 2) {
      setSelectionMenu(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const anchorEl =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;

    if (!anchorEl || !container.contains(anchorEl)) {
      setSelectionMenu(null);
      return;
    }

    const verseEl = anchorEl.closest<HTMLElement>('[data-verse-num]');
    const startVerseEl =
      (range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement
      )?.closest<HTMLElement>('[data-verse-num]') ?? verseEl;

    const verseNum = Number(startVerseEl?.dataset.verseNum ?? 0);
    if (!verseNum) {
      setSelectionMenu(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectionMenu(null);
      return;
    }

    const clampedX = Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160);
    const preferTop = rect.top > 96;
    const y = preferTop ? rect.top - 10 : rect.bottom + 10;

    setSelectionMenu({
      verseNum,
      excerpt,
      x: clampedX,
      y,
    });
  }, []);

  useEffect(() => {
    const onSelectionChange = () => {
      updateSelectionContextMenu();
    };
    const onScrollOrResize = () => {
      setSelectionMenu(null);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [updateSelectionContextMenu]);

  // Clear floating selection bar when changing chapter or book
  useEffect(() => {
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  }, [currentBook.id, safeChapter, primaryVersion]);

  const handleOpenVerseTools = (verseNum: number) => {
    setSelectedVerseNum(verseNum);
    const key = makeVerseKey(currentBook.id, safeChapter, verseNum);
    setNoteInput(verseNotes[key]?.text ?? '');
    setShowVerseCompare(false);
    setAllVersionTexts({});
  };

  const handleLoadAllVersionsForVerse = async (verseNum: number) => {
    if (showVerseCompare) {
      setShowVerseCompare(false);
      return;
    }
    setShowVerseCompare(true);
    setIsLoadingAllVersions(true);
    try {
      const entries = await Promise.all(
        BIBLE_VERSIONS.map(async (ver) => {
          const corpus = await loadBibleVersion(ver.id);
          const text = corpus[currentBook.index]?.[safeChapter - 1]?.[verseNum - 1] ?? '';
          return [ver.id, text] as const;
        })
      );
      const map: Partial<Record<BibleVersionId, string>> = {};
      for (const [id, txt] of entries) {
        map[id] = txt;
      }
      setAllVersionTexts(map);
    } finally {
      setIsLoadingAllVersions(false);
    }
  };

  const handleToggleChapterAudio = () => {
    if (isPlaying) {
      stop();
      return;
    }
    const items = primaryVerses
      .map((text, idx) => ({
        id: `v-${idx + 1}`,
        text: text ? `Versículo ${idx + 1}. ${text}` : '',
      }))
      .filter((item) => item.text.length > 0);
    playSequence(items, 0);
  };

  const selectedVerseText =
    selectedVerseNum !== null ? primaryVerses[selectedVerseNum - 1] ?? '' : '';
  const selectedVerseKey =
    selectedVerseNum !== null
      ? makeVerseKey(currentBook.id, safeChapter, selectedVerseNum)
      : '';
  const selectedHighlight = selectedVerseKey ? highlights[selectedVerseKey] : undefined;
  const selectedBookmark = selectedVerseKey
    ? bookmarks.find((b) => b.key === selectedVerseKey)
    : undefined;

  const modalFilteredBooks = useMemo(() => {
    const normFilter = normalizeText(modalBookFilter);
    return BIBLE_BOOKS_CATALOG.filter((b) => {
      if (normFilter) {
        return (
          normalizeText(b.name).includes(normFilter) ||
          normalizeText(b.shortName).includes(normFilter)
        );
      }
      if (modalTestament === 'ALL') return true;
      return b.testament === modalTestament;
    });
  }, [modalBookFilter, modalTestament]);

  const neighboringBooks = useMemo(() => {
    const start = Math.max(0, Math.min(currentBook.index - 2, BIBLE_BOOKS_CATALOG.length - 5));
    return BIBLE_BOOKS_CATALOG.slice(start, start + 5);
  }, [currentBook.index]);

  const activeModalBook = getBookMetaById(modalBookId) ?? currentBook;

  return (
    <div className="space-y-6">
      {/* Reader Toolbar */}
      <div className="sticky top-[52px] lg:top-0 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-[#FAF8F4]/95 dark:bg-[#0C1320]/95 backdrop-blur-md border-b border-[#141E2E]/10 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Book + Chapter & Primary Version */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalBookId(currentBook.id);
                setModalTestament('ALL');
                setModalBookFilter('');
                setModalMobilePane('books');
                setShowBookModal(true);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFE9DD] dark:bg-[#17253B] text-[#13294B] dark:text-[#F2EFE9] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              {currentBook.name} {safeChapter}
            </button>

            <label htmlFor="primary-version-select" className="sr-only">
              Versão da Bíblia
            </label>
            <select
              id="primary-version-select"
              value={primaryVersion}
              onChange={(e) => onChangePrimaryVersion(e.target.value as BibleVersionId)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#131E30] text-sm font-medium text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              {BIBLE_VERSIONS.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Reader Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setParallelMode((p) => !p)}
              aria-pressed={parallelMode}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                parallelMode
                  ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                  : 'border border-[#141E2E]/15 dark:border-white/15 text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Columns2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Comparar</span>
            </button>

            <button
              type="button"
              onClick={handleToggleChapterAudio}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Parar leitura em áudio' : 'Ouvir capítulo em áudio'}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                isPlaying
                  ? 'bg-[#8C6218] text-[#FAF8F4]'
                  : 'border border-[#141E2E]/15 dark:border-white/15 text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{isPlaying ? 'Pausar' : 'Ouvir'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTypography((t) => !t)}
              aria-expanded={showTypography}
              aria-label="Ajustar tipografia de leitura"
              className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowSearch((s) => !s)}
              aria-expanded={showSearch}
              aria-label="Pesquisar na Bíblia"
              className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-[#141E2E] dark:text-[#F2EFE9] hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Bar when speaking */}
        {(isPlaying || audioError) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#17253B] px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Play className="w-3.5 h-3.5 text-[#D4A84E] shrink-0" aria-hidden="true" />
              <span>
                {audioError ? (
                  audioError
                ) : isLoadingAudio ? (
                  <>A preparar áudio em <strong>Português (Portugal · pt-PT)</strong>...</>
                ) : (
                  <>
                    A ler {currentBook.name} {safeChapter} ({primaryVersion}) ·{' '}
                    <strong>Português (Portugal · pt-PT)</strong>
                    {activePtPtVoice ? ` · ${activePtPtVoice.name}` : ''}
                  </>
                )}
              </span>
            </div>
            {isPlaying && (
              <div className="flex flex-wrap items-center gap-1.5">
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
                  className="ml-2 px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 font-medium"
                >
                  Parar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Typography Settings Panel */}
        {showTypography && (
          <div className="mt-3 rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8] dark:bg-[#131E30] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5">
                  Tamanho da letra ({readerSettings.fontSize}px)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateReaderSettings({
                        ...readerSettings,
                        fontSize: Math.max(16, readerSettings.fontSize - 2),
                      })
                    }
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-sm font-semibold"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateReaderSettings({
                        ...readerSettings,
                        fontSize: Math.min(26, readerSettings.fontSize + 2),
                      })
                    }
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base font-semibold"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5">
                  Espaçamento
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Compacto', val: 1.5 },
                    { label: 'Normal', val: 1.75 },
                    { label: 'Amplo', val: 2.0 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() =>
                        onUpdateReaderSettings({ ...readerSettings, lineHeight: opt.val })
                      }
                      className={`min-h-[44px] px-3 rounded-lg text-xs font-medium ${
                        readerSettings.lineHeight === opt.val
                          ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                          : 'border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-1.5">
                  Tipo de Fonte
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateReaderSettings({ ...readerSettings, fontFamily: 'serif' })
                    }
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium font-bible-serif ${
                      readerSettings.fontFamily === 'serif'
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320]'
                    }`}
                  >
                    Com Serifa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateReaderSettings({ ...readerSettings, fontFamily: 'sans' })
                    }
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium font-bible-sans ${
                      readerSettings.fontFamily === 'sans'
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320]'
                    }`}
                  >
                    Sem Serifa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Full-Bible Search Panel */}
        {showSearch && (
          <div className="mt-3 rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8] dark:bg-[#131E30] p-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-[#556173] absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar em todos os 66 livros (ex.: 1 Coríntios 13:4, Apocalipse 21:4, graça)..."
                  aria-label="Pesquisar versículos ou referências"
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                aria-label="Fechar pesquisa"
                className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl border border-[#141E2E]/15 dark:border-white/15"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-[#141E2E]/8 dark:divide-white/8">
                {searchResults.length === 0 ? (
                  <p className="py-3 text-sm text-[#556173] dark:text-[#A3B0C2]">
                    Nenhum resultado encontrado para «{searchQuery}». Experimente outra palavra ou referência como «Isaías 41:10».
                  </p>
                ) : (
                  searchResults.map((res) => (
                    <button
                      key={`${res.bookId}-${res.chapter}-${res.verse}`}
                      type="button"
                      onClick={() => {
                        onNavigatePassage(res.bookId, res.chapter, res.verse);
                        setShowSearch(false);
                      }}
                      className="w-full text-left py-3 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className="text-xs font-semibold text-[#13294B] dark:text-[#D4A84E]">
                        {res.bookName} {res.chapter}:{res.verse} · {primaryVersion}
                      </span>
                      <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-0.5 line-clamp-2">
                        {res.text}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parallel Secondary Version Selector */}
      {parallelMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#131E30] px-4 py-3">
          <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2]">
            Comparação paralela ativa:{' '}
            <strong className="text-[#13294B] dark:text-[#D4A84E]">{primaryVersion}</strong>{' '}
            lado a lado com
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="secondary-version-select" className="sr-only">
              Segunda versão para comparação
            </label>
            <select
              id="secondary-version-select"
              value={secondaryVersion}
              onChange={(e) => onChangeSecondaryVersion(e.target.value as BibleVersionId)}
              className="min-h-[44px] px-3 py-1.5 rounded-lg border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-sm font-medium"
            >
              {BIBLE_VERSIONS.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.shortName} — {ver.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Chapter Heading & Reading Surface */}
      <article className={parallelMode ? 'max-w-none' : 'max-w-[66ch] mx-auto'}>
        <header className="pb-5 border-b border-[#141E2E]/10 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#8C6218] dark:text-[#D4A84E]">
                {BIBLE_VERSIONS.find((v) => v.id === primaryVersion)?.name} ·{' '}
                {currentBook.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141E2E] dark:text-[#F2EFE9] mt-1">
                {currentBook.name} {safeChapter}
              </h1>
              <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-1.5 tabular-nums">
                Capítulo {safeChapter} de {currentBook.totalChapters} · {primaryVerses.length} versículos
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openChapterStudy}
                className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] hover:opacity-95 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <BookOpenText className="w-4 h-4" aria-hidden="true" />
                <span>Estudar Cap. {safeChapter}</span>
              </button>
              <button
                type="button"
                onClick={() => openBookStudy(currentBook)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#8C6218]/35 dark:border-[#D4A84E]/40 bg-[#F4F0E8] dark:bg-[#131E30] text-[#13294B] dark:text-[#E5BE6D] hover:bg-[#EAE4D9] dark:hover:bg-[#1B2B44] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              >
                <span>Estudar Livro</span>
              </button>
            </div>
          </div>

          {/* Neighboring Books Bar: shows multiple books side by side for effortless switching */}
          <nav
            aria-label="Livros próximos na Bíblia"
            className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {neighboringBooks.map((nb) => {
              const isCurrBook = nb.id === currentBook.id;
              return (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => onNavigatePassage(nb.id, 1)}
                  aria-current={isCurrBook ? 'true' : undefined}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                    isCurrBook
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] font-semibold'
                      : 'border border-[#141E2E]/12 dark:border-white/12 text-[#3F4B5E] dark:text-[#C8D1DE] hover:bg-[#EFE9DD] dark:hover:bg-[#17253B]'
                  }`}
                >
                  {nb.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setModalBookId(currentBook.id);
                setModalTestament('ALL');
                setModalBookFilter('');
                setModalMobilePane('books');
                setShowBookModal(true);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 text-[#8C6218] dark:text-[#D4A84E] hover:bg-[#EFE9DD]/70 dark:hover:bg-[#17253B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
            >
              Ver todos (66)
            </button>
          </nav>
        </header>

        {isLoadingPrimary && primaryVerses.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-[#556173] dark:text-[#A3B0C2]">
            <Loader2 className="w-6 h-6 animate-spin text-[#13294B] dark:text-[#D4A84E]" />
            <span>A carregar {currentBook.name} {safeChapter} ({primaryVersion})...</span>
          </div>
        ) : (
          <div
            ref={chapterContainerRef}
            onMouseUp={updateSelectionContextMenu}
            onTouchEnd={() => {
              window.setTimeout(updateSelectionContextMenu, 40);
            }}
            className={`mt-6 space-y-4 ${
              readerSettings.fontFamily === 'serif' ? 'font-bible-serif' : 'font-bible-sans'
            }`}
            style={{
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight,
            }}
          >
            {parallelMode && (
              <div className="hidden md:grid md:grid-cols-2 gap-8 pb-2 border-b border-[#141E2E]/10 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-[#556173] dark:text-[#A3B0C2]">
                <div>
                  {primaryVersion} · {BIBLE_VERSIONS.find((v) => v.id === primaryVersion)?.name}
                </div>
                <div>
                  {secondaryVersion} · {BIBLE_VERSIONS.find((v) => v.id === secondaryVersion)?.name}
                </div>
              </div>
            )}

            {primaryVerses.map((text, idx) => {
              const verseNum = idx + 1;
              const secText = secondaryVerses[idx] ?? '';
              if (!text && !secText) return null;

              const vKey = makeVerseKey(currentBook.id, safeChapter, verseNum);
              const hl = highlights[vKey];
              const hasNote = Boolean(verseNotes[vKey]?.text);
              const hasBookmark = bookmarks.some((b) => b.key === vKey);
              const isActiveAudio = isPlaying && activeId === `v-${verseNum}`;
              const isSelected = selectedVerseNum === verseNum;
              const isTargetJump = highlightedVerse === verseNum;

              const highlightClass = hl ? HIGHLIGHT_STYLES[hl.color].bg : '';

              return (
                <div
                  key={verseNum}
                  data-verse-num={verseNum}
                  onClick={() => {
                    const selected = window.getSelection()?.toString().trim();
                    if (selected && selected.length >= 2) {
                      updateSelectionContextMenu();
                      return;
                    }
                    handleOpenVerseTools(verseNum);
                  }}
                  className={`rounded-xl transition-colors cursor-pointer ${
                    isActiveAudio
                      ? 'ring-2 ring-[#D4A84E] bg-[#D4A84E]/15 p-2 -mx-2'
                      : isSelected || isTargetJump
                      ? 'bg-[#EFE9DD]/70 dark:bg-[#17253B] p-2 -mx-2'
                      : 'hover:bg-[#EFE9DD]/40 dark:hover:bg-[#17253B]/45'
                  }`}
                >
                  <div
                    className={`w-full text-left rounded-lg ${
                      parallelMode ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8' : 'block'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVerseTools(verseNum);
                        }}
                        aria-label={`Abrir ferramentas de estudo do versículo ${verseNum}`}
                        className="font-mono-tabular text-xs font-semibold text-[#8C6218] dark:text-[#D4A84E] mt-2 shrink-0 select-none hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] rounded px-0.5"
                      >
                        {verseNum}
                      </button>
                      <span className={`rounded px-0.5 select-text ${highlightClass}`}>
                        {text || '— (versículo combinado no anterior)'}
                      </span>
                    </div>

                    {parallelMode && (
                      <div className="flex items-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#141E2E]/8 dark:border-white/8 text-[#3F4B5E] dark:text-[#C8D1DE]">
                        <sup className="font-mono-tabular text-xs font-semibold text-[#556173] dark:text-[#96A3B8] mt-2 shrink-0 select-none">
                          {verseNum}
                        </sup>
                        <span className="select-text">
                          {isLoadingSecondary
                            ? 'A carregar...'
                            : secText || '— (versículo combinado no anterior)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {(hasNote || hasBookmark) && (
                    <div className="mt-1.5 ml-5 flex items-center gap-3 text-xs text-[#556173] dark:text-[#A3B0C2] font-sans">
                      {hasNote && (
                        <span className="inline-flex items-center gap-1 text-[#13294B] dark:text-[#D4A84E]">
                          <StickyNote className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Nota pessoal</span>
                        </span>
                      )}
                      {hasBookmark && (
                        <span className="inline-flex items-center gap-1 text-[#8C6218] dark:text-[#E5BE6D]">
                          <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Marcador guardado</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Chapter Previous / Next Footer across all 66 books */}
        <nav
          aria-label="Navegação de capítulos"
          className="mt-10 pt-6 border-t border-[#141E2E]/10 dark:border-white/10 flex items-center justify-between gap-4"
        >
          <button
            type="button"
            disabled={!prevTarget}
            onClick={() =>
              prevTarget && onNavigatePassage(prevTarget.bookId, prevTarget.chapter)
            }
            className="min-h-[48px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>{prevTarget ? prevTarget.label : 'Início da Bíblia'}</span>
          </button>

          <button
            type="button"
            disabled={!nextTarget}
            onClick={() =>
              nextTarget && onNavigatePassage(nextTarget.bookId, nextTarget.chapter)
            }
            className="min-h-[48px] px-4 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-35 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span>{nextTarget ? nextTarget.label : 'Fim da Bíblia'}</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </article>

      {/* Complete 66-Book & Chapter Selector Modal */}
      {showBookModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-selector-title"
        >
          <div className="w-full sm:max-w-4xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#141E2E]/10 dark:border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2
                    id="book-selector-title"
                    className="font-display text-xl font-semibold text-[#141E2E] dark:text-[#F2EFE9]"
                  >
                    Bíblia Completa · 66 Livros
                  </h2>
                  <p className="text-xs text-[#556173] dark:text-[#A3B0C2] mt-0.5">
                    Visualize vários livros em simultâneo e toque num livro para escolher o capítulo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  aria-label="Fechar seletor de livros"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#0C1320] shrink-0 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTestament('ALL');
                      setModalBookFilter('');
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      modalTestament === 'ALL' && !modalBookFilter
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                    }`}
                  >
                    Todos (66)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTestament('AT');
                      setModalBookFilter('');
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      modalTestament === 'AT' && !modalBookFilter
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                    }`}
                  >
                    Antigo (39)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTestament('NT');
                      setModalBookFilter('');
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      modalTestament === 'NT' && !modalBookFilter
                        ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                        : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                    }`}
                  >
                    Novo (27)
                  </button>
                </div>

                <input
                  type="search"
                  value={modalBookFilter}
                  onChange={(e) => {
                    setModalBookFilter(e.target.value);
                    setModalMobilePane('books');
                  }}
                  placeholder="Filtrar livro (ex.: Isaías, Salmos, 1 Coríntios)..."
                  aria-label="Filtrar livros da Bíblia"
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#FAF8F4] dark:bg-[#0C1320] text-base sm:text-sm"
                />
              </div>

              {/* Mobile-only step toggle so 12–16 books fit comfortably at once without vertical clipping */}
              <div className="flex md:hidden p-1 rounded-xl bg-[#EAE4D9] dark:bg-[#0C1320]">
                <button
                  type="button"
                  onClick={() => setModalMobilePane('books')}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    modalMobilePane === 'books'
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                  }`}
                >
                  Livros ({modalFilteredBooks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalMobilePane('chapters')}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    modalMobilePane === 'chapters'
                      ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                      : 'text-[#3F4B5E] dark:text-[#C8D1DE]'
                  }`}
                >
                  Capítulos · {activeModalBook.name}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Multi-column Books Grid: displays 14–24+ books visibly side-by-side */}
              <div
                className={`md:col-span-7 grid-cols-2 sm:grid-cols-3 gap-2 content-start md:max-h-[58vh] overflow-y-auto pr-1 ${
                  modalMobilePane === 'books' ? 'grid' : 'hidden md:grid'
                }`}
              >
                {modalFilteredBooks.map((b) => {
                  const isSelected = b.id === activeModalBook.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setModalBookId(b.id);
                        setModalMobilePane('chapters');
                      }}
                      className={`min-h-[52px] px-3 py-2 rounded-xl flex flex-col justify-between text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D] ${
                        isSelected
                          ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] font-semibold'
                          : 'border border-[#141E2E]/10 dark:border-white/10 bg-[#F4F0E8]/70 dark:bg-[#0C1320]/60 hover:bg-[#EFE9DD] dark:hover:bg-[#1B2B44] text-[#141E2E] dark:text-[#F2EFE9]'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium leading-tight truncate w-full">
                        {b.name}
                      </span>
                      <span className="text-[11px] opacity-75 tabular-nums mt-0.5">
                        {b.shortName} · {b.totalChapters} cap.
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Chapters Grid for Selected Book */}
              <div
                className={`md:col-span-5 md:border-l border-[#141E2E]/10 dark:border-white/10 md:pl-5 ${
                  modalMobilePane === 'chapters' ? 'block' : 'hidden md:block'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-display text-base font-semibold text-[#141E2E] dark:text-[#F2EFE9]">
                    Capítulos de {activeModalBook.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalMobilePane('books')}
                    className="md:hidden text-xs font-medium text-[#8C6218] dark:text-[#D4A84E] min-h-[36px] px-2"
                  >
                    ← Outros livros
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookModal(false);
                    openBookStudy(activeModalBook);
                  }}
                  className="w-full min-h-[44px] mb-3 px-3.5 py-2 rounded-xl border border-[#8C6218]/35 dark:border-[#D4A84E]/40 bg-[#F4F0E8] dark:bg-[#0C1320] text-[#13294B] dark:text-[#E5BE6D] hover:bg-[#EAE4D9] dark:hover:bg-[#1B2B44] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
                >
                  <BookOpenText className="w-4 h-4 text-[#8C6218] dark:text-[#D4A84E]" aria-hidden="true" />
                  <span>Estudar o livro inteiro de {activeModalBook.name}</span>
                </button>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 md:max-h-[54vh] overflow-y-auto pr-1">
                  {Array.from({ length: activeModalBook.totalChapters }, (_, i) => i + 1).map(
                    (chNum) => {
                      const isCurr =
                        activeModalBook.id === currentBook.id && chNum === safeChapter;
                      return (
                        <button
                          key={chNum}
                          type="button"
                          onClick={() => {
                            onNavigatePassage(activeModalBook.id, chNum);
                            setShowBookModal(false);
                          }}
                          className={`min-h-[44px] rounded-xl text-sm font-medium tabular-nums transition-colors ${
                            isCurr
                              ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                              : 'bg-[#EFE9DD] dark:bg-[#0C1320] text-[#141E2E] dark:text-[#F2EFE9] hover:bg-[#E2D9C8] dark:hover:bg-[#1B2B44]'
                          }`}
                        >
                          {chNum}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verse Study Tools Drawer / Modal */}
      {selectedVerseNum !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0C1320]/60 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verse-tools-title"
        >
          <div className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#FAF8F4] dark:bg-[#131E30] border border-[#141E2E]/10 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="verse-tools-title"
                  className="font-display text-lg font-semibold text-[#13294B] dark:text-[#D4A84E]"
                >
                  {currentBook.name} {safeChapter}:{selectedVerseNum} ({primaryVersion})
                </h2>
                <p className="text-sm text-[#3F4B5E] dark:text-[#C8D1DE] mt-1 leading-relaxed">
                  «{selectedVerseText}»
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVerseNum(null)}
                aria-label="Fechar ferramentas do versículo"
                className="min-h-[44px] min-w-[44px] -mt-1 -mr-1 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Highlight Colors */}
            <div>
              <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-2">
                Sublinhar versículo
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(HIGHLIGHT_STYLES) as HighlightColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onSetHighlight(selectedVerseKey, color)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                      selectedHighlight?.color === color
                        ? 'border-[#13294B] dark:border-[#D4A84E] bg-[#EFE9DD] dark:bg-[#1B2B44]'
                        : 'border-[#141E2E]/12 dark:border-white/12'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${HIGHLIGHT_STYLES[color].swatch}`}
                      aria-hidden="true"
                    />
                    <span>{HIGHLIGHT_STYLES[color].label}</span>
                  </button>
                ))}
                {selectedHighlight && (
                  <button
                    type="button"
                    onClick={() => onSetHighlight(selectedVerseKey, null)}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-[#9A3412] dark:text-[#FCA5A5] hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Remover cor
                  </button>
                )}
              </div>
            </div>

            {/* Bookmark by Theme */}
            <div>
              <span className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-2">
                Guardar nos marcadores por tema
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {BOOKMARK_THEMES.map((theme) => {
                  const isSavedWithTheme = selectedBookmark?.theme === theme;
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() =>
                        onToggleBookmark(
                          currentBook.id,
                          currentBook.name,
                          safeChapter,
                          selectedVerseNum,
                          theme
                        )
                      }
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                        isSavedWithTheme
                          ? 'bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320]'
                          : 'border border-[#141E2E]/12 dark:border-white/12 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{theme}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Note on Verse */}
            <div>
              <label
                htmlFor="verse-personal-note"
                className="text-xs font-medium text-[#556173] dark:text-[#A3B0C2] block mb-2"
              >
                Apontamento pessoal neste versículo
              </label>
              <textarea
                id="verse-personal-note"
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Escreva uma nota de estudo ou aplicação pessoal..."
                className="w-full rounded-xl border border-[#141E2E]/15 dark:border-white/15 bg-[#F4F0E8]/60 dark:bg-[#0C1320] p-3 text-base text-[#141E2E] dark:text-[#F2EFE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862D]"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onSaveVerseNote(
                      currentBook.id,
                      currentBook.name,
                      safeChapter,
                      selectedVerseNum,
                      noteInput
                    );
                    setSelectedVerseNum(null);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-sm font-medium hover:opacity-90"
                >
                  Guardar Apontamento
                </button>
              </div>
            </div>

            {/* Compare All 7 Versions, Listen PT-PT, Share & Study with AI */}
            <div className="pt-3 border-t border-[#141E2E]/10 dark:border-white/10 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const v = selectedVerseNum;
                  setSelectedVerseNum(null);
                  openBibleStudy(v);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#13294B] text-[#FAF8F4] dark:bg-[#D4A84E] dark:text-[#0C1320] text-xs font-semibold inline-flex items-center gap-2 hover:opacity-95 transition-opacity"
              >
                <BookOpenText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Estudar este texto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const singleId = `single-${currentBook.id}-${safeChapter}-${selectedVerseNum}`;
                  if (isPlaying && activeId === singleId) {
                    stop();
                  } else if (selectedVerseText) {
                    playSequence([
                      {
                        id: singleId,
                        text: `${currentBook.name}, capítulo ${safeChapter}, versículo ${selectedVerseNum}. ${selectedVerseText}`,
                      },
                    ]);
                  }
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2"
              >
                {isPlaying &&
                activeId === `single-${currentBook.id}-${safeChapter}-${selectedVerseNum}` ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Parar Áudio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span>Ouvir (pt-PT)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleLoadAllVersionsForVerse(selectedVerseNum)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2"
              >
                <Columns2 className="w-4 h-4" aria-hidden="true" />
                <span>
                  {showVerseCompare
                    ? `Ocultar ${BIBLE_VERSIONS.length} Versões`
                    : `Comparar nas ${BIBLE_VERSIONS.length} Versões`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const label = `${currentBook.name} ${safeChapter}:${selectedVerseNum}`;
                  const txt = selectedVerseText;
                  setSelectedVerseNum(null);
                  onOpenShareVerse(label, txt);
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#141E2E]/15 dark:border-white/15 text-xs font-medium inline-flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                <span>Partilhar Imagem</span>
              </button>
            </div>

            {showVerseCompare && (
              <div className="space-y-3 pt-2 border-t border-[#141E2E]/10 dark:border-white/10">
                {isLoadingAllVersions ? (
                  <div className="py-4 flex items-center gap-2 text-xs text-[#556173] dark:text-[#A3B0C2]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A carregar todas as traduções portuguesas...</span>
                  </div>
                ) : (
                  BIBLE_VERSIONS.map((ver) => (
                    <div key={ver.id} className="text-sm">
                      <span className="font-semibold text-[#13294B] dark:text-[#D4A84E] text-xs">
                        {ver.shortName} · {ver.name}
                      </span>
                      <p className="text-[#3F4B5E] dark:text-[#C8D1DE] mt-0.5 leading-relaxed">
                        {allVersionTexts[ver.id] || '—'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Context Menu when user highlights a text excerpt in the Bible */}
      {selectionMenu && (
        <div
          role="toolbar"
          aria-label="Menu de contexto do texto selecionado"
          style={{
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y}px`,
            transform: selectionMenu.y > 100 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          className="fixed z-[90] flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#13294B] dark:bg-[#1B2B44] text-[#FAF8F4] border border-[#D4A84E]/40 shadow-2xl max-w-[92vw]"
        >
          <button
            type="button"
            onClick={() => {
              const { verseNum, excerpt } = selectionMenu;
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
              openBibleStudy(verseNum, excerpt);
            }}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#D4A84E] text-[#0C1320] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap hover:bg-[#E0B965] transition-colors"
          >
            <BookOpenText className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Estudar este texto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const key = makeVerseKey(currentBook.id, safeChapter, selectionMenu.verseNum);
              onSetHighlight(key, 'amber');
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            aria-label="Sublinhar versículo a dourado"
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-[#EAB308]" aria-hidden="true" />
            <span>Sublinhar</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `«${selectionMenu.excerpt}» (${currentBook.name} ${safeChapter}:${selectionMenu.verseNum} ${primaryVersion})`
                );
              } catch {
                // Clipboard unavailable
              }
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            aria-label="Copiar texto selecionado"
            className="min-h-[40px] min-w-[40px] px-2 rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center justify-center transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            aria-label="Fechar menu de seleção"
            className="min-h-[40px] min-w-[40px] px-2 rounded-xl hover:bg-white/15 inline-flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Theological & Historical Study AI Modal */}
      <BibleStudyAI
        isOpen={Boolean(studyTarget)}
        onClose={() => setStudyTarget(null)}
        target={studyTarget}
        onSwitchToChapterStudy={openChapterStudy}
        onSwitchToBookStudy={() => openBookStudy(currentBook)}
        onSaveStudyToNote={onSaveVerseNote}
      />
    </div>
  );
};
