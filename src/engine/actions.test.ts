import { describe, expect, it } from 'vitest';
import { DEFAULT_NAME, EventIds, JobIds, LocationIds, MAX_NAME_LENGTH } from '@/content';
import { normalizeName, reduce, type Action } from './actions';
import { createInitialState, type GameState } from './state';
import { startedState } from './testUtils';

function run(actions: readonly Action[], start: GameState = startedState()): GameState {
  return actions.reduce(reduce, start);
}

describe('intro', () => {
  it('starts every new game in the intro with the default name', () => {
    const fresh = createInitialState();
    expect(fresh.phase).toBe('intro');
    expect(fresh.player.name).toBe(DEFAULT_NAME);
    expect(fresh.log).toEqual([]);
  });

  it('only lets BEGIN_GAME and NEW_GAME through while in the intro', () => {
    const fresh = createInitialState();
    expect(reduce(fresh, { type: 'ENTER_BAR' })).toBe(fresh);
    expect(reduce(fresh, { type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian })).toBe(fresh);
    expect(reduce(fresh, { type: 'TICK', deltaMs: 1000 })).toBe(fresh);

    const started = reduce(fresh, { type: 'BEGIN_GAME', name: '  Juno  Vale ' });
    expect(started.phase).toBe('station');
    expect(started.player.name).toBe('Juno Vale');
    expect(started.location).toBe(LocationIds.halden);
    expect(started.log.at(-1)?.text).toContain('Juno Vale signs for the Threnody');

    expect(reduce(started, { type: 'BEGIN_GAME', name: 'Again' })).toBe(started);
  });

  it('normalizes names: trims, collapses, caps, and falls back to the default', () => {
    expect(normalizeName('')).toBe(DEFAULT_NAME);
    expect(normalizeName('   ')).toBe(DEFAULT_NAME);
    expect(normalizeName('  a   b ')).toBe('a b');
    expect(normalizeName('x'.repeat(MAX_NAME_LENGTH + 10))).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe('reduce', () => {
  it('is deterministic: the same action sequence yields deep-equal states', () => {
    const script: Action[] = [
      { type: 'RESOLVE_EVENT', eventId: EventIds.partnerFarewell, choiceId: 'promise-write' },
      { type: 'ENTER_BAR' },
      { type: 'RESOLVE_EVENT', eventId: EventIds.barFirstRound, choiceId: 'drink' },
      { type: 'LEAVE_BAR' },
      { type: 'PAY_LOAN', amount: 250 },
      { type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian },
      { type: 'TICK', deltaMs: 4_000 },
      { type: 'START_ACTIVITY', activityId: 'act.write-home', target: 'chr.partner' },
      { type: 'TICK', deltaMs: 40_000 },
      { type: 'TICK', deltaMs: 333 },
      { type: 'START_ACTIVITY', activityId: 'act.maintenance' },
      { type: 'TICK', deltaMs: 200_000 },
      { type: 'RESOLVE_EVENT', eventId: EventIds.meridianLetter, choiceId: 'accept' },
    ];

    const first = run(script);
    const second = run(script);

    expect(first).toEqual(second);
    expect(first.location).toBe(LocationIds.meridian);
    expect(first.completedEvents).toContain(EventIds.meridianLetter);
    expect(first.log.some((entry) => entry.text.startsWith('Write home'))).toBe(true);
  });

  it('returns the same state reference for actions that do not apply', () => {
    const state = startedState();

    expect(reduce(state, { type: 'TICK', deltaMs: 1000 })).toBe(state);
    expect(reduce(state, { type: 'LEAVE_BAR' })).toBe(state);
    expect(reduce(state, { type: 'ACCEPT_JOB', jobId: JobIds.meridianToHalden })).toBe(state);
    expect(reduce(state, { type: 'PAY_LOAN', amount: 0 })).toBe(state);
    expect(reduce(state, { type: 'PAY_LOAN', amount: Number.NaN })).toBe(state);
    expect(reduce(state, { type: 'START_ACTIVITY', activityId: 'act.maintenance' })).toBe(state);
  });

  it('moves between a location and its bar', () => {
    const inBar = reduce(startedState(), { type: 'ENTER_BAR' });
    expect(inBar.phase).toBe('bar');
    expect(inBar.location).toBe(LocationIds.haldenBar);

    const back = reduce(inBar, { type: 'LEAVE_BAR' });
    expect(back.phase).toBe('station');
    expect(back.location).toBe(LocationIds.halden);

    expect(reduce(inBar, { type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian })).toBe(inBar);
  });

  it('ignores everything but NEW_GAME once the game is over', () => {
    const over: GameState = { ...startedState(), phase: 'gameOver', gameOver: 'bankrupt' };

    expect(reduce(over, { type: 'ENTER_BAR' })).toBe(over);
    expect(reduce(over, { type: 'NEW_GAME' })).toEqual(createInitialState());
  });
});
