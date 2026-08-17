import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initCrashReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn('[crashService] No Sentry DSN set (EXPO_PUBLIC_SENTRY_DSN) — crash reporting disabled.');
    return;
  }
  try {
    Sentry.init({ dsn, tracesSampleRate: 0.2, sendDefaultPii: false });
    initialized = true;
  } catch (err) {
    console.warn('[crashService] init failed', err);
  }
}

// Called from existing `.catch(() => {})` blocks so previously-silent
// failures become visible without changing their no-op behavior.
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // Never let error reporting itself throw.
  }
}
