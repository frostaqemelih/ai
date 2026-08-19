import { PostHog } from 'posthog-react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-device is installed but never imported anywhere in src/ — that's
// expected, not dead weight. posthog-react-native declares it as an
// optional peer dependency and dynamically requires it itself (see its
// dist/native-deps.js getAppProperties()) to auto-populate
// $device_manufacturer/$device_name/$os_name/$os_version/$is_emulator on
// every captured event. Removing the package would silently degrade
// PostHog's device context, not just remove unused code (Faz 14-C).

// Anonymous, locally-generated distinct_id — never a device identifier,
// name, or email. Persists only so events from the same install group
// together; nothing here can be traced back to a person without their
// explicit, separate consent to a networked feature (e.g. Friend Duel).
const ANON_ID_KEY = '@dt/analyticsAnonId';

let client: PostHog | null = null;
let anonId: string | null = null;

async function getOrCreateAnonId(): Promise<string> {
  if (anonId) return anonId;
  const stored = await AsyncStorage.getItem(ANON_ID_KEY);
  if (stored) {
    anonId = stored;
    return stored;
  }
  const generated = Crypto.randomUUID();
  await AsyncStorage.setItem(ANON_ID_KEY, generated);
  anonId = generated;
  return generated;
}

export async function initAnalytics(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  if (!apiKey) {
    console.warn('[analyticsService] No PostHog API key set (EXPO_PUBLIC_POSTHOG_API_KEY) — analytics disabled.');
    return;
  }
  try {
    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    client = new PostHog(apiKey, { host, persistence: 'file' });
    const id = await getOrCreateAnonId();
    client.identify(id);
  } catch (err) {
    console.warn('[analyticsService] init failed', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function track(event: string, properties?: Record<string, any>): void {
  if (!client) return;
  try {
    client.capture(event, properties);
  } catch {
    // Analytics must never break the app — swallow silently.
  }
}
