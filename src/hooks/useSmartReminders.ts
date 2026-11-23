import { useCallback, useEffect, useRef, useState } from 'react';
import { CHURCH_EVENTS } from '../data/churchData';
import type {
  BibleCorpus,
  BibleVersionId,
  NotificationSettings,
  ReadingPlan,
  ReadingPlanDay,
} from '../types';
import { getDailyVerseForDate } from '../utils/dailyVerse';
import {
  buildReminderPayload,
  evaluateDueReminders,
  getNextChurchServiceReminder,
  type ReminderKind,
  type SmartReminderPayload,
} from '../utils/reminders';

const FIRED_STORAGE_KEY = 'iebhorta_v1_reminders_fired';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface ReminderDeliveryFeedback {
  osDelivered: boolean;
  message: string;
  timestamp: string;
}

function readFiredMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FIRED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeFiredMap(map: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

function playGentleChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Gentle two-note church chime (C5 -> G5)
    const freqs = [523.25, 783.99];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.48);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Audio playback blocked prior to user interaction — fail silently
  }
}

async function dispatchSystemNotification(payload: SmartReminderPayload): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `iebhorta-${payload.slotKey}`,
    data: {
      tab: payload.actionTab,
      bookId: payload.bookId,
      chapter: payload.chapter,
      verse: payload.verse,
    },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 900)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, options);
        return true;
      }
    }
  } catch {
    // Fall back to standard Notification constructor
  }

  try {
    new Notification(payload.title, options);
    return true;
  } catch {
    return false;
  }
}

interface UseSmartRemindersParams {
  settings: NotificationSettings;
  bibleVersion: BibleVersionId;
  primaryCorpus?: BibleCorpus;
  activePlan?: ReadingPlan;
  nextDay?: ReadingPlanDay;
}

export function useSmartReminders({
  settings,
  bibleVersion,
  primaryCorpus,
  activePlan,
  nextDay,
}: UseSmartRemindersParams) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getPermissionState()
  );
  const [activeReminder, setActiveReminder] = useState<SmartReminderPayload | null>(null);
  const [deliveryFeedback, setDeliveryFeedback] = useState<ReminderDeliveryFeedback | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const contextRef = useRef({ bibleVersion, primaryCorpus, activePlan, nextDay });
  contextRef.current = { bibleVersion, primaryCorpus, activePlan, nextDay };

  const syncPermission = useCallback(() => {
    setPermission(getPermissionState());
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      const normalized = result as NotificationPermissionState;
      setPermission(normalized);
      return normalized;
    } catch {
      const current = getPermissionState();
      setPermission(current);
      return current;
    }
  }, []);

  const checkDueReminders = useCallback(async () => {
    const firedMap = readFiredMap();
    const ctx = contextRef.current;
    const now = new Date();
    const { dueReminders, updatedFiredMap } = evaluateDueReminders({
      settings: settingsRef.current,
      firedMap,
      now,
      bibleVersion: ctx.bibleVersion,
      primaryCorpus: ctx.primaryCorpus,
      dailyVerseRef: getDailyVerseForDate(now),
      activePlan: ctx.activePlan,
      nextDay: ctx.nextDay,
      events: CHURCH_EVENTS,
    });

    if (dueReminders.length === 0) return;

    writeFiredMap(updatedFiredMap);
    const latest = dueReminders[0];
    setActiveReminder(latest);

    for (const item of dueReminders) {
      await dispatchSystemNotification(item);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void checkDueReminders();
    }, 1200);

    const interval = window.setInterval(() => {
      void checkDueReminders();
    }, 15_000);

    const handleVisibility = () => {
      syncPermission();
      if (document.visibilityState === 'visible') {
        void checkDueReminders();
      }
    };

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkDueReminders, syncPermission]);

  // Also check immediately whenever user adjusts reminder time/switches
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkDueReminders();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    settings.dailyVerseEnabled,
    settings.dailyVerseTime,
    settings.readingPlanEnabled,
    settings.readingPlanTime,
    settings.serviceReminderEnabled,
    checkDueReminders,
  ]);

  const triggerTestReminder = useCallback(
    async (kind: ReminderKind = 'daily-verse') => {
      let currentPerm = getPermissionState();
      if (currentPerm === 'default') {
        currentPerm = await requestPermission();
      } else {
        setPermission(currentPerm);
      }

      const ctx = contextRef.current;
      const now = new Date();
      const nextService = getNextChurchServiceReminder(CHURCH_EVENTS, now);
      const payload = buildReminderPayload({
        kind,
        bibleVersion: ctx.bibleVersion,
        primaryCorpus: ctx.primaryCorpus,
        dailyVerseRef: getDailyVerseForDate(now),
        activePlan: ctx.activePlan,
        nextDay: ctx.nextDay,
        serviceEvent: nextService?.event,
        scheduledForLabel: 'Teste imediato',
      });

      setActiveReminder(payload);
      playGentleChime();

      const osDelivered = await dispatchSystemNotification(payload);
      const timeNow = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());

      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      let message: string;
      if (osDelivered) {
        message = `Notificação enviada ao dispositivo e apresentada no ecrã (${timeNow}).`;
      } else if (inIframe) {
        message = `Lembrete ativado na aplicação (${timeNow}). Para notificações com o ecrã bloqueado, abra a app em ecrã inteiro.`;
      } else if (currentPerm === 'denied') {
        message = `Lembrete ativado na aplicação (${timeNow}). As notificações do navegador estão bloqueadas nas definições.`;
      } else {
        message = `Lembrete ativado na aplicação (${timeNow}).`;
      }

      setDeliveryFeedback({
        osDelivered,
        message,
        timestamp: timeNow,
      });
    },
    [requestPermission]
  );

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  return {
    permission,
    requestPermission,
    activeReminder,
    dismissReminder,
    triggerTestReminder,
    deliveryFeedback,
  };
}
