export type AppTab = 'inicio' | 'biblia' | 'planos' | 'notas' | 'comunidade' | 'mais';

export type BibleVersionId = 'ARC' | 'ARA' | 'NVI' | 'OL' | 'A21' | 'NAA' | 'NTLH';

export interface BibleVersionInfo {
  id: BibleVersionId;
  name: string;
  shortName: string;
  description: string;
}

export type HighlightColor = 'amber' | 'navy' | 'olive' | 'terracotta';

export type BookmarkTheme = 'Fé' | 'Ansiedade' | 'Família' | 'Gratidão' | 'Esperança';

export interface BibleBookMeta {
  index: number; // 0..65 canonical index
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  testament: 'AT' | 'NT';
  totalChapters: number;
}

export type BibleCorpus = string[][][]; // [bookIndex][chapterIndex][verseIndex]

export interface VerseReference {
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
}

export interface VerseHighlight {
  key: string; // e.g. "joao:3:16"
  color: HighlightColor;
  updatedAt: string;
}

export interface VerseNote {
  key: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  updatedAt: string;
}

export interface VerseBookmark {
  key: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  theme: BookmarkTheme;
  createdAt: string;
}

export interface ReaderSettings {
  fontSize: number; // 16..26
  lineHeight: number; // 1.5 | 1.75 | 2.0
  fontFamily: 'serif' | 'sans';
}

export interface ReadingPlanDay {
  day: number;
  title: string;
  passages: VerseReference[];
  summary: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  category: string;
  durationDays: number;
  description: string;
  days: ReadingPlanDay[];
}

export interface CommunityChallengeComment {
  id: string;
  author: string;
  day: number;
  text: string;
  createdAt: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  dayLabel: string;
  time: string;
  location: string;
  category: string;
  description: string;
}

export interface SermonItem {
  id: string;
  title: string;
  preacher: string;
  date: string;
  series: string;
  passage: string;
  duration: string;
  durationSeconds: number;
  youtubeId: string;
  summary: string;
  keyPoints: string[];
}

export interface PastoralDevotional {
  id: string;
  date: string;
  title: string;
  author: string;
  reference: VerseReference;
  body: string[];
  prayer: string;
}

export interface PrayerRequest {
  id: string;
  author: string;
  isAnonymous: boolean;
  category: 'Família' | 'Saúde' | 'Gratidão' | 'Orientação' | 'Igreja';
  content: string;
  createdAt: string;
  prayingCount: number;
}

export interface SermonNote {
  id: string;
  title: string;
  preacher: string;
  date: string;
  content: string;
  updatedAt: string;
}

export interface NotificationSettings {
  dailyVerseEnabled: boolean;
  dailyVerseTime: string;
  readingPlanEnabled: boolean;
  readingPlanTime: string;
  serviceReminderEnabled: boolean;
}

export interface VisitorSubmission {
  id: string;
  name: string;
  contact: string;
  preferredChannel: 'WhatsApp / Telemóvel' | 'Email' | 'Pessoalmente no domingo';
  message: string;
  submittedAt: string;
}
