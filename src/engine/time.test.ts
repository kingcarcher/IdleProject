import { describe, expect, it } from 'vitest';
import {
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  EPOCH_YEAR,
  formatDate,
  formatDuration,
  monthIndex,
  monthsCrossed,
  toCalendarDate,
} from './time';

describe('calendar', () => {
  it('starts on the first day of the epoch year', () => {
    expect(toCalendarDate(0)).toEqual({ year: EPOCH_YEAR, month: 1, dayOfMonth: 1 });
    expect(formatDate(0)).toBe(`1 Jan ${EPOCH_YEAR}`);
  });

  it('rolls months and years over', () => {
    expect(toCalendarDate(DAYS_PER_MONTH)).toEqual({ year: EPOCH_YEAR, month: 2, dayOfMonth: 1 });
    expect(toCalendarDate(DAYS_PER_MONTH - 1)).toEqual({
      year: EPOCH_YEAR,
      month: 1,
      dayOfMonth: DAYS_PER_MONTH,
    });
    expect(toCalendarDate(DAYS_PER_YEAR + 45)).toEqual({
      year: EPOCH_YEAR + 1,
      month: 2,
      dayOfMonth: 16,
    });
    expect(formatDate(DAYS_PER_YEAR + 45)).toBe(`16 Feb ${EPOCH_YEAR + 1}`);
  });

  it('formats durations in the largest sensible units', () => {
    expect(formatDuration(0)).toBe('0 days');
    expect(formatDuration(1)).toBe('1 day');
    expect(formatDuration(12)).toBe('12 days');
    expect(formatDuration(DAYS_PER_MONTH)).toBe('1 month');
    expect(formatDuration(DAYS_PER_MONTH * 5 + 10)).toBe('5 months');
    expect(formatDuration(DAYS_PER_YEAR)).toBe('1 year');
    expect(formatDuration(DAYS_PER_YEAR * 2 + DAYS_PER_MONTH * 3)).toBe('2 years, 3 months');
  });

  it('counts month boundaries crossed', () => {
    expect(monthIndex(0)).toBe(0);
    expect(monthIndex(DAYS_PER_MONTH - 1)).toBe(0);
    expect(monthIndex(DAYS_PER_MONTH)).toBe(1);

    expect(monthsCrossed(0, DAYS_PER_MONTH - 1)).toBe(0);
    expect(monthsCrossed(0, DAYS_PER_MONTH)).toBe(1);
    expect(monthsCrossed(5, DAYS_PER_MONTH * 3 + 2)).toBe(3);
    expect(monthsCrossed(10, 10)).toBe(0);
    expect(monthsCrossed(50, 10)).toBe(0);
  });
});
