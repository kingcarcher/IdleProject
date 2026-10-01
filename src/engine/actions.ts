import {
  DEFAULT_NAME,
  getLocation,
  loanSignedLog,
  MAX_NAME_LENGTH,
  type ActivityId,
  type CharacterId,
  type EventId,
  type JobId,
  type UpgradeId,
} from '@/content';
import { buyUpgrade, payLoan } from './economy';
import { resolveEvent } from './events';
import { acceptJob, startActivity, tickJourney } from './journey';
import { barAt } from './map';
import { appendLog, createInitialState, type GameState } from './state';
import { fillFromState } from './text';

export type Action =
  | { readonly type: 'BEGIN_GAME'; readonly name: string }
  | { readonly type: 'TICK'; readonly deltaMs: number }
  | { readonly type: 'ACCEPT_JOB'; readonly jobId: JobId }
  | {
      readonly type: 'START_ACTIVITY';
      readonly activityId: ActivityId;
      readonly target?: CharacterId | null;
    }
  | { readonly type: 'RESOLVE_EVENT'; readonly eventId: EventId; readonly choiceId: string }
  | { readonly type: 'PAY_LOAN'; readonly amount: number }
  | { readonly type: 'BUY_UPGRADE'; readonly upgradeId: UpgradeId }
  | { readonly type: 'ENTER_BAR' }
  | { readonly type: 'LEAVE_BAR' }
  | { readonly type: 'NEW_GAME' };

/**
 * The single place game state changes. Pure and deterministic: the same state
 * and action always produce the same result. Invalid actions return the input
 * state unchanged (by reference) so the store can skip notifying subscribers.
 */
export function reduce(state: GameState, action: Action): GameState {
  if (action.type === 'NEW_GAME') return createInitialState();
  if (state.phase === 'gameOver') return state;
  if (state.phase === 'intro') {
    return action.type === 'BEGIN_GAME' ? beginGame(state, action.name) : state;
  }

  switch (action.type) {
    case 'BEGIN_GAME':
      return state;
    case 'TICK':
      return tickJourney(state, action.deltaMs);
    case 'ACCEPT_JOB':
      return acceptJob(state, action.jobId);
    case 'START_ACTIVITY':
      return startActivity(state, action.activityId, action.target ?? null);
    case 'RESOLVE_EVENT':
      return resolveEvent(state, action.eventId, action.choiceId);
    case 'PAY_LOAN':
      return state.phase === 'station' ? payLoan(state, action.amount) : state;
    case 'BUY_UPGRADE':
      return state.phase === 'station' ? buyUpgrade(state, action.upgradeId) : state;
    case 'ENTER_BAR':
      return enterBar(state);
    case 'LEAVE_BAR':
      return leaveBar(state);
  }
}

/** Trims and collapses whitespace, caps the length, and falls back to the default name. */
export function normalizeName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
  return name.length > 0 ? name : DEFAULT_NAME;
}

function beginGame(state: GameState, rawName: string): GameState {
  const next: GameState = {
    ...state,
    phase: 'station',
    player: { name: normalizeName(rawName) },
  };
  return appendLog(next, fillFromState(next, loanSignedLog));
}

function enterBar(state: GameState): GameState {
  if (state.phase !== 'station') return state;
  const bar = barAt(state.location);
  if (bar === null) return state;
  return { ...state, phase: 'bar', location: bar.id };
}

function leaveBar(state: GameState): GameState {
  if (state.phase !== 'bar') return state;
  const bar = getLocation(state.location);
  if (bar.kind !== 'bar' || bar.parent === undefined) return state;
  return { ...state, phase: 'station', location: bar.parent };
}
