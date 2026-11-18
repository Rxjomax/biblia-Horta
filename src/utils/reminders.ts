import type {
  BibleCorpus,
  BibleVersionId,
  ChurchEvent,
  NotificationSettings,
  ReadingPlan,
  ReadingPlanDay,
} from '../types';
import { getVerseFromCorpusOrFallback } from '../services/bibleLoader';

export type ReminderKind = 'daily-verse' | 'reading-plan' | 'church-service';

export interface SmartReminderPayload {
  id: string;
  slotKey: string;
  kind: ReminderKind;
  title: string;
  body: string;
  actionLabel: string;
  actionTab: 'inicio' | 'biblia' | 'planos' | 'comunidade';
  bookId?: string;
  chapter?: number;
  verse?: number;
  scheduledForLabel: string;
}

export interface ScheduledReminderPreview {
  kind: ReminderKind;
  label: string;
  detail: string;
  notifyAt: Date;
  whenLabel: string;
  countdownLabel: string;
}

const PT_WEEKDAY_MAP: Record<string, number> = {
  domingo: 0,
  'segunda-feira': 1,
  'terça-feira': 2,
  'terca-feira': 2,
  'quarta-feira': 3,
  'quinta-feira': 4,
  'sexta-feira': 5,
  sábado: 6,
  sabado: 6,
};

const WEEKDAY_NAMES_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export function parseTimeHHMM(hhmm: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatTimeUntilPt(targetDate: Date, now: Date): string {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 60_000) {
    return 'agora mesmo';
  }
  const totalMinutes = Math.round(diffMs / 60_000);
  if (totalMinutes < 60) {
    return `daqui a ${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) {
    return mins > 0 ? `daqui a ${hours} h ${mins} min` : `daqui a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'amanhã' : `daqui a ${days} dias`;
}

export function formatWhenLabelPt(targetDate: Date, now: Date): string {
  const targetKey = toLocalDateKey(targetDate);
  const todayKey = toLocalDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);
  const hhmm = formatTimeHHMM(targetDate);

  if (targetKey === todayKey) return `Hoje às ${hhmm}`;
  if (targetKey === tomorrowKey) return `Amanhã às ${hhmm}`;
  const weekday = WEEKDAY_NAMES_PT[targetDate.getDay()] ?? '';
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} às ${hhmm}`;
}

export interface NextServiceReminderInfo {
  event: ChurchEvent;
  eventAt: Date;
  notifyAt: Date;
}

export function getNextChurchServiceReminder(
  events: ChurchEvent[],
  now: Date
): NextServiceReminderInfo | null {
  let best: NextServiceReminderInfo | null = null;

  for (const event of events) {
    const targetDay = PT_WEEKDAY_MAP[event.dayLabel.trim().toLowerCase()];
    const parsedTime = parseTimeHHMM(event.time);
    if (targetDay === undefined || !parsedTime) continue;

    const candidateEventAt = new Date(now);
    candidateEventAt.setSeconds(0, 0);
    const dayDiff = (targetDay - now.getDay() + 7) % 7;
    candidateEventAt.setDate(candidateEventAt.getDate() + dayDiff);
    candidateEventAt.setHours(parsedTime.hour, parsedTime.minute, 0, 0);

    let candidateNotifyAt = new Date(candidateEventAt.getTime() - 60 * 60_000);
    if (candidateEventAt.getTime() <= now.getTime()) {
      candidateEventAt.setDate(candidateEventAt.getDate() + 7);
      candidateNotifyAt = new Date(candidateEventAt.getTime() - 60 * 60_000);
    }

    if (!best || candidateNotifyAt.getTime() < best.notifyAt.getTime()) {
      best = {
        event,
        eventAt: candidateEventAt,
        notifyAt: candidateNotifyAt,
      };
    }
  }

  return best;
}

function getNextDailyTime(hhmm: string, now: Date): Date {
  const parsed = parseTimeHHMM(hhmm) ?? { hour: 8, minute: 0 };
  const target = new Date(now);
  target.setHours(parsed.hour, parsed.minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function getUpcomingRemindersSchedule(params: {
  settings: NotificationSettings;
  activePlan?: ReadingPlan;
  nextDay?: ReadingPlanDay;
  events: ChurchEvent[];
  now?: Date;
}): ScheduledReminderPreview[] {
  const now = params.now ?? new Date();
  const items: ScheduledReminderPreview[] = [];

  if (params.settings.dailyVerseEnabled) {
    const notifyAt = getNextDailyTime(params.settings.dailyVerseTime, now);
    items.push({
      kind: 'daily-verse',
      label: 'Versículo do Dia',
      detail: 'Leitura matinal da Palavra',
      notifyAt,
      whenLabel: formatWhenLabelPt(notifyAt, now),
      countdownLabel: formatTimeUntilPt(notifyAt, now),
    });
  }

  if (params.settings.readingPlanEnabled) {
    const notifyAt = getNextDailyTime(params.settings.readingPlanTime, now);
    const planDetail = params.activePlan
      ? params.nextDay
        ? `${params.activePlan.title} · Dia ${params.nextDay.day}`
        : params.activePlan.title
      : 'Manter sequência diária';
    items.push({
      kind: 'reading-plan',
      label: 'Plano de Leitura',
      detail: planDetail,
      notifyAt,
      whenLabel: formatWhenLabelPt(notifyAt, now),
      countdownLabel: formatTimeUntilPt(notifyAt, now),
    });
  }

  if (params.settings.serviceReminderEnabled) {
    const nextService = getNextChurchServiceReminder(params.events, now);
    if (nextService) {
      const effectiveNotifyAt =
        nextService.notifyAt.getTime() <= now.getTime() ? now : nextService.notifyAt;
      items.push({
        kind: 'church-service',
        label: nextService.event.title,
        detail: `1 hora antes (${nextService.event.dayLabel}, ${nextService.event.time})`,
        notifyAt: effectiveNotifyAt,
        whenLabel: formatWhenLabelPt(effectiveNotifyAt, now),
        countdownLabel:
          nextService.notifyAt.getTime() <= now.getTime()
            ? `começa às ${nextService.event.time}`
            : formatTimeUntilPt(nextService.notifyAt, now),
      });
    }
  }

  return items.sort((a, b) => a.notifyAt.getTime() - b.notifyAt.getTime());
}

export function buildReminderPayload(params: {
  kind: ReminderKind;
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  dailyVerseRef: { bookId: string; bookName: string; chapter: number; verse: number };
  activePlan?: ReadingPlan;
  nextDay?: ReadingPlanDay;
  serviceEvent?: ChurchEvent;
  scheduledForLabel?: string;
}): SmartReminderPayload {
  const {
    kind,
    bibleVersion,
    dailyVerseRef,
    activePlan,
    nextDay,
    serviceEvent,
    scheduledForLabel = 'Agora',
  } = params;

  if (kind === 'daily-verse') {
    const verseText =
      getVerseFromCorpusOrFallback(
        bibleVersion,
        dailyVerseRef.bookId,
        dailyVerseRef.chapter,
        dailyVerseRef.verse
      ) || 'Levanto os meus olhos para os montes e pergunto: De onde me vem o socorro?';

    return {
      id: `rem-daily-${Date.now()}`,
      slotKey: 'daily-verse',
      kind: 'daily-verse',
      title: `Versículo do Dia · ${dailyVerseRef.bookName} ${dailyVerseRef.chapter}:${dailyVerseRef.verse}`,
      body: `«${verseText}»`,
      actionLabel: `Ler ${dailyVerseRef.bookName} ${dailyVerseRef.chapter}`,
      actionTab: 'biblia',
      bookId: dailyVerseRef.bookId,
      chapter: dailyVerseRef.chapter,
      verse: dailyVerseRef.verse,
      scheduledForLabel,
    };
  }

  if (kind === 'reading-plan') {
    const firstPassage = nextDay?.passages[0];
    const passageLabel = firstPassage
      ? `${firstPassage.bookName} ${firstPassage.chapter}`
      : 'leitura de hoje';
    return {
      id: `rem-plan-${Date.now()}`,
      slotKey: 'reading-plan',
      kind: 'reading-plan',
      title: activePlan ? `Plano: ${activePlan.title}` : 'Plano de Leitura Bíblica',
      body: nextDay
        ? `Dia ${nextDay.day}: ${nextDay.title} (${passageLabel}). Reserve uns minutos tranquilos com Deus.`
        : 'Continue hoje a sua leitura bíblica diária.',
      actionLabel: firstPassage ? `Ler ${passageLabel}` : 'Abrir Planos',
      actionTab: firstPassage ? 'biblia' : 'planos',
      bookId: firstPassage?.bookId,
      chapter: firstPassage?.chapter,
      scheduledForLabel,
    };
  }

  const evTitle = serviceEvent?.title ?? 'Culto de Celebração e Palavra';
  const evTime = serviceEvent?.time ?? '10:30';
  const evLocation = serviceEvent?.location ?? 'Templo Principal · IEB Horta';
  return {
    id: `rem-service-${serviceEvent?.id ?? 'culto'}-${Date.now()}`,
    slotKey: `service:${serviceEvent?.id ?? 'culto'}`,
    kind: 'church-service',
    title: `${evTitle} · às ${evTime}`,
    body: `Começa dentro de 1 hora em ${evLocation}. Prepare o seu coração e a sua Bíblia.`,
    actionLabel: 'Ver Agenda da Igreja',
    actionTab: 'comunidade',
    scheduledForLabel,
  };
}

export function evaluateDueReminders(params: {
  settings: NotificationSettings;
  firedMap: Record<string, string>;
  now: Date;
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  dailyVerseRef: { bookId: string; bookName: string; chapter: number; verse: number };
  activePlan?: ReadingPlan;
  nextDay?: ReadingPlanDay;
  events: ChurchEvent[];
  catchUpWindowMinutes?: number;
}): {
  dueReminders: SmartReminderPayload[];
  updatedFiredMap: Record<string, string>;
} {
  const {
    settings,
    firedMap,
    now,
    bibleVersion,
    primaryCorpus,
    dailyVerseRef,
    activePlan,
    nextDay,
    events,
    catchUpWindowMinutes = 90,
  } = params;

  const todayKey = toLocalDateKey(now);
  const dueReminders: SmartReminderPayload[] = [];
  const updatedFiredMap = { ...firedMap };
  const windowMs = catchUpWindowMinutes * 60_000;

  if (settings.dailyVerseEnabled && updatedFiredMap['daily-verse'] !== todayKey) {
    const parsed = parseTimeHHMM(settings.dailyVerseTime);
    if (parsed) {
      const scheduledToday = new Date(now);
      scheduledToday.setHours(parsed.hour, parsed.minute, 0, 0);
      const elapsed = now.getTime() - scheduledToday.getTime();
      if (elapsed >= 0 && elapsed <= windowMs) {
        dueReminders.push(
          buildReminderPayload({
            kind: 'daily-verse',
            bibleVersion,
            primaryCorpus,
            dailyVerseRef,
            scheduledForLabel: `Agendado para as ${settings.dailyVerseTime}`,
          })
        );
        updatedFiredMap['daily-verse'] = todayKey;
      }
    }
  }

  if (settings.readingPlanEnabled && updatedFiredMap['reading-plan'] !== todayKey) {
    const parsed = parseTimeHHMM(settings.readingPlanTime);
    if (parsed) {
      const scheduledToday = new Date(now);
      scheduledToday.setHours(parsed.hour, parsed.minute, 0, 0);
      const elapsed = now.getTime() - scheduledToday.getTime();
      if (elapsed >= 0 && elapsed <= windowMs) {
        dueReminders.push(
          buildReminderPayload({
            kind: 'reading-plan',
            bibleVersion,
            primaryCorpus,
            dailyVerseRef,
            activePlan,
            nextDay,
            scheduledForLabel: `Agendado para as ${settings.readingPlanTime}`,
          })
        );
        updatedFiredMap['reading-plan'] = todayKey;
      }
    }
  }

  if (settings.serviceReminderEnabled) {
    for (const ev of events) {
      const targetDay = PT_WEEKDAY_MAP[ev.dayLabel.trim().toLowerCase()];
      const parsed = parseTimeHHMM(ev.time);
      if (targetDay === undefined || !parsed || targetDay !== now.getDay()) continue;

      const slotKey = `service:${ev.id}`;
      if (updatedFiredMap[slotKey] === todayKey) continue;

      const eventAt = new Date(now);
      eventAt.setHours(parsed.hour, parsed.minute, 0, 0);
      const notifyAt = new Date(eventAt.getTime() - 60 * 60_000);

      if (now.getTime() >= notifyAt.getTime() && now.getTime() < eventAt.getTime()) {
        dueReminders.push(
          buildReminderPayload({
            kind: 'church-service',
            bibleVersion,
            primaryCorpus,
            dailyVerseRef,
            serviceEvent: ev,
            scheduledForLabel: `1 hora antes (${ev.time})`,
          })
        );
        updatedFiredMap[slotKey] = todayKey;
      }
    }
  }

  return { dueReminders, updatedFiredMap };
}
