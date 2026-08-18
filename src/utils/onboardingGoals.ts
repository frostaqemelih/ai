export interface OnboardingReason {
  id: string;
  labelKey: string;
  goalMs: number;
  /** Pre-filled schedule suggestion for this reason — applied automatically
   *  at the end of onboarding if the user granted notification permission,
   *  so they arrive at their first session with a plan already in place
   *  rather than having to configure one from a blank ScheduleScreen. */
  schedule: { weekdays: number[]; hour: number; minute: number } | null;
}

const WEEKDAYS_MON_FRI = [2, 3, 4, 5, 6];
const WEEKDAYS_ALL = [1, 2, 3, 4, 5, 6, 7];

export const ONBOARDING_REASONS: OnboardingReason[] = [
  {
    id: 'focus',
    labelKey: 'onboarding.reasonFocus',
    goalMs: 15 * 60 * 1000,
    schedule: { weekdays: WEEKDAYS_MON_FRI, hour: 9, minute: 0 },
  },
  {
    id: 'scroll',
    labelKey: 'onboarding.reasonScroll',
    goalMs: 10 * 60 * 1000,
    schedule: { weekdays: WEEKDAYS_ALL, hour: 20, minute: 0 },
  },
  {
    id: 'study',
    labelKey: 'onboarding.reasonStudy',
    goalMs: 30 * 60 * 1000,
    schedule: { weekdays: WEEKDAYS_MON_FRI, hour: 19, minute: 0 },
  },
  {
    id: 'sleep',
    labelKey: 'onboarding.reasonSleep',
    goalMs: 15 * 60 * 1000,
    schedule: { weekdays: WEEKDAYS_ALL, hour: 22, minute: 0 },
  },
  {
    id: 'curious',
    labelKey: 'onboarding.reasonCurious',
    goalMs: 5 * 60 * 1000,
    schedule: null,
  },
];

export function getOnboardingReason(id: string | null): OnboardingReason | null {
  return ONBOARDING_REASONS.find((r) => r.id === id) ?? null;
}
