import { useEffect, useRef, useState } from 'react';

interface SessionClock {
  elapsedMs: number;
  remainingMs: number;
  progress: number; // 0..1
}

/**
 * Timestamp-based clock: elapsed time is always (now - startedAt), never accumulated
 * from tick deltas, so it stays correct even if the JS timer drifts, stalls, or the
 * interval is throttled while the app is briefly backgrounded.
 */
export function useSessionClock(
  startedAt: number,
  goalMs: number,
  onComplete: () => void
): SessionClock {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 200);
    return () => clearInterval(id);
  }, [startedAt, goalMs]);

  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, goalMs - elapsedMs);
  const progress = goalMs > 0 ? Math.min(1, elapsedMs / goalMs) : 0;

  useEffect(() => {
    if (elapsedMs >= goalMs && !firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  }, [elapsedMs, goalMs, onComplete]);

  return { elapsedMs, remainingMs, progress };
}
