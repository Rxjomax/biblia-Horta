import type {
  BibleVersionId,
  CommunityChallengeComment,
  NotificationSettings,
  PrayerRequest,
  ReaderSettings,
  SermonNote,
  VerseBookmark,
  VerseHighlight,
  VerseNote,
  VisitorSubmission,
} from '../types';
import {
  INITIAL_CHALLENGE_COMMENTS,
  INITIAL_PRAYER_REQUESTS,
  INITIAL_SERMON_NOTES,
} from '../data/churchData';

const PREFIX = 'iebhorta_v1_';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export interface PersistedAppState {
  theme: 'light' | 'dark';
  bibleVersion: BibleVersionId;
  secondaryVersion: BibleVersionId;
  readerSettings: ReaderSettings;
  highlights: Record<string, VerseHighlight>;
  verseNotes: Record<string, VerseNote>;
  bookmarks: VerseBookmark[];
  planProgress: Record<string, number[]>;
  activePlanId: string;
  streak: number;
  lastReadDate: string | null;
  challengeComments: CommunityChallengeComment[];
  prayerRequests: PrayerRequest[];
  prayedIds: string[];
  sermonNotes: SermonNote[];
  notifications: NotificationSettings;
  visitorSubmissions: VisitorSubmission[];
}

const VALID_VERSIONS: BibleVersionId[] = ['ARC', 'ARA', 'NVI', 'OL', 'A21', 'NAA', 'NTLH'];

function readValidVersion(key: string, fallback: BibleVersionId): BibleVersionId {
  const val = readJson<string>(key, fallback);
  if (val === 'BPT') return 'OL';
  return VALID_VERSIONS.includes(val as BibleVersionId) ? (val as BibleVersionId) : fallback;
}

export function loadPersistedState(): PersistedAppState {
  return {
    theme: readJson<'light' | 'dark'>('theme', 'light'),
    bibleVersion: readValidVersion('bibleVersion', 'NVI'),
    secondaryVersion: readValidVersion('secondaryVersion', 'ARC'),
    readerSettings: readJson<ReaderSettings>('readerSettings', {
      fontSize: 18,
      lineHeight: 1.75,
      fontFamily: 'serif',
    }),
    highlights: readJson<Record<string, VerseHighlight>>('highlights', {
      'salmos:121:1': {
        key: 'salmos:121:1',
        color: 'amber',
        updatedAt: '2026-11-16',
      },
      'romanos:8:28': {
        key: 'romanos:8:28',
        color: 'navy',
        updatedAt: '2026-11-15',
      },
    }),
    verseNotes: readJson<Record<string, VerseNote>>('verseNotes', {
      'filipenses:4:7': {
        key: 'filipenses:4:7',
        bookId: 'filipenses',
        bookName: 'Filipenses',
        chapter: 4,
        verse: 7,
        text: 'A paz de Deus é como uma sentinela à porta dos nossos pensamentos.',
        updatedAt: '15 Nov 2026',
      },
    }),
    bookmarks: readJson<VerseBookmark[]>('bookmarks', [
      {
        key: 'salmos:23:1',
        bookId: 'salmos',
        bookName: 'Salmos',
        chapter: 23,
        verse: 1,
        theme: 'Fé',
        createdAt: '14 Nov 2026',
      },
      {
        key: 'filipenses:4:6',
        bookId: 'filipenses',
        bookName: 'Filipenses',
        chapter: 4,
        verse: 6,
        theme: 'Ansiedade',
        createdAt: '15 Nov 2026',
      },
    ]),
    planProgress: readJson<Record<string, number[]>>('planProgress', {
      'vencer-medo-7': [1, 2],
      'salmos-proverbios': [1],
    }),
    activePlanId: readJson<string>('activePlanId', 'vencer-medo-7'),
    streak: readJson<number>('streak', 5),
    lastReadDate: readJson<string | null>('lastReadDate', '2026-11-15'),
    challengeComments: readJson<CommunityChallengeComment[]>(
      'challengeComments',
      INITIAL_CHALLENGE_COMMENTS
    ),
    prayerRequests: readJson<PrayerRequest[]>('prayerRequests', INITIAL_PRAYER_REQUESTS),
    prayedIds: readJson<string[]>('prayedIds', []),
    sermonNotes: readJson<SermonNote[]>('sermonNotes', INITIAL_SERMON_NOTES),
    notifications: readJson<NotificationSettings>('notifications', {
      dailyVerseEnabled: true,
      dailyVerseTime: '08:00',
      readingPlanEnabled: true,
      readingPlanTime: '20:30',
      serviceReminderEnabled: true,
    }),
    visitorSubmissions: readJson<VisitorSubmission[]>('visitorSubmissions', []),
  };
}

export function savePersistedKey<K extends keyof PersistedAppState>(
  key: K,
  value: PersistedAppState[K]
): void {
  writeJson(key, value);
}
