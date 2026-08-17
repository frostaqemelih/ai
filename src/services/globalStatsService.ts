import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export { isSupabaseConfigured };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Reads today's running total. Returns null if Supabase isn't configured or
// the request fails — callers should fall back to a "Coming soon" state.
export async function fetchGlobalTotalTodayMs(): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('daily_aggregate_stats')
      .select('total_duration_ms')
      .eq('day', todayIsoDate())
      .maybeSingle();
    if (error || !data) return 0;
    return Number(data.total_duration_ms);
  } catch {
    return null;
  }
}

// Fire-and-forget: adds this run's duration to today's global total via a
// server-side RPC (never a raw client UPDATE). No device or session
// identifier is sent — just a number.
export async function contributeToGlobalStats(durationMs: number): Promise<void> {
  const client = getSupabaseClient();
  if (!client || durationMs <= 0) return;
  try {
    await client.rpc('increment_global_stats', { duration_ms: Math.round(durationMs) });
  } catch {
    // Best-effort only — never blocks or surfaces to the user.
  }
}
