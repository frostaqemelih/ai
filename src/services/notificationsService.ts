import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STREAK_REMINDER_ID = 'streak-ending-reminder';
const INACTIVITY_REMINDER_ID = 'inactivity-reminder';
const FRIEND_STREAK_REMINDER_ID = 'friend-streak-ending-reminder';
const TRIAL_ENDING_REMINDER_ID = 'trial-ending-reminder';
const STREAK_REMINDER_HOUR = 20;
const INACTIVITY_DAYS = 3;
const INACTIVITY_REMINDER_HOUR = 10;
const FRIEND_STREAK_REMINDER_HOUR = 19;
const TRIAL_REMINDER_HOUR = 10;
const SCHEDULE_NOTIFICATION_TYPE = 'scheduled-session';

function scheduleSessionId(weekday: number): string {
  return `schedule-session-${weekday}`;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

// Requests permission at most once from the OS's point of view — if the user
// already declined, this just returns the current (denied) status rather
// than re-prompting, matching iOS/Android platform conventions.
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

async function cancelSafe(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // no-op — nothing was scheduled, or notifications are unavailable.
  }
}

// title/body are pre-formatted by the caller (AppDataContext), same
// established pattern as scheduleSessionPlan below — this service has no
// i18n/persona access of its own by design (see Faz 13-A: giving it one
// previously recreated the AppDataContext<->i18n require cycle). Faz 14-B
// moved these four reminders' text out of hardcoded English into that same
// caller-resolves-it pattern.
export async function scheduleStreakReminder(
  shouldSchedule: boolean,
  title: string,
  body: string
): Promise<void> {
  await cancelSafe(STREAK_REMINDER_ID);
  if (!shouldSchedule || !isNativePlatform()) return;

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), STREAK_REMINDER_HOUR, 0, 0);
  if (target.getTime() <= now.getTime()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_REMINDER_ID,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

export async function scheduleInactivityReminder(
  lastActivityAt: number | null,
  title: string,
  body: string
): Promise<void> {
  await cancelSafe(INACTIVITY_REMINDER_ID);
  if (!isNativePlatform()) return;

  const base = lastActivityAt ?? Date.now();
  const target = new Date(base);
  target.setDate(target.getDate() + INACTIVITY_DAYS);
  target.setHours(INACTIVITY_REMINDER_HOUR, 0, 0, 0);
  if (target.getTime() <= Date.now()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: INACTIVITY_REMINDER_ID,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

export async function scheduleFriendStreakReminder(
  shouldSchedule: boolean,
  title: string,
  body: string
): Promise<void> {
  await cancelSafe(FRIEND_STREAK_REMINDER_ID);
  if (!shouldSchedule || !isNativePlatform()) return;

  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    FRIEND_STREAK_REMINDER_HOUR,
    0,
    0
  );
  if (target.getTime() <= now.getTime()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: FRIEND_STREAK_REMINDER_ID,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

// A day-before heads-up for a free trial converting to a paid subscription —
// unexpected charges are the single largest complaint category for this app
// category (Faz 9 Bölüm D), and this is the cheapest way to prevent one.
// Deliberately NOT included in cancelAllReminders/disableNotifications —
// this is a financial notice, not a retention nudge, so it stays scheduled
// independently of the user's "Reminders" preference as long as OS
// notification permission was granted at some point. Also deliberately NOT
// persona-toned (unlike the other three reminders) — same reasoning as the
// paywall's own copy: a notice about being charged money reads as more
// trustworthy in a neutral voice, not a persona's, regardless of who's
// selected. Its text lives under the top-level `notifications.trialEnding`
// key, not `personas.<id>.*`.
export async function scheduleTrialEndingReminder(
  expirationDateMillis: number | null,
  title: string,
  body: string
): Promise<void> {
  await cancelSafe(TRIAL_ENDING_REMINDER_ID);
  if (!expirationDateMillis || !isNativePlatform()) return;

  const target = new Date(expirationDateMillis);
  target.setDate(target.getDate() - 1);
  target.setHours(TRIAL_REMINDER_HOUR, 0, 0, 0);
  if (target.getTime() <= Date.now()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TRIAL_ENDING_REMINDER_ID,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

// One recurring WEEKLY-trigger notification per selected weekday — each is
// the action itself (tap → straight into Countdown with this goal, see
// RootNavigator's response listener), not a passive nudge. `data.goalMs`
// is what the response listener reads; title/body are pre-formatted by the
// caller (AppDataContext) since this service has no i18n/persona access of
// its own. Always cancels all 7 possible weekday slots first — simpler and
// safer than tracking which ones were previously scheduled.
export async function scheduleSessionPlan(
  schedule: { weekdays: number[]; hour: number; minute: number; goalMs: number } | null,
  title: string,
  body: string
): Promise<void> {
  await Promise.all(Array.from({ length: 7 }, (_, i) => cancelSafe(scheduleSessionId(i + 1))));
  if (!schedule || !isNativePlatform()) return;

  for (const weekday of schedule.weekdays) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: scheduleSessionId(weekday),
        content: {
          title,
          body,
          data: { type: SCHEDULE_NOTIFICATION_TYPE, goalMs: schedule.goalMs },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: schedule.hour,
          minute: schedule.minute,
        },
      });
    } catch {
      // Permission not granted, or notifications unavailable — silently skip.
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  await cancelSafe(STREAK_REMINDER_ID);
  await cancelSafe(INACTIVITY_REMINDER_ID);
  await cancelSafe(FRIEND_STREAK_REMINDER_ID);
}
