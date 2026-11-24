import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  OperationType,
  auth,
  clampString,
  db,
  handleFirestoreError,
  sanitizeFirestoreId,
} from '../firebase';
import type {
  BibleVersionId,
  BookmarkTheme,
  CommunityChallengeComment,
  HighlightColor,
  PrayerRequest,
  SermonNote,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
  VisitorSubmission,
} from '../types';

export interface CloudWorkspaceSeed {
  theme: 'light' | 'dark';
  bibleVersion: BibleVersionId;
  secondaryVersion: BibleVersionId;
  activePlanId: string;
  streak: number;
  lastReadDate: string | null;
}

const pendingWorkspaceEnsures = new Map<string, Promise<{ created: boolean }>>();
const confirmedWorkspaceUids = new Set<string>();

const VALID_BIBLE_VERSIONS = new Set<BibleVersionId>([
  'ARC',
  'ARA',
  'NVI',
  'OL',
  'A21',
  'NAA',
  'NTLH',
]);
const VALID_BOOKMARK_THEMES = new Set<BookmarkTheme>([
  'Fé',
  'Ansiedade',
  'Família',
  'Gratidão',
  'Esperança',
]);
const VALID_HIGHLIGHT_COLORS = new Set<HighlightColor>([
  'amber',
  'navy',
  'olive',
  'terracotta',
]);
const VALID_PRAYER_CATEGORIES = new Set<PrayerRequest['category']>([
  'Família',
  'Saúde',
  'Gratidão',
  'Orientação',
  'Igreja',
]);
const VALID_VISITOR_CHANNELS = new Set<VisitorSubmission['preferredChannel']>([
  'WhatsApp / Telemóvel',
  'Email',
  'Pessoalmente no domingo',
]);

function safeTheme(value: unknown): 'light' | 'dark' {
  return value === 'dark' ? 'dark' : 'light';
}

function safeBibleVersion(value: unknown, fallback: BibleVersionId): BibleVersionId {
  return typeof value === 'string' && VALID_BIBLE_VERSIONS.has(value as BibleVersionId)
    ? (value as BibleVersionId)
    : fallback;
}

function safeActivePlanId(value: unknown): string {
  const raw = typeof value === 'string' && value.trim() ? value : 'vencer-medo-7';
  return sanitizeFirestoreId(raw).slice(0, 80);
}

function safeStreak(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(10000, Math.floor(num)));
}

function safeBookmarkTheme(value: unknown): BookmarkTheme {
  return typeof value === 'string' && VALID_BOOKMARK_THEMES.has(value as BookmarkTheme)
    ? (value as BookmarkTheme)
    : 'Fé';
}

function safeHighlightColor(value: unknown): HighlightColor {
  return typeof value === 'string' && VALID_HIGHLIGHT_COLORS.has(value as HighlightColor)
    ? (value as HighlightColor)
    : 'amber';
}

function safePrayerCategory(value: unknown): PrayerRequest['category'] {
  return typeof value === 'string' && VALID_PRAYER_CATEGORIES.has(value as PrayerRequest['category'])
    ? (value as PrayerRequest['category'])
    : 'Igreja';
}

function safeVisitorChannel(value: unknown): VisitorSubmission['preferredChannel'] {
  return typeof value === 'string' &&
    VALID_VISITOR_CHANNELS.has(value as VisitorSubmission['preferredChannel'])
    ? (value as VisitorSubmission['preferredChannel'])
    : 'WhatsApp / Telemóvel';
}

const DEFAULT_WORKSPACE_SEED: CloudWorkspaceSeed = {
  theme: 'light',
  bibleVersion: 'NVI',
  secondaryVersion: 'ARC',
  activePlanId: 'vencer-medo-7',
  streak: 1,
  lastReadDate: null,
};

export async function ensureUserWorkspaceDoc(
  user: User,
  seed: CloudWorkspaceSeed = DEFAULT_WORKSPACE_SEED
): Promise<{ created: boolean }> {
  const uid = sanitizeFirestoreId(user.uid);
  const existingPromise = pendingWorkspaceEnsures.get(uid);
  if (existingPromise) {
    return existingPromise;
  }

  const run = (async (): Promise<{ created: boolean }> => {
    const path = `users/${uid}`;
    const ref = doc(db, 'users', uid);

    try {
      const snap = await getDoc(ref);
      const displayName = clampString(
        user.displayName || user.email?.split('@')[0] || 'Membro IEB Horta',
        1,
        100,
        'Membro IEB Horta'
      );

      if (!snap.exists()) {
        await setDoc(ref, {
          ownerId: uid,
          displayName,
          theme: safeTheme(seed.theme),
          bibleVersion: safeBibleVersion(seed.bibleVersion, 'NVI'),
          secondaryVersion: safeBibleVersion(seed.secondaryVersion, 'ARC'),
          activePlanId: safeActivePlanId(seed.activePlanId),
          streak: safeStreak(seed.streak),
          lastReadDate: (seed.lastReadDate ?? '').slice(0, 20),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        confirmedWorkspaceUids.add(uid);
        return { created: true };
      }
      confirmedWorkspaceUids.add(uid);
      return { created: false };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  })().finally(() => {
    pendingWorkspaceEnsures.delete(uid);
  });

  pendingWorkspaceEnsures.set(uid, run);
  return run;
}

/**
 * Guarantees the parent `/users/{uid}` Master Gate document exists before
 * any subcollection or community write executes.
 */
async function ensureWorkspaceReadyForUid(uid: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const pending = pendingWorkspaceEnsures.get(safeUid);
  if (pending) {
    await pending;
    return;
  }
  if (confirmedWorkspaceUids.has(safeUid)) {
    return;
  }
  const current = auth.currentUser;
  if (current && sanitizeFirestoreId(current.uid) === safeUid) {
    await ensureUserWorkspaceDoc(current, DEFAULT_WORKSPACE_SEED);
  }
}

export async function syncWorkspacePreferencesToCloud(
  uid: string,
  userDisplayName: string,
  patch: CloudWorkspaceSeed
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const pending = pendingWorkspaceEnsures.get(safeUid);
  if (pending) {
    await pending;
  }
  const path = `users/${safeUid}`;
  const ref = doc(db, 'users', safeUid);
  try {
    const snap = await getDoc(ref);
    const displayName = clampString(
      userDisplayName || 'Membro IEB Horta',
      1,
      100,
      'Membro IEB Horta'
    );
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: safeUid,
        displayName,
        theme: safeTheme(patch.theme),
        bibleVersion: safeBibleVersion(patch.bibleVersion, 'NVI'),
        secondaryVersion: safeBibleVersion(patch.secondaryVersion, 'ARC'),
        activePlanId: safeActivePlanId(patch.activePlanId),
        streak: safeStreak(patch.streak),
        lastReadDate: (patch.lastReadDate ?? '').slice(0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      confirmedWorkspaceUids.add(safeUid);
      return;
    }

    await updateDoc(ref, {
      displayName,
      theme: safeTheme(patch.theme),
      bibleVersion: safeBibleVersion(patch.bibleVersion, 'NVI'),
      secondaryVersion: safeBibleVersion(patch.secondaryVersion, 'ARC'),
      activePlanId: safeActivePlanId(patch.activePlanId),
      streak: safeStreak(patch.streak),
      lastReadDate: (patch.lastReadDate ?? '').slice(0, 20),
      updatedAt: serverTimestamp(),
    });
    confirmedWorkspaceUids.add(safeUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSermonNoteToCloud(uid: string, note: SermonNote): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const noteId = sanitizeFirestoreId(note.id);
  const path = `users/${safeUid}/sermonNotes/${noteId}`;
  const ref = doc(db, 'users', safeUid, 'sermonNotes', noteId);

  try {
    const existingSnap = await getDoc(ref);
    const payloadBase = {
      title: clampString(note.title, 1, 160, 'Apontamento'),
      preacher: clampString(note.preacher, 1, 120, 'Estudo Pessoal'),
      date: clampString(note.date, 1, 40, 'Hoje'),
      content: clampString(note.content, 1, 8000, '.'),
      updatedAtLabel: clampString(note.updatedAt, 1, 40, 'Hoje'),
      updatedAt: serverTimestamp(),
    };

    if (existingSnap.exists()) {
      await updateDoc(ref, payloadBase);
    } else {
      await setDoc(ref, {
        id: noteId,
        ownerId: safeUid,
        ...payloadBase,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSermonNoteFromCloud(uid: string, noteIdRaw: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const noteId = sanitizeFirestoreId(noteIdRaw);
  const path = `users/${safeUid}/sermonNotes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'sermonNotes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveVerseNoteToCloud(
  uid: string,
  verseNote: VerseNote | null,
  verseKey: string
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const docId = sanitizeFirestoreId(verseKey);
  const path = `users/${safeUid}/verseNotes/${docId}`;
  const ref = doc(db, 'users', safeUid, 'verseNotes', docId);

  try {
    if (!verseNote || !verseNote.text.trim()) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
      }
      return;
    }

    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        text: clampString(verseNote.text, 1, 2000, '.'),
        updatedAtLabel: clampString(verseNote.updatedAt, 1, 40, 'Hoje'),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: docId,
        ownerId: safeUid,
        key: clampString(verseNote.key, 3, 80, 'salmos:121:1'),
        bookId: clampString(verseNote.bookId, 1, 50, 'salmos'),
        bookName: clampString(verseNote.bookName, 1, 60, 'Salmos'),
        chapter: Math.max(1, Math.min(150, Math.floor(verseNote.chapter))),
        verse: Math.max(1, Math.min(176, Math.floor(verseNote.verse))),
        text: clampString(verseNote.text, 1, 2000, '.'),
        updatedAtLabel: clampString(verseNote.updatedAt, 1, 40, 'Hoje'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncBookmarkToCloud(
  uid: string,
  bookmark: VerseBookmark | null,
  verseKey: string
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const docId = sanitizeFirestoreId(verseKey);
  const path = `users/${safeUid}/bookmarks/${docId}`;
  const ref = doc(db, 'users', safeUid, 'bookmarks', docId);

  try {
    if (!bookmark) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
      }
      return;
    }

    const snap = await getDoc(ref);
    const normalizedTheme = safeBookmarkTheme(bookmark.theme);
    if (snap.exists()) {
      await updateDoc(ref, {
        theme: normalizedTheme,
        createdAtLabel: clampString(bookmark.createdAt, 1, 40, 'Hoje'),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: docId,
        ownerId: safeUid,
        key: clampString(bookmark.key, 3, 80, 'salmos:23:1'),
        bookId: clampString(bookmark.bookId, 1, 50, 'salmos'),
        bookName: clampString(bookmark.bookName, 1, 60, 'Salmos'),
        chapter: Math.max(1, Math.min(150, Math.floor(bookmark.chapter))),
        verse: Math.max(1, Math.min(176, Math.floor(bookmark.verse))),
        theme: normalizedTheme,
        createdAtLabel: clampString(bookmark.createdAt, 1, 40, 'Hoje'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncHighlightToCloud(
  uid: string,
  verseKey: string,
  color: HighlightColor | null,
  updatedAtLabel: string
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const docId = sanitizeFirestoreId(verseKey);
  const path = `users/${safeUid}/highlights/${docId}`;
  const ref = doc(db, 'users', safeUid, 'highlights', docId);

  try {
    if (!color) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
      }
      return;
    }

    const snap = await getDoc(ref);
    const normalizedColor = safeHighlightColor(color);
    if (snap.exists()) {
      await updateDoc(ref, {
        color: normalizedColor,
        updatedAtLabel: clampString(updatedAtLabel, 1, 40, 'Hoje'),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: docId,
        ownerId: safeUid,
        key: clampString(verseKey, 3, 80, 'salmos:121:1'),
        color: normalizedColor,
        updatedAtLabel: clampString(updatedAtLabel, 1, 40, 'Hoje'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPlanProgressToCloud(
  uid: string,
  planIdRaw: string,
  completedDays: number[]
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const planId = sanitizeFirestoreId(planIdRaw);
  const path = `users/${safeUid}/planProgress/${planId}`;
  const ref = doc(db, 'users', safeUid, 'planProgress', planId);
  const boundedDays = completedDays
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 366)
    .slice(0, 366);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        completedDays: boundedDays,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        planId,
        ownerId: safeUid,
        completedDays: boundedDays,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveVisitorCardToCloud(
  uid: string,
  card: VisitorSubmission
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const cardId = sanitizeFirestoreId(card.id);
  const path = `users/${safeUid}/visitorCards/${cardId}`;
  const ref = doc(db, 'users', safeUid, 'visitorCards', cardId);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      id: cardId,
      ownerId: safeUid,
      name: clampString(card.name, 1, 120, 'Visitante'),
      contact: clampString(card.contact, 3, 160, '---'),
      preferredChannel: safeVisitorChannel(card.preferredChannel),
      message: card.message.trim().slice(0, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createPrayerRequestInCloud(
  uid: string,
  req: PrayerRequest
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const reqId = sanitizeFirestoreId(req.id);
  const path = `prayerRequests/${reqId}`;
  const ref = doc(db, 'prayerRequests', reqId);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) return;

    await setDoc(ref, {
      id: reqId,
      churchId: 'iebhorta',
      authorId: safeUid,
      author: clampString(req.isAnonymous ? 'Pedido Anónimo' : req.author, 1, 80, 'Pedido Anónimo'),
      isAnonymous: Boolean(req.isAnonymous),
      category: safePrayerCategory(req.category),
      content: clampString(req.content, 3, 1200, 'Oração'),
      createdAtLabel: clampString(req.createdAt, 1, 40, 'Agora mesmo'),
      prayingCount: 1,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function togglePrayerCountInCloud(
  requestIdRaw: string,
  delta: 1 | -1
): Promise<boolean> {
  // Initial sample prayer items (pr-1..pr-4) exist only locally unless published in Firestore
  if (/^pr-\d+$/.test(requestIdRaw)) {
    return false;
  }

  const reqId = sanitizeFirestoreId(requestIdRaw);
  const path = `prayerRequests/${reqId}`;
  const ref = doc(db, 'prayerRequests', reqId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const current = Number(snap.data().prayingCount ?? 0);
    const nextCount = Math.max(0, current + delta);
    if (nextCount === current) return false;
    await updateDoc(ref, {
      prayingCount: nextCount,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createChallengeCommentInCloud(
  uid: string,
  comment: CommunityChallengeComment
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  await ensureWorkspaceReadyForUid(safeUid);
  const commentId = sanitizeFirestoreId(comment.id);
  const path = `challengeComments/${commentId}`;
  const ref = doc(db, 'challengeComments', commentId);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) return;

    await setDoc(ref, {
      id: commentId,
      churchId: 'iebhorta',
      authorId: safeUid,
      author: clampString(comment.author, 1, 80, 'Membro IEB Horta'),
      day: Math.max(1, Math.min(366, Math.floor(comment.day))),
      text: clampString(comment.text, 2, 1000, '..'),
      createdAtLabel: clampString(comment.createdAt, 1, 40, 'Agora mesmo'),
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

const extractTimestampMs = (d: Record<string, unknown>, id: string): number => {
  const ts = d.createdAt as { toMillis?: () => number } | undefined;
  if (ts && typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  const match = /(\d{10,})$/.exec(id);
  return match ? Number(match[1]) : 0;
};

export interface PublicChurchSubscriptionsCallbacks {
  onPrayerRequests: (requests: PrayerRequest[]) => void;
  onChallengeComments: (comments: CommunityChallengeComment[]) => void;
  onError?: (path: string, error: unknown) => void;
}

/**
 * Always-on real-time listener for shared public congregation collections
 * (Mural de Oração & Reflexões do Desafio — zero PII).
 * Runs across website and mobile PWA even before the user signs in.
 */
export function subscribePublicChurchData(
  callbacks: PublicChurchSubscriptionsCallbacks
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  // 1. Community Prayer Requests
  const prayerPath = 'prayerRequests';
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'prayerRequests'),
        where('churchId', '==', 'iebhorta'),
        where('isPublic', '==', true)
      ),
      (snap) => {
        if (snap.empty) return;
        const list: PrayerRequest[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            const id = String(d.id ?? docSnap.id);
            return {
              sortMs: extractTimestampMs(d, id),
              item: {
                id,
                author: String(d.author ?? 'Pedido Anónimo'),
                isAnonymous: Boolean(d.isAnonymous),
                category: (d.category as PrayerRequest['category']) ?? 'Igreja',
                content: String(d.content ?? ''),
                createdAt: String(d.createdAtLabel ?? 'Recente'),
                prayingCount: Number(d.prayingCount ?? 1),
              } satisfies PrayerRequest,
            };
          })
          .sort((a, b) => b.sortMs - a.sortMs)
          .map((entry) => entry.item);
        callbacks.onPrayerRequests(list);
      },
      (err) => {
        if (callbacks.onError) {
          callbacks.onError(prayerPath, err);
        }
        const code = (err as { code?: string })?.code;
        if (!callbacks.onError || code === 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, prayerPath);
        }
      }
    )
  );

  // 2. Community Challenge Comments
  const commentsPath = 'challengeComments';
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'challengeComments'),
        where('churchId', '==', 'iebhorta'),
        where('isPublic', '==', true)
      ),
      (snap) => {
        if (snap.empty) return;
        const list: CommunityChallengeComment[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            const id = String(d.id ?? docSnap.id);
            return {
              sortMs: extractTimestampMs(d, id),
              item: {
                id,
                author: String(d.author ?? 'Membro IEB Horta'),
                day: Number(d.day ?? 1),
                text: String(d.text ?? ''),
                createdAt: String(d.createdAtLabel ?? 'Recente'),
              } satisfies CommunityChallengeComment,
            };
          })
          .sort((a, b) => b.sortMs - a.sortMs)
          .map((entry) => entry.item);
        callbacks.onChallengeComments(list);
      },
      (err) => {
        if (callbacks.onError) {
          callbacks.onError(commentsPath, err);
        }
        const code = (err as { code?: string })?.code;
        if (!callbacks.onError || code === 'permission-denied') {
          handleFirestoreError(err, OperationType.LIST, commentsPath);
        }
      }
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export interface UserWorkspaceSubscriptionsCallbacks {
  onWorkspace: (data: Partial<CloudWorkspaceSeed>) => void;
  onSermonNotes: (notes: SermonNote[]) => void;
  onVerseNotes: (notes: Record<string, VerseNote>) => void;
  onBookmarks: (bookmarks: VerseBookmark[]) => void;
  onHighlights: (highlights: Record<string, VerseHighlight>) => void;
  onPlanProgress: (progress: Record<string, number[]>) => void;
  onVisitorCards: (cards: VisitorSubmission[]) => void;
}

/**
 * Authenticated real-time listeners for personal member workspace documents
 * (preferences, sermon notes, verse notes, bookmarks, highlights, reading plans, visitor cards).
 */
export function subscribeUserWorkspaceData(
  user: User,
  callbacks: UserWorkspaceSubscriptionsCallbacks
): Unsubscribe {
  const uid = sanitizeFirestoreId(user.uid);
  const unsubs: Unsubscribe[] = [];

  // 1. User Workspace Document
  const workspacePath = `users/${uid}`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        callbacks.onWorkspace({
          theme: d.theme === 'dark' ? 'dark' : 'light',
          bibleVersion: d.bibleVersion as BibleVersionId,
          secondaryVersion: d.secondaryVersion as BibleVersionId,
          activePlanId: typeof d.activePlanId === 'string' ? d.activePlanId : undefined,
          streak: typeof d.streak === 'number' ? d.streak : undefined,
          lastReadDate: typeof d.lastReadDate === 'string' ? d.lastReadDate || null : null,
        });
      },
      (err) => handleFirestoreError(err, OperationType.GET, workspacePath)
    )
  );

  // 2. Sermon Notes Subcollection
  const sermonNotesPath = `users/${uid}/sermonNotes`;
  let hadSermonNotes = false;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'sermonNotes'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty && !hadSermonNotes) return;
        hadSermonNotes = !snap.empty;
        const list: SermonNote[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id ?? docSnap.id),
            title: String(d.title ?? ''),
            preacher: String(d.preacher ?? ''),
            date: String(d.date ?? ''),
            content: String(d.content ?? ''),
            updatedAt: String(d.updatedAtLabel ?? d.date ?? ''),
          };
        });
        callbacks.onSermonNotes(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, sermonNotesPath)
    )
  );

  // 3. Verse Notes Subcollection
  const verseNotesPath = `users/${uid}/verseNotes`;
  let hadVerseNotes = false;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'verseNotes'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty && !hadVerseNotes) return;
        hadVerseNotes = !snap.empty;
        const map: Record<string, VerseNote> = {};
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const key = String(d.key ?? '');
          if (key) {
            map[key] = {
              key,
              bookId: String(d.bookId ?? ''),
              bookName: String(d.bookName ?? ''),
              chapter: Number(d.chapter ?? 1),
              verse: Number(d.verse ?? 1),
              text: String(d.text ?? ''),
              updatedAt: String(d.updatedAtLabel ?? ''),
            };
          }
        });
        callbacks.onVerseNotes(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, verseNotesPath)
    )
  );

  // 4. Bookmarks Subcollection
  const bookmarksPath = `users/${uid}/bookmarks`;
  let hadBookmarks = false;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'bookmarks'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty && !hadBookmarks) return;
        hadBookmarks = !snap.empty;
        const list: VerseBookmark[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            key: String(d.key ?? ''),
            bookId: String(d.bookId ?? ''),
            bookName: String(d.bookName ?? ''),
            chapter: Number(d.chapter ?? 1),
            verse: Number(d.verse ?? 1),
            theme: (d.theme as BookmarkTheme) ?? 'Fé',
            createdAt: String(d.createdAtLabel ?? ''),
          };
        });
        callbacks.onBookmarks(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, bookmarksPath)
    )
  );

  // 5. Highlights Subcollection
  const highlightsPath = `users/${uid}/highlights`;
  let hadHighlights = false;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'highlights'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty && !hadHighlights) return;
        hadHighlights = !snap.empty;
        const map: Record<string, VerseHighlight> = {};
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const key = String(d.key ?? '');
          if (key) {
            map[key] = {
              key,
              color: (d.color as HighlightColor) ?? 'amber',
              updatedAt: String(d.updatedAtLabel ?? ''),
            };
          }
        });
        callbacks.onHighlights(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, highlightsPath)
    )
  );

  // 6. Plan Progress Subcollection
  const planProgressPath = `users/${uid}/planProgress`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'planProgress'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty) return;
        const map: Record<string, number[]> = {};
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const pId = String(d.planId ?? docSnap.id);
          if (Array.isArray(d.completedDays)) {
            map[pId] = d.completedDays.map(Number);
          }
        });
        callbacks.onPlanProgress(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, planProgressPath)
    )
  );

  // 7. Visitor Cards Subcollection (PII-isolated)
  const visitorCardsPath = `users/${uid}/visitorCards`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'visitorCards'), where('ownerId', '==', uid)),
      (snap) => {
        if (snap.empty) return;
        const list: VisitorSubmission[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id ?? docSnap.id),
            name: String(d.name ?? ''),
            contact: String(d.contact ?? ''),
            preferredChannel:
              (d.preferredChannel as VisitorSubmission['preferredChannel']) ??
              'WhatsApp / Telemóvel',
            message: String(d.message ?? ''),
            submittedAt: new Date().toISOString(),
          };
        });
        callbacks.onVisitorCards(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, visitorCardsPath)
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}
