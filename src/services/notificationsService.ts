import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STREAK_REMINDER_ID = 'streak-ending-reminder';
const INACTIVITY_REMINDER_ID = 'inactivity-reminder';
const FRIEND_STREAK_REMINDER_ID = 'friend-streak-ending-reminder';
const STREAK_REMINDER_HOUR = 20;
const INACTIVITY_DAYS = 3;
const INACTIVITY_REMINDER_HOUR = 10;
const FRIEND_STREAK_REMINDER_HOUR = 19;

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

export async function getNotificationPermissionGranted(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
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

export async function scheduleStreakReminder(shouldSchedule: boolean): Promise<void> {
  await cancelSafe(STREAK_REMINDER_ID);
  if (!shouldSchedule || !isNativePlatform()) return;

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), STREAK_REMINDER_HOUR, 0, 0);
  if (target.getTime() <= now.getTime()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_REMINDER_ID,
      content: {
        title: 'Your streak ends today',
        body: 'Complete one run before midnight to keep it alive.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

export async function scheduleInactivityReminder(lastActivityAt: number | null): Promise<void> {
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
      content: {
        title: 'Ready for another run?',
        body: "It's been a few days. Put your phone down and see how long you last.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

export async function scheduleFriendStreakReminder(shouldSchedule: boolean): Promise<void> {
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
      content: {
        title: 'Your friend streak ends today',
        body: "You haven't checked in yet — complete a run to keep it alive.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
    });
  } catch {
    // Permission not granted, or notifications unavailable — silently skip.
  }
}

export async function cancelAllReminders(): Promise<void> {
  await cancelSafe(STREAK_REMINDER_ID);
  await cancelSafe(INACTIVITY_REMINDER_ID);
  await cancelSafe(FRIEND_STREAK_REMINDER_ID);
}
