import { useEffect, useRef, useState } from 'react';
import { MILESTONE_MS, minutesForMilestone } from '../utils/milestones';
import { firstTemptationDelay, nextTemptationDelay, randomTemptationMessage } from '../utils/temptations';

interface ToastState {
  key: number;
  text: string;
}

const MIN_GOAL_FOR_TEMPTATIONS_MS = 90_000;
const TEMPTATION_SAFETY_MARGIN_MS = 15_000;

// Persona-specific copy lives in i18n; this hook only owns timing/selection
// logic, so it takes the resolved message pool and a minutes->label
// formatter from the caller (SessionScreen, which has both the active
// persona and `t()`) rather than importing either itself.
export function useSessionEvents(
  elapsedMs: number,
  goalMs: number,
  temptationPool: string[],
  formatMilestoneLabel: (minutes: number) => string
) {
  const [temptation, setTemptation] = useState<ToastState | null>(null);
  const [milestone, setMilestone] = useState<ToastState | null>(null);

  const shownMilestones = useRef<Set<number>>(new Set());
  const nextTemptationAt = useRef<number>(firstTemptationDelay());
  const temptationActive = useRef(false);
  const toastKey = useRef(0);

  useEffect(() => {
    shownMilestones.current = new Set();
    nextTemptationAt.current = firstTemptationDelay();
    temptationActive.current = false;
    setTemptation(null);
    setMilestone(null);
  }, [goalMs]);

  useEffect(() => {
    for (const threshold of MILESTONE_MS) {
      if (threshold < goalMs && elapsedMs >= threshold && !shownMilestones.current.has(threshold)) {
        shownMilestones.current.add(threshold);
        toastKey.current += 1;
        setMilestone({ key: toastKey.current, text: formatMilestoneLabel(minutesForMilestone(threshold)) });
        break;
      }
    }

    if (
      goalMs >= MIN_GOAL_FOR_TEMPTATIONS_MS &&
      !temptationActive.current &&
      elapsedMs >= nextTemptationAt.current &&
      goalMs - elapsedMs >= TEMPTATION_SAFETY_MARGIN_MS
    ) {
      temptationActive.current = true;
      toastKey.current += 1;
      setTemptation({ key: toastKey.current, text: randomTemptationMessage(temptationPool) });
      nextTemptationAt.current = elapsedMs + nextTemptationDelay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMs, goalMs]);

  const clearTemptation = () => {
    temptationActive.current = false;
    setTemptation(null);
  };
  const clearMilestone = () => setMilestone(null);

  return { temptation, milestone, clearTemptation, clearMilestone };
}
