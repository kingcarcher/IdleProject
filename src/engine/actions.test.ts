import { describe, expect, it } from 'vitest';
import { EventIds, JobIds, LocationIds } from '@/content';
import { reduce, type Action } from './actions';
import { createInitialState, type GameState } from './state';

function run(actions: readonly Action[], start: GameState = createInitialState()): GameState {
  return actions.reduce(reduce, start);
}

describe('reduce', () => {
  it('is deterministic: the same action sequence yields deep-equal states', () => {
    const script: Action[] = [
      { type: 'ENTER_BAR' },
      { type: 'RESOLVE_EVENT', eventId: EventIds.barFirstRound, choiceId: 'drink' },
      { type: 'LEAVE_BAR' },
      { type: 'PAY_LOAN', amount: 250 },
      { type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian },
      { type: 'TICK', deltaMs: 40_000 },
      { type: 'TICK', deltaMs: 333 },
      { type: 'TICK', deltaMs: 200_000 },
      { type: 'RESOLVE_EVENT', eventId: EventIds.meridianLetter, choiceId: 'accept' },
    ];

    const first = run(script);
    const second = run(script);

    expect(first).toEqual(second);
    expect(first.location).toBe(LocationIds.meridian);
    expect(first.completedEvents).toContain(EventIds.meridianLetter);
  });

  it('returns the same state reference for actions that do not apply', () => {
    const state = createInitialState();

    expect(reduce(state, { type: 'TICK', deltaMs: 1000 })).toBe(state);
    expect(reduce(state, { type: 'LEAVE_BAR' })).toBe(state);
    expect(reduce(state, { type: 'ACCEPT_JOB', jobId: JobIds.meridianToHalden })).toBe(state);
    expect(reduce(state, { type: 'PAY_LOAN', amount: 0 })).toBe(state);
    expect(reduce(state, { type: 'PAY_LOAN', amount: Number.NaN })).toBe(state);
  });

  it('moves between a location and its bar', () => {
    const inBar = reduce(createInitialState(), { type: 'ENTER_BAR' });
    expect(inBar.phase).toBe('bar');
    expect(inBar.location).toBe(LocationIds.haldenBar);

    const back = reduce(inBar, { type: 'LEAVE_BAR' });
    expect(back.phase).toBe('station');
    expect(back.location).toBe(LocationIds.halden);

    expect(reduce(inBar, { type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian })).toBe(inBar);
  });

  it('ignores everything but NEW_GAME once the game is over', () => {
    const over: GameState = { ...createInitialState(), phase: 'gameOver', gameOver: 'bankrupt' };

    expect(reduce(over, { type: 'ENTER_BAR' })).toBe(over);
    expect(reduce(over, { type: 'NEW_GAME' })).toEqual(createInitialState());
  });
});
