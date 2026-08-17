import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Friend Duel is the only feature in the app that talks to a network backend,
// and it is entirely opt-in — this client is never touched unless the user
// navigates into the Duel screen and explicitly creates or joins a duel.
let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  if (!isSupabaseConfigured()) return null;
  try {
    client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    );
    return client;
  } catch {
    return null;
  }
}
