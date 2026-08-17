import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { getOrCreateDuelDeviceId } from './duelService';
import { addDaysToKey } from '../utils/date';

export { isSupabaseConfigured };

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generateFriendCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// UTC calendar day, not the device's local day — the two devices in a link
// can be in different timezones, so a shared boundary is the only one that
// means the same thing to both of them.
function todayUtcKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FriendStreakStatus {
  linkId: string;
  code: string;
  linked: boolean;
  currentStreak: number;
  checkedInToday: boolean;
  partnerCheckedInToday: boolean;
}

export async function createFriendStreak(): Promise<{ linkId: string; code: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    const code = generateFriendCode();
    const { data, error } = await client
      .from('friend_links')
      .insert({ code, device_a: deviceId })
      .select('id')
      .single();
    if (error || !data) return null;
    return { linkId: data.id, code };
  } catch {
    return null;
  }
}

export async function joinFriendStreak(code: string): Promise<{ linkId: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    const normalized = code.trim().toUpperCase();
    const { data: link, error } = await client
      .from('friend_links')
      .select('id, device_a, device_b')
      .eq('code', normalized)
      .single();
    if (error || !link) return null;

    if (link.device_a === deviceId || link.device_b === deviceId) {
      return { linkId: link.id };
    }
    if (link.device_b) {
      return null; // second slot already taken by someone else
    }

    const { error: updateError } = await client
      .from('friend_links')
      .update({ device_b: deviceId })
      .eq('id', link.id)
      .is('device_b', null);
    if (updateError) return null;
    return { linkId: link.id };
  } catch {
    return null;
  }
}

export async function recordCheckin(linkId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    await client
      .from('friend_checkins')
      .upsert(
        { link_id: linkId, device_id: deviceId, day: todayUtcKey() },
        { onConflict: 'link_id,device_id,day', ignoreDuplicates: true }
      );
  } catch {
    // Checkin sync is best-effort — a failed write never blocks the app.
  }
}

export async function fetchFriendStreakStatus(linkId: string): Promise<FriendStreakStatus | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    const { data: link, error: linkError } = await client
      .from('friend_links')
      .select('id, code, device_a, device_b')
      .eq('id', linkId)
      .single();
    if (linkError || !link) return null;

    const { data: checkins, error: checkinsError } = await client
      .from('friend_checkins')
      .select('device_id, day')
      .eq('link_id', linkId);
    if (checkinsError || !checkins) return null;

    const todayKey = todayUtcKey();
    const partnerDeviceId = link.device_a === deviceId ? link.device_b : link.device_a;
    const checkedInToday = checkins.some((c) => c.device_id === deviceId && c.day === todayKey);
    const partnerCheckedInToday = checkins.some(
      (c) => partnerDeviceId && c.device_id === partnerDeviceId && c.day === todayKey
    );

    const devicesByDay = new Map<string, Set<string>>();
    for (const c of checkins) {
      if (!devicesByDay.has(c.day)) devicesByDay.set(c.day, new Set());
      devicesByDay.get(c.day)!.add(c.device_id);
    }
    const bothCheckedInDays = new Set<string>();
    if (link.device_a && link.device_b) {
      for (const [day, devices] of devicesByDay) {
        if (devices.has(link.device_a) && devices.has(link.device_b)) {
          bothCheckedInDays.add(day);
        }
      }
    }

    let currentStreak = 0;
    let anchor: string | null = null;
    if (bothCheckedInDays.has(todayKey)) {
      anchor = todayKey;
    } else {
      const yesterdayKey = addDaysToKey(todayKey, -1);
      if (bothCheckedInDays.has(yesterdayKey)) anchor = yesterdayKey;
    }
    if (anchor) {
      currentStreak = 1;
      let cursor = anchor;
      while (bothCheckedInDays.has(addDaysToKey(cursor, -1))) {
        cursor = addDaysToKey(cursor, -1);
        currentStreak += 1;
      }
    }

    return {
      linkId: link.id,
      code: link.code,
      linked: Boolean(link.device_a && link.device_b),
      currentStreak,
      checkedInToday,
      partnerCheckedInToday,
    };
  } catch {
    return null;
  }
}
