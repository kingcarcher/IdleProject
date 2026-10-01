import type { GameDay } from '@/content';
import { settleMonth } from './economy';
import { driftAtMonthBoundary } from './relationships';
import type { GameState } from './state';
import { DAYS_PER_MONTH, monthIndex } from './time';

/**
 * Moves the calendar forward to `toDay`, settling everything that happens at each month
 * boundary crossed: the loan draft, then relationship drift. Effects are dated at the boundary
 * itself, so the result does not depend on how the span was split into ticks. Stops at the
 * boundary where the bank forecloses.
 */
export function advanceTo(state: GameState, toDay: GameDay): GameState {
  if (toDay <= state.day) return state;

  const firstMonth = monthIndex(state.day) + 1;
  const lastMonth = monthIndex(toDay);
  let next: GameState = { ...state, day: toDay };

  for (let month = firstMonth; month <= lastMonth; month += 1) {
    const boundaryDay = month * DAYS_PER_MONTH;
    next = settleMonth(next, boundaryDay);
    if (next.phase === 'gameOver') return next;
    next = driftAtMonthBoundary(next, boundaryDay);
  }

  return next;
}
