import type { CharacterRole } from '@/content';
import { DAYS_PER_MONTH, DAYS_PER_YEAR } from '@/engine';

export function formatMoney(credits: number): string {
  return `${Math.round(credits).toLocaleString('en-US')} cr`;
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Real-time remaining as m:ss (or h:mm:ss past an hour). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${hours > 0 ? String(minutes).padStart(2, '0') : minutes}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** "today", "12 days ago", "3 months ago", "2 years ago". */
export function formatTimeAgo(days: number): string {
  if (days <= 0) return 'today';
  if (days < DAYS_PER_MONTH) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (days < DAYS_PER_YEAR) {
    const months = Math.floor(days / DAYS_PER_MONTH);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(days / DAYS_PER_YEAR);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export function roleLabel(role: CharacterRole): string {
  switch (role) {
    case 'mother':
      return 'your mother';
    case 'friend':
      return 'your best friend';
    case 'partner':
      return 'your partner';
    case 'bartender':
      return 'bartender';
    case 'acquaintance':
      return '';
  }
}
