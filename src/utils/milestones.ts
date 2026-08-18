export const MILESTONE_MS: number[] = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

export function minutesForMilestone(ms: number): number {
  return Math.round(ms / 60000);
}
