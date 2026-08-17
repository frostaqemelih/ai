export const MILESTONE_MS: number[] = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

export function milestoneLabel(ms: number): string {
  const minutes = Math.round(ms / 60000);
  return `${minutes} MINUTE${minutes === 1 ? '' : 'S'} SURVIVED`;
}
