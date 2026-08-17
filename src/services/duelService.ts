import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const DEVICE_ID_KEY = '@dt/duelDeviceId';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

export { isSupabaseConfigured };

export async function getOrCreateDuelDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const generated = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function generateDuelCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export interface DuelParticipant {
  deviceId: string;
  isMe: boolean;
  durationMs: number | null;
  completed: boolean | null;
}

export interface DuelStatus {
  duelId: string;
  code: string;
  goalMs: number;
  participants: DuelParticipant[];
}

export async function createDuel(goalMs: number): Promise<{ duelId: string; code: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    const code = generateDuelCode();
    const { data, error } = await client
      .from('duels')
      .insert({ code, goal_ms: goalMs, creator_device_id: deviceId })
      .select('id')
      .single();
    if (error || !data) return null;

    await client.from('duel_participants').insert({ duel_id: data.id, device_id: deviceId });
    return { duelId: data.id, code };
  } catch {
    return null;
  }
}

export async function joinDuel(code: string): Promise<{ duelId: string; goalMs: number } | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const normalized = code.trim().toUpperCase();
    const { data: duel, error } = await client
      .from('duels')
      .select('id, goal_ms')
      .eq('code', normalized)
      .single();
    if (error || !duel) return null;

    const deviceId = await getOrCreateDuelDeviceId();
    await client
      .from('duel_participants')
      .upsert(
        { duel_id: duel.id, device_id: deviceId },
        { onConflict: 'duel_id,device_id', ignoreDuplicates: true }
      );
    return { duelId: duel.id, goalMs: duel.goal_ms };
  } catch {
    return null;
  }
}

export async function submitDuelResult(
  duelId: string,
  durationMs: number,
  completed: boolean
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    await client
      .from('duel_participants')
      .upsert(
        {
          duel_id: duelId,
          device_id: deviceId,
          result_duration_ms: Math.round(durationMs),
          result_completed: completed,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'duel_id,device_id' }
      );
  } catch {
    // Result submission is best-effort — a failed sync never blocks the app.
  }
}

export async function fetchDuelStatus(duelId: string): Promise<DuelStatus | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const deviceId = await getOrCreateDuelDeviceId();
    const { data: duel, error: duelError } = await client
      .from('duels')
      .select('id, code, goal_ms')
      .eq('id', duelId)
      .single();
    if (duelError || !duel) return null;

    const { data: rows, error: participantsError } = await client
      .from('duel_participants')
      .select('device_id, result_duration_ms, result_completed')
      .eq('duel_id', duelId);
    if (participantsError || !rows) return null;

    return {
      duelId: duel.id,
      code: duel.code,
      goalMs: duel.goal_ms,
      participants: rows.map((r) => ({
        deviceId: r.device_id,
        isMe: r.device_id === deviceId,
        durationMs: r.result_duration_ms,
        completed: r.result_completed,
      })),
    };
  } catch {
    return null;
  }
}
