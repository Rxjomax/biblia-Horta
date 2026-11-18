import assert from 'node:assert/strict';
import test from 'node:test';
import { CHURCH_EVENTS, DAILY_VERSE_REF, READING_PLANS } from '../data/churchData';
import {
  evaluateDueReminders,
  getNextChurchServiceReminder,
  getUpcomingRemindersSchedule,
} from './reminders';

test('getNextChurchServiceReminder calculates 1 hour before upcoming Sunday or midweek service', () => {
  // Sunday 2026-11-15 09:45 local -> next notify is Culto de Celebração (10:30, notify 09:30 already active until 10:30 or Quarta 19:00)
  // Using Sunday 08:00: Escola Bíblica is 09:30 -> notify at 08:30!
  const sundayMorning = new Date(2026, 10, 15, 8, 0, 0);
  const next = getNextChurchServiceReminder(CHURCH_EVENTS, sundayMorning);
  assert.ok(next);
  assert.equal(next.event.id, 'escola-biblica');
  assert.equal(next.notifyAt.getHours(), 8);
  assert.equal(next.notifyAt.getMinutes(), 30);

  // Monday 2026-11-16 14:00 -> next is Reunião de Oração (Quarta-feira 20:00 -> notify 19:00)
  const mondayAfternoon = new Date(2026, 10, 16, 14, 0, 0);
  const nextWed = getNextChurchServiceReminder(CHURCH_EVENTS, mondayAfternoon);
  assert.ok(nextWed);
  assert.equal(nextWed.event.id, 'oracao-quarta');
  assert.equal(nextWed.notifyAt.getDay(), 3);
  assert.equal(nextWed.notifyAt.getHours(), 19);
  assert.equal(nextWed.notifyAt.getMinutes(), 0);
});

test('evaluateDueReminders fires due daily verse and reading plan once per day', () => {
  const settings = {
    dailyVerseEnabled: true,
    dailyVerseTime: '08:00',
    readingPlanEnabled: true,
    readingPlanTime: '20:30',
    serviceReminderEnabled: true,
  };
  const plan = READING_PLANS[0];
  const day = plan.days[0];

  // At 08:05 on Monday -> daily verse is due, reading plan (20:30) is NOT due yet
  const morningNow = new Date(2026, 10, 16, 8, 5, 0);
  const firstRun = evaluateDueReminders({
    settings,
    firedMap: {},
    now: morningNow,
    bibleVersion: 'NVI',
    dailyVerseRef: DAILY_VERSE_REF,
    activePlan: plan,
    nextDay: day,
    events: CHURCH_EVENTS,
  });

  assert.equal(firstRun.dueReminders.length, 1);
  assert.equal(firstRun.dueReminders[0].kind, 'daily-verse');
  assert.equal(firstRun.updatedFiredMap['daily-verse'], '2026-11-16');

  // Re-evaluating at 08:10 with updatedFiredMap does NOT duplicate
  const secondRun = evaluateDueReminders({
    settings,
    firedMap: firstRun.updatedFiredMap,
    now: new Date(2026, 10, 16, 8, 10, 0),
    bibleVersion: 'NVI',
    dailyVerseRef: DAILY_VERSE_REF,
    activePlan: plan,
    nextDay: day,
    events: CHURCH_EVENTS,
  });
  assert.equal(secondRun.dueReminders.length, 0);
});

test('evaluateDueReminders triggers church-service reminder inside 1h pre-service window', () => {
  const settings = {
    dailyVerseEnabled: false,
    dailyVerseTime: '08:00',
    readingPlanEnabled: false,
    readingPlanTime: '20:30',
    serviceReminderEnabled: true,
  };

  // Sunday 2026-11-15 09:40 -> inside 1h before Culto de Celebração (10:30)
  const beforeCulto = new Date(2026, 10, 15, 9, 40, 0);
  const res = evaluateDueReminders({
    settings,
    firedMap: {},
    now: beforeCulto,
    bibleVersion: 'NVI',
    dailyVerseRef: DAILY_VERSE_REF,
    events: CHURCH_EVENTS,
  });

  assert.equal(res.dueReminders.length, 1);
  assert.equal(res.dueReminders[0].kind, 'church-service');
  assert.match(res.dueReminders[0].title, /Culto de Celebração/);
});

test('getUpcomingRemindersSchedule sorts upcoming reminders chronologically', () => {
  const now = new Date(2026, 10, 16, 14, 0, 0);
  const plan = READING_PLANS[0];
  const schedule = getUpcomingRemindersSchedule({
    settings: {
      dailyVerseEnabled: true,
      dailyVerseTime: '08:00',
      readingPlanEnabled: true,
      readingPlanTime: '20:30',
      serviceReminderEnabled: true,
    },
    activePlan: plan,
    nextDay: plan.days[0],
    events: CHURCH_EVENTS,
    now,
  });

  assert.equal(schedule.length, 3);
  assert.equal(schedule[0].kind, 'reading-plan'); // Today 20:30
  assert.equal(schedule[1].kind, 'daily-verse'); // Tomorrow 08:00
  assert.equal(schedule[2].kind, 'church-service'); // Wednesday 19:00
});
