import * as StoreReview from 'expo-store-review';

const COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export function shouldPromptForRating(lastPromptAt: number | null, now: number = Date.now()): boolean {
  if (lastPromptAt === null) return true;
  return now - lastPromptAt >= COOLDOWN_MS;
}

// Uses the OS's native "rate this app" sheet only — never a custom UI, per
// App Store / Play Store guidelines. Fails silently if unavailable (web,
// unsupported OS version, etc.).
export async function requestAppReview(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;
    await StoreReview.requestReview();
  } catch {
    // No-op — the OS may also silently ignore this if its own rate-limit
    // (separate from ours) has already been hit this year.
  }
}
