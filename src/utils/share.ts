import type { SessionRecord } from '../types';
import { formatClock } from './time';

export function buildShareMessage(record: SessionRecord, currentStreak: number): string {
  const time = formatClock(record.durationMs);
  const streakLine = currentStreak > 1 ? ` 🔥 ${currentStreak} day streak.` : '';

  if (record.completed) {
    return `I just survived ${time} without touching my phone.${streakLine} Think you can beat that?\n\nDON'T TOUCH`;
  }

  return `I lasted ${time} before touching my phone.${streakLine} Think you can beat that?\n\nDON'T TOUCH`;
}
