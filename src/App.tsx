import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { BibleView } from './components/BibleView';
import { CommunityView } from './components/CommunityView';
import { HomeView } from './components/HomeView';
import { MoreView } from './components/MoreView';
import { Navigation } from './components/Navigation';
import { NotesView } from './components/NotesView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlansView } from './components/PlansView';
import { SmartReminderBanner } from './components/SmartReminderBanner';
import { SocialQRModal } from './components/SocialQRModal';
import { VerseShareModal } from './components/VerseShareModal';
import { READING_PLANS } from './data/churchData';
import { auth, signInWithGooglePopup, signOutFromFirebase } from './firebase';
import { useSmartReminders } from './hooks/useSmartReminders';
import { getCachedBibleCorpus, loadBibleVersion } from './services/bibleLoader';
import {
  createChallengeCommentInCloud,
  createPrayerRequestInCloud,
  deleteSermonNoteFromCloud,
  ensureUserWorkspaceDoc,
  saveSermonNoteToCloud,
  saveVerseNoteToCloud,
  saveVisitorCardToCloud,
  subscribePublicChurchData,
  subscribeUserWorkspaceData,
  syncBookmarkToCloud,
  syncHighlightToCloud,
  syncPlanProgressToCloud,
  syncWorkspacePreferencesToCloud,
  togglePrayerCountInCloud,
} from './services/firestoreSync';
import type {
  AppTab,
  BibleCorpus,
  BibleVersionId,
  BookmarkTheme,
  CommunityChallengeComment,
  HighlightColor,
  NotificationSettings,
  PrayerRequest,
  ReaderSettings,
  SermonNote,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
  VisitorSubmission,
} from './types';
import { makeVerseKey, updateStreakOnRead } from './utils/bible';
import { loadPersistedState, savePersistedKey } from './utils/storage';

export default function App() {
  const [initial] = useState(() => loadPersistedState());

  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [selectedNoteIdForTab, setSelectedNoteIdForTab] = useState<string | null>(null);
  const [isSocialQROpen, setIsSocialQROpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(initial.theme);
  const [bibleVersion, setBibleVersion] = useState<BibleVersionId>(initial.bibleVersion);
  const [secondaryVersion, setSecondaryVersion] = useState<BibleVersionId>(
    initial.secondaryVersion
  );
  const [primaryCorpus, setPrimaryCorpus] = useState<BibleCorpus | undefined>(() =>
    getCachedBibleCorpus(initial.bibleVersion)
  );
  const [isLoadingPrimary, setIsLoadingPrimary] = useState<boolean>(false);

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(initial.readerSettings);

  // Active passage in Bible reader
  const [bibleBookId, setBibleBookId] = useState<string>('salmos');
  const [bibleChapter, setBibleChapter] = useState<number>(121);
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(undefined);

  // Study tools state
  const [highlights, setHighlights] = useState<Record<string, VerseHighlight>>(
    initial.highlights
  );
  const [verseNotes, setVerseNotes] = useState<Record<string, VerseNote>>(initial.verseNotes);
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>(initial.bookmarks);

  // Plans & streak
  const [activePlanId, setActivePlanId] = useState<string>(initial.activePlanId);
  const [planProgress, setPlanProgress] = useState<Record<string, number[]>>(initial.planProgress);
  const [streak, setStreak] = useState<number>(initial.streak);
  const [lastReadDate, setLastReadDate] = useState<string | null>(initial.lastReadDate);
  const [challengeComments, setChallengeComments] = useState<CommunityChallengeComment[]>(
    initial.challengeComments
  );

  // Community state
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(initial.prayerRequests);
  const [prayedIds, setPrayedIds] = useState<string[]>(initial.prayedIds);
  const [sermonNotes, setSermonNotes] = useState<SermonNote[]>(initial.sermonNotes);

  // More / Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>(initial.notifications);
  const [visitorSubmissions, setVisitorSubmissions] = useState<VisitorSubmission[]>(
    initial.visitorSubmissions
  );

  // Share as image modal
  const [shareModalData, setShareModalData] = useState<{
    open: boolean;
    referenceLabel: string;
    verseText: string;
  }>({
    open: false,
    referenceLabel: '',
    verseText: '',
  });

  // Firebase Auth & Firestore Cloud state
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>(
    'local'
  );
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string>('');

  const activePlanObj =
    READING_PLANS.find((plan) => plan.id === activePlanId) ?? READING_PLANS[0];
  const completedDaysForActivePlan = planProgress[activePlanObj?.id ?? ''] ?? [];
  const nextPlanDayObj =
    activePlanObj?.days.find((d) => !completedDaysForActivePlan.includes(d.day)) ??
    activePlanObj?.days[0];

  const {
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    activeReminder,
    dismissReminder,
    triggerTestReminder,
    deliveryFeedback: reminderFeedback,
  } = useSmartReminders({
    settings: notifications,
    bibleVersion,
    primaryCorpus,
    activePlan: activePlanObj,
    nextDay: nextPlanDayObj,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    savePersistedKey('theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedBibleCorpus(bibleVersion);
    if (cached) {
      setPrimaryCorpus(cached);
      setIsLoadingPrimary(false);
      return;
    }
    setIsLoadingPrimary(true);
    loadBibleVersion(bibleVersion)
      .then((data) => {
        if (!cancelled) setPrimaryCorpus(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrimary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bibleVersion]);

  // Always-on real-time listener for shared public church walls (Mural de Oração & Reflexões)
  // Runs across website and mobile app immediately, even before signing in.
  useEffect(() => {
    const unsubPublic = subscribePublicChurchData({
      onPrayerRequests: (cloudReqs) => {
        setPrayerRequests((prev) => {
          const cloudIds = new Set(cloudReqs.map((r) => r.id));
          // Preserve any unsynced locally created requests (pr_*) not yet uploaded to cloud
          const pendingLocal = prev.filter(
            (r) => r.id.startsWith('pr_') && !cloudIds.has(r.id)
          );
          const merged = [...pendingLocal, ...cloudReqs];
          savePersistedKey('prayerRequests', merged);
          return merged;
        });
      },
      onChallengeComments: (cloudComments) => {
        setChallengeComments((prev) => {
          const cloudIds = new Set(cloudComments.map((c) => c.id));
          const pendingLocal = prev.filter(
            (c) => c.id.startsWith('cc_') && !cloudIds.has(c.id)
          );
          const merged = [...pendingLocal, ...cloudComments];
          savePersistedKey('challengeComments', merged);
          return merged;
        });
      },
      onError: () => {
        // Keep local cache available if offline or Firestore is temporarily unreachable
      },
    });
    return () => unsubPublic();
  }, []);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCloudUser(user);
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!user) {
        setCloudSyncStatus('local');
        return;
      }

      setCloudSyncStatus('syncing');
      setCloudSyncMessage('');
      try {
        const { created } = await ensureUserWorkspaceDoc(user, {
          theme,
          bibleVersion,
          secondaryVersion,
          activePlanId,
          streak,
          lastReadDate,
        });

        unsubFirestore = subscribeUserWorkspaceData(user, {
          onWorkspace: (data) => {
            if (data.theme) {
              setTheme(data.theme);
              savePersistedKey('theme', data.theme);
            }
            if (data.bibleVersion) {
              setBibleVersion(data.bibleVersion);
              savePersistedKey('bibleVersion', data.bibleVersion);
            }
            if (data.secondaryVersion) {
              setSecondaryVersion(data.secondaryVersion);
              savePersistedKey('secondaryVersion', data.secondaryVersion);
            }
            if (data.activePlanId) {
              setActivePlanId(data.activePlanId);
              savePersistedKey('activePlanId', data.activePlanId);
            }
            if (typeof data.streak === 'number') {
              setStreak(data.streak);
              savePersistedKey('streak', data.streak);
            }
            if (data.lastReadDate !== undefined) {
              setLastReadDate(data.lastReadDate);
              savePersistedKey('lastReadDate', data.lastReadDate);
            }
          },
          onSermonNotes: (notes) => {
            setSermonNotes(notes);
            savePersistedKey('sermonNotes', notes);
          },
          onVerseNotes: (vNotes) => {
            setVerseNotes(vNotes);
            savePersistedKey('verseNotes', vNotes);
          },
          onBookmarks: (bms) => {
            setBookmarks(bms);
            savePersistedKey('bookmarks', bms);
          },
          onHighlights: (hls) => {
            setHighlights(hls);
            savePersistedKey('highlights', hls);
          },
          onPlanProgress: (prog) => {
            setPlanProgress((prev) => {
              const merged = { ...prev, ...prog };
              savePersistedKey('planProgress', merged);
              return merged;
            });
          },
          onVisitorCards: (cards) => {
            setVisitorSubmissions(cards);
            savePersistedKey('visitorSubmissions', cards);
          },
        });

        // Push any locally created community prayer requests / challenge comments queued prior to sign-in
        const latestPersisted = loadPersistedState();
        const localPendingPrayers = latestPersisted.prayerRequests.filter((r) =>
          r.id.startsWith('pr_')
        );
        for (const req of localPendingPrayers) {
          try {
            await createPrayerRequestInCloud(user.uid, req);
          } catch (itemErr) {
            console.error('Falha ao enviar pedido pendente para a nuvem:', itemErr);
          }
        }
        const localPendingComments = latestPersisted.challengeComments.filter((c) =>
          c.id.startsWith('cc_')
        );
        for (const comment of localPendingComments) {
          try {
            await createChallengeCommentInCloud(user.uid, comment);
          } catch (itemErr) {
            console.error('Falha ao enviar reflexão pendente para a nuvem:', itemErr);
          }
        }

        if (created) {
          await handleForceCloudSync(user);
        } else {
          setCloudSyncStatus('synced');
          const timeStr = new Intl.DateTimeFormat('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date());
          setCloudSyncMessage(`Dados sincronizados com a base de dados Firebase às ${timeStr}.`);
        }
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        setCloudSyncStatus('error');
        if (raw.toLowerCase().includes('quota')) {
          setCloudSyncMessage(
            'Limite diário gratuito do Firebase atingido temporariamente. Os seus dados locais continuam seguros.'
          );
        } else if (raw.toLowerCase().includes('offline') || raw.toLowerCase().includes('unavailable')) {
          setCloudSyncMessage(
            'Sem ligação estável ao servidor Firebase neste momento. Os seus dados locais continuam seguros.'
          );
        } else {
          setCloudSyncMessage(
            'Não foi possível ligar à base de dados Firebase neste momento. Clique em «Sincronizar Agora» para tentar novamente.'
          );
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForceCloudSync = async (targetUser: User | null = cloudUser) => {
    if (!targetUser) return;
    setCloudSyncStatus('syncing');
    try {
      await ensureUserWorkspaceDoc(targetUser, {
        theme,
        bibleVersion,
        secondaryVersion,
        activePlanId,
        streak,
        lastReadDate,
      });
      await syncWorkspacePreferencesToCloud(
        targetUser.uid,
        targetUser.displayName || targetUser.email || 'Membro IEB Horta',
        {
          theme,
          bibleVersion,
          secondaryVersion,
          activePlanId,
          streak,
          lastReadDate,
        }
      );
      for (const note of sermonNotes) {
        await saveSermonNoteToCloud(targetUser.uid, note);
      }
      for (const [vKey, vNote] of Object.entries(verseNotes)) {
        await saveVerseNoteToCloud(targetUser.uid, vNote, vKey);
      }
      for (const bm of bookmarks) {
        await syncBookmarkToCloud(targetUser.uid, bm, bm.key);
      }
      for (const [hKey, hl] of Object.entries(highlights)) {
        await syncHighlightToCloud(targetUser.uid, hKey, hl.color, hl.updatedAt);
      }
      for (const [pId, days] of Object.entries(planProgress)) {
        await syncPlanProgressToCloud(targetUser.uid, pId, days);
      }
      for (const card of visitorSubmissions) {
        await saveVisitorCardToCloud(targetUser.uid, card);
      }
      for (const req of prayerRequests) {
        if (req.id.startsWith('pr_')) {
          await createPrayerRequestInCloud(targetUser.uid, req);
        }
      }
      for (const comment of challengeComments) {
        if (comment.id.startsWith('cc_')) {
          await createChallengeCommentInCloud(targetUser.uid, comment);
        }
      }
      setCloudSyncStatus('synced');
      const timeStr = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
      setCloudSyncMessage(`Dados sincronizados com a base de dados Firebase às ${timeStr}.`);
    } catch {
      setCloudSyncStatus('error');
      setCloudSyncMessage(
        'Falha ao sincronizar alguns dados com a nuvem. Tente novamente dentro de momentos.'
      );
    }
  };

  const handleSignInGoogle = async (): Promise<{
    user: User | null;
    errorMessage?: string;
  }> => {
    setCloudSyncMessage('');
    try {
      const signedUser = await signInWithGooglePopup();
      return { user: signedUser };
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      let msg = 'Não foi possível concluir o início de sessão com Google neste momento.';
      if (code === 'auth/unauthorized-domain') {
        setCloudSyncStatus('error');
        msg = `Domínio «${host}» ainda não autorizado no Firebase Authentication. Adicione este domínio em Firebase Console → Authentication → Settings → Authorized domains.`;
      } else if (code === 'auth/popup-blocked') {
        setCloudSyncStatus('error');
        msg =
          'A janela de início de sessão foi bloqueada pelo navegador. Permita popups para este site e tente novamente.';
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setCloudSyncStatus('local');
        msg = 'Início de sessão cancelado.';
      } else if (code === 'auth/network-request-failed') {
        setCloudSyncStatus('error');
        msg = 'Sem ligação à internet para iniciar sessão com Google.';
      } else {
        setCloudSyncStatus('error');
      }
      setCloudSyncMessage(msg);
      return { user: null, errorMessage: msg };
    }
  };

  const handleSignOutCloud = async () => {
    await signOutFromFirebase();
    setCloudSyncStatus('local');
    setCloudSyncMessage('Sessão terminada. Os seus dados continuam guardados neste dispositivo.');
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (cloudUser) {
      void syncWorkspacePreferencesToCloud(
        cloudUser.uid,
        cloudUser.displayName || cloudUser.email || 'Membro IEB Horta',
        {
          theme: nextTheme,
          bibleVersion,
          secondaryVersion,
          activePlanId,
          streak,
          lastReadDate,
        }
      );
    }
  };

  const handleOpenBibleChapter = (bookId: string, chapter: number, verse?: number) => {
    setBibleBookId(bookId);
    setBibleChapter(chapter);
    setHighlightedVerse(verse);
    setActiveTab('biblia');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangePrimaryVersion = (ver: BibleVersionId) => {
    setBibleVersion(ver);
    savePersistedKey('bibleVersion', ver);
    if (cloudUser) {
      void syncWorkspacePreferencesToCloud(
        cloudUser.uid,
        cloudUser.displayName || cloudUser.email || 'Membro IEB Horta',
        {
          theme,
          bibleVersion: ver,
          secondaryVersion,
          activePlanId,
          streak,
          lastReadDate,
        }
      );
    }
  };

  const handleChangeSecondaryVersion = (ver: BibleVersionId) => {
    setSecondaryVersion(ver);
    savePersistedKey('secondaryVersion', ver);
    if (cloudUser) {
      void syncWorkspacePreferencesToCloud(
        cloudUser.uid,
        cloudUser.displayName || cloudUser.email || 'Membro IEB Horta',
        {
          theme,
          bibleVersion,
          secondaryVersion: ver,
          activePlanId,
          streak,
          lastReadDate,
        }
      );
    }
  };

  const handleUpdateReaderSettings = (next: ReaderSettings) => {
    setReaderSettings(next);
    savePersistedKey('readerSettings', next);
  };

  const handleSetHighlight = (key: string, color: HighlightColor | null) => {
    const updatedDate = new Date().toISOString().slice(0, 10);
    setHighlights((prev) => {
      const next = { ...prev };
      if (color === null) {
        delete next[key];
      } else {
        next[key] = {
          key,
          color,
          updatedAt: updatedDate,
        };
      }
      savePersistedKey('highlights', next);
      return next;
    });
    if (cloudUser) {
      void syncHighlightToCloud(cloudUser.uid, key, color, updatedDate);
    }
  };

  const handleSaveVerseNote = (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    text: string
  ) => {
    const key = makeVerseKey(bookId, chapter, verse);
    const updatedAt = new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    const entry: VerseNote | null = text.trim()
      ? {
          key,
          bookId,
          bookName,
          chapter,
          verse,
          text: text.trim(),
          updatedAt,
        }
      : null;

    setVerseNotes((prev) => {
      const next = { ...prev };
      if (!entry) {
        delete next[key];
      } else {
        next[key] = entry;
      }
      savePersistedKey('verseNotes', next);
      return next;
    });

    if (cloudUser) {
      void saveVerseNoteToCloud(cloudUser.uid, entry, key);
    }
  };

  const handleToggleBookmark = (
    bookId: string,
    bookName: string,
    chapter: number,
    verse: number,
    themeLabel: BookmarkTheme
  ) => {
    const key = makeVerseKey(bookId, chapter, verse);
    const createdAt = new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());

    setBookmarks((prev) => {
      const existing = prev.find((b) => b.key === key);
      let next: VerseBookmark[];
      let syncedEntry: VerseBookmark | null = null;
      if (existing && existing.theme === themeLabel) {
        next = prev.filter((b) => b.key !== key);
        syncedEntry = null;
      } else {
        const filtered = prev.filter((b) => b.key !== key);
        syncedEntry = {
          key,
          bookId,
          bookName,
          chapter,
          verse,
          theme: themeLabel,
          createdAt,
        };
        next = [syncedEntry, ...filtered];
      }
      savePersistedKey('bookmarks', next);
      if (cloudUser) {
        void syncBookmarkToCloud(cloudUser.uid, syncedEntry, key);
      }
      return next;
    });
  };

  const handleSelectActivePlan = (planId: string) => {
    setActivePlanId(planId);
    savePersistedKey('activePlanId', planId);
    if (cloudUser) {
      void syncWorkspacePreferencesToCloud(
        cloudUser.uid,
        cloudUser.displayName || cloudUser.email || 'Membro IEB Horta',
        {
          theme,
          bibleVersion,
          secondaryVersion,
          activePlanId: planId,
          streak,
          lastReadDate,
        }
      );
    }
  };

  const handleToggleDayComplete = (planId: string, day: number) => {
    setPlanProgress((prev) => {
      const currentDays = prev[planId] ?? [];
      const exists = currentDays.includes(day);
      const nextDays = exists
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      const next = { ...prev, [planId]: nextDays };
      savePersistedKey('planProgress', next);

      let nextStreakVal = streak;
      let nextLastReadVal = lastReadDate;
      if (!exists) {
        const todayIso = new Date().toISOString().slice(0, 10);
        const updated = updateStreakOnRead(streak, lastReadDate, todayIso);
        nextStreakVal = updated.streak;
        nextLastReadVal = updated.lastReadDate;
        setStreak(updated.streak);
        setLastReadDate(updated.lastReadDate);
        savePersistedKey('streak', updated.streak);
        savePersistedKey('lastReadDate', updated.lastReadDate);
      }

      if (cloudUser) {
        void syncPlanProgressToCloud(cloudUser.uid, planId, nextDays);
        void syncWorkspacePreferencesToCloud(
          cloudUser.uid,
          cloudUser.displayName || cloudUser.email || 'Membro IEB Horta',
          {
            theme,
            bibleVersion,
            secondaryVersion,
            activePlanId,
            streak: nextStreakVal,
            lastReadDate: nextLastReadVal,
          }
        );
      }
      return next;
    });
  };

  const handleAddChallengeComment = async (
    author: string,
    day: number,
    text: string
  ): Promise<{ synced: boolean; errorMessage?: string }> => {
    let activeUser = cloudUser ?? auth.currentUser;
    if (!activeUser) {
      const signInRes = await handleSignInGoogle();
      activeUser = signInRes.user;
      if (!activeUser) {
        return {
          synced: false,
          errorMessage:
            signInRes.errorMessage ||
            'Inicie sessão com a sua conta Google para publicar a reflexão para toda a igreja.',
        };
      }
    }

    const newComment: CommunityChallengeComment = {
      id: `cc_${Date.now()}`,
      author,
      day,
      text,
      createdAt: 'Agora mesmo',
    };

    try {
      await ensureUserWorkspaceDoc(activeUser, {
        theme,
        bibleVersion,
        secondaryVersion,
        activePlanId,
        streak,
        lastReadDate,
      });
      await createChallengeCommentInCloud(activeUser.uid, newComment);
      setChallengeComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        const next = [newComment, ...prev];
        savePersistedKey('challengeComments', next);
        return next;
      });
      return { synced: true };
    } catch {
      return {
        synced: false,
        errorMessage:
          'Não foi possível guardar na base de dados Firebase. Verifique a sua ligação à internet e tente novamente.',
      };
    }
  };

  const handleAddPrayerRequest = async (
    author: string,
    isAnonymous: boolean,
    category: PrayerRequest['category'],
    content: string
  ): Promise<{ synced: boolean; errorMessage?: string }> => {
    let activeUser = cloudUser ?? auth.currentUser;
    if (!activeUser) {
      const signInRes = await handleSignInGoogle();
      activeUser = signInRes.user;
      if (!activeUser) {
        return {
          synced: false,
          errorMessage:
            signInRes.errorMessage ||
            'Inicie sessão com a sua conta Google para que o pedido apareça no site e nos telemóveis de toda a igreja.',
        };
      }
    }

    const item: PrayerRequest = {
      id: `pr_${Date.now()}`,
      author,
      isAnonymous,
      category,
      content,
      createdAt: 'Agora mesmo',
      prayingCount: 1,
    };

    try {
      await ensureUserWorkspaceDoc(activeUser, {
        theme,
        bibleVersion,
        secondaryVersion,
        activePlanId,
        streak,
        lastReadDate,
      });
      await createPrayerRequestInCloud(activeUser.uid, item);

      setPrayerRequests((prev) => {
        if (prev.some((r) => r.id === item.id)) return prev;
        const next = [item, ...prev];
        savePersistedKey('prayerRequests', next);
        return next;
      });
      setPrayedIds((prev) => {
        const next = prev.includes(item.id) ? prev : [...prev, item.id];
        savePersistedKey('prayedIds', next);
        return next;
      });
      return { synced: true };
    } catch {
      return {
        synced: false,
        errorMessage:
          'Não foi possível gravar o pedido na base de dados Firebase. Verifique a ligação à internet e tente novamente.',
      };
    }
  };

  const handleTogglePraying = (id: string) => {
    const alreadyPrayed = prayedIds.includes(id);
    const delta: 1 | -1 = alreadyPrayed ? -1 : 1;
    const nextPrayedIds = alreadyPrayed
      ? prayedIds.filter((pid) => pid !== id)
      : [...prayedIds, id];
    setPrayedIds(nextPrayedIds);
    savePersistedKey('prayedIds', nextPrayedIds);

    setPrayerRequests((prev) => {
      const next = prev.map((req) =>
        req.id === id
          ? {
              ...req,
              prayingCount: Math.max(0, req.prayingCount + delta),
            }
          : req
      );
      savePersistedKey('prayerRequests', next);
      return next;
    });
    if (cloudUser) {
      void togglePrayerCountInCloud(id, delta).catch(() => {
        // Keep local toggle gracefully if offline
      });
    }
  };

  const handleSaveSermonNote = (note: SermonNote) => {
    setSermonNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      const next = exists
        ? prev.map((n) => (n.id === note.id ? note : n))
        : [note, ...prev];
      savePersistedKey('sermonNotes', next);
      return next;
    });
    if (cloudUser) {
      void saveSermonNoteToCloud(cloudUser.uid, note);
    }
  };

  const handleDeleteSermonNote = (id: string) => {
    setSermonNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      savePersistedKey('sermonNotes', next);
      return next;
    });
    if (cloudUser) {
      void deleteSermonNoteFromCloud(cloudUser.uid, id);
    }
  };

  const handleSaveQuickHomeNote = (title: string, content: string): SermonNote => {
    const todayStr = new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
    const created: SermonNote = {
      id: `sn_${Date.now()}`,
      title: title.trim() || `Apontamento de ${todayStr}`,
      preacher: 'Apontamento da Mensagem',
      date: todayStr,
      content: content.trim(),
      updatedAt: todayStr,
    };
    handleSaveSermonNote(created);
    return created;
  };

  const handleOpenNotesTab = (noteId?: string) => {
    setSelectedNoteIdForTab(noteId ?? null);
    setActiveTab('notas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateNotifications = (next: NotificationSettings) => {
    setNotifications(next);
    savePersistedKey('notifications', next);
  };

  const handleSubmitVisitorCard = (
    submission: Omit<VisitorSubmission, 'id' | 'submittedAt'>
  ) => {
    const newEntry: VisitorSubmission = {
      ...submission,
      id: `vs_${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    setVisitorSubmissions((prev) => {
      const next = [newEntry, ...prev];
      savePersistedKey('visitorSubmissions', next);
      return next;
    });
    if (cloudUser) {
      void saveVisitorCardToCloud(cloudUser.uid, newEntry);
    }
  };

  const handleOpenShareVerse = (referenceLabel: string, verseText: string) => {
    setShareModalData({
      open: true,
      referenceLabel,
      verseText,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#141E2E] dark:bg-[#0C1320] dark:text-[#F2EFE9] transition-colors">
      <OfflineIndicator />

      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        streak={streak}
        bibleVersion={bibleVersion}
        onOpenSocialQR={() => setIsSocialQROpen(true)}
      />

      <main className="lg:pl-64 pb-24 lg:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {activeTab === 'inicio' && (
            <HomeView
              bibleVersion={bibleVersion}
              primaryCorpus={primaryCorpus}
              streak={streak}
              activePlanId={activePlanId}
              planProgress={planProgress}
              onToggleDayComplete={handleToggleDayComplete}
              onOpenBibleChapter={handleOpenBibleChapter}
              onOpenShareVerse={handleOpenShareVerse}
              onOpenPlansTab={() => {
                setActiveTab('planos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenNotesTab={handleOpenNotesTab}
              onOpenCommunityTab={() => {
                setActiveTab('comunidade');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSocialQR={() => setIsSocialQROpen(true)}
              savedNotes={sermonNotes}
              onSaveQuickNote={handleSaveQuickHomeNote}
              latestPrayerRequest={prayerRequests[0]}
              prayedIds={prayedIds}
              onTogglePraying={handleTogglePraying}
            />
          )}

          {activeTab === 'biblia' && (
            <BibleView
              bookId={bibleBookId}
              chapter={bibleChapter}
              highlightedVerse={highlightedVerse}
              onNavigatePassage={(bId, ch, v) => {
                setBibleBookId(bId);
                setBibleChapter(ch);
                setHighlightedVerse(v);
              }}
              primaryVersion={bibleVersion}
              primaryCorpus={primaryCorpus}
              isLoadingPrimary={isLoadingPrimary}
              onChangePrimaryVersion={handleChangePrimaryVersion}
              secondaryVersion={secondaryVersion}
              onChangeSecondaryVersion={handleChangeSecondaryVersion}
              readerSettings={readerSettings}
              onUpdateReaderSettings={handleUpdateReaderSettings}
              highlights={highlights}
              onSetHighlight={handleSetHighlight}
              verseNotes={verseNotes}
              onSaveVerseNote={handleSaveVerseNote}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              onOpenShareVerse={handleOpenShareVerse}
            />
          )}

          {activeTab === 'planos' && (
            <PlansView
              activePlanId={activePlanId}
              onSelectActivePlan={handleSelectActivePlan}
              planProgress={planProgress}
              onToggleDayComplete={handleToggleDayComplete}
              streak={streak}
              challengeComments={challengeComments}
              onAddChallengeComment={handleAddChallengeComment}
              onOpenBibleChapter={(bId, ch) => handleOpenBibleChapter(bId, ch)}
              isCloudSignedIn={Boolean(cloudUser)}
              cloudUserName={cloudUser?.displayName ?? null}
              onSignInGoogle={async () => Boolean((await handleSignInGoogle()).user)}
            />
          )}

          {activeTab === 'notas' && (
            <NotesView
              initialSelectedNoteId={selectedNoteIdForTab}
              bibleVersion={bibleVersion}
              primaryCorpus={primaryCorpus}
              notes={sermonNotes}
              onSaveNote={handleSaveSermonNote}
              onDeleteNote={handleDeleteSermonNote}
              verseNotes={verseNotes}
              onSaveVerseNote={handleSaveVerseNote}
              bookmarks={bookmarks}
              highlights={highlights}
              onOpenBibleChapter={handleOpenBibleChapter}
            />
          )}

          {activeTab === 'comunidade' && (
            <CommunityView
              prayerRequests={prayerRequests}
              prayedIds={prayedIds}
              onAddPrayerRequest={handleAddPrayerRequest}
              onTogglePraying={handleTogglePraying}
              onOpenNotesTab={() => handleOpenNotesTab()}
              isCloudSignedIn={Boolean(cloudUser)}
              cloudUserName={cloudUser?.displayName ?? null}
              onSignInGoogle={async () => Boolean((await handleSignInGoogle()).user)}
              cloudSyncMessage={cloudSyncMessage}
            />
          )}

          {activeTab === 'mais' && (
            <MoreView
              theme={theme}
              onToggleTheme={handleToggleTheme}
              bibleVersion={bibleVersion}
              primaryCorpus={primaryCorpus}
              highlights={highlights}
              verseNotes={verseNotes}
              bookmarks={bookmarks}
              onOpenBibleChapter={handleOpenBibleChapter}
              notifications={notifications}
              onUpdateNotifications={handleUpdateNotifications}
              notificationPermission={notificationPermission}
              onRequestNotificationPermission={requestNotificationPermission}
              onTestReminder={triggerTestReminder}
              reminderFeedback={reminderFeedback}
              activePlan={activePlanObj}
              nextPlanDay={nextPlanDayObj}
              visitorSubmissions={visitorSubmissions}
              onSubmitVisitorCard={handleSubmitVisitorCard}
              onOpenNotesTab={() => handleOpenNotesTab()}
              cloudUserEmail={cloudUser?.email ?? null}
              cloudUserName={cloudUser?.displayName ?? null}
              cloudSyncStatus={cloudSyncStatus}
              cloudSyncMessage={cloudSyncMessage}
              onSignInGoogle={async () => {
                await handleSignInGoogle();
              }}
              onSignOutCloud={handleSignOutCloud}
              onForceCloudSync={() => handleForceCloudSync(cloudUser)}
              onOpenSocialQR={() => setIsSocialQROpen(true)}
            />
          )}
        </div>
      </main>

      <SmartReminderBanner
        reminder={activeReminder}
        onDismiss={dismissReminder}
        onAction={(rem) => {
          dismissReminder();
          if (rem.actionTab === 'biblia' && rem.bookId && rem.chapter) {
            handleOpenBibleChapter(rem.bookId, rem.chapter, rem.verse);
          } else {
            setActiveTab(rem.actionTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <VerseShareModal
        isOpen={shareModalData.open}
        onClose={() => setShareModalData((prev) => ({ ...prev, open: false }))}
        referenceLabel={shareModalData.referenceLabel}
        verseText={shareModalData.verseText}
        versionLabel={bibleVersion}
      />

      <SocialQRModal
        isOpen={isSocialQROpen}
        onClose={() => setIsSocialQROpen(false)}
      />
    </div>
  );
}
