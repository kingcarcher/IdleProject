import type { GameDay } from '@/content';

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;
/** Calendar year that in-game day 0 falls in. */
export const EPOCH_YEAR = 2201;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export interface CalendarDate {
  readonly year: number;
  /** 1-based. */
  readonly month: number;
  /** 1-based. */
  readonly dayOfMonth: number;
}

export function toCalendarDate(day: GameDay): CalendarDate {
  const whole = Math.max(0, Math.floor(day));
  const year = EPOCH_YEAR + Math.floor(whole / DAYS_PER_YEAR);
  const dayOfYear = whole % DAYS_PER_YEAR;
  return {
    year,
    month: Math.floor(dayOfYear / DAYS_PER_MONTH) + 1,
    dayOfMonth: (dayOfYear % DAYS_PER_MONTH) + 1,
  };
}

export function formatDate(day: GameDay): string {
  const { year, month, dayOfMonth } = toCalendarDate(day);
  return `${dayOfMonth} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** Human-readable length of a span of days, e.g. "1 year, 2 months". */
export function formatDuration(days: number): string {
  const whole = Math.max(0, Math.round(days));
  if (whole < DAYS_PER_MONTH) {
    return plural(whole, 'day');
  }
  const years = Math.floor(whole / DAYS_PER_YEAR);
  const months = Math.floor((whole % DAYS_PER_YEAR) / DAYS_PER_MONTH);
  const parts: string[] = [];
  if (years > 0) parts.push(plural(years, 'year'));
  if (months > 0) parts.push(plural(months, 'month'));
  return parts.join(', ');
}

/** Zero-based index of the month a day falls in, counted from day 0. */
export function monthIndex(day: GameDay): number {
  return Math.floor(day / DAYS_PER_MONTH);
}

/** Number of month boundaries crossed when moving from `fromDay` to `toDay`. */
export function monthsCrossed(fromDay: GameDay, toDay: GameDay): number {
  if (toDay <= fromDay) return 0;
  return monthIndex(toDay) - monthIndex(fromDay);
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}
