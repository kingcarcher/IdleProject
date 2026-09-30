import { describe, expect, it } from 'vitest';
import { CharacterIds, EventIds, FlagIds, getEvent, LocationIds } from '@/content';
import {
  availableBulletins,
  availableEvents,
  evaluateCondition,
  isExpired,
  isWithinWindow,
  missedEvents,
  resolveEvent,
} from './events';
import { createInitialState, getRelationship, type GameState } from './state';

const letter = getEvent(EventIds.meridianLetter);

function atMeridian(day = 0): GameState {
  return { ...createInitialState(), location: LocationIds.meridian, day };
}

describe('time windows', () => {
  it('are inclusive at both ends', () => {
    const window = { availableFrom: 10, availableUntil: 20 };
    expect(isWithinWindow(window, 9)).toBe(false);
    expect(isWithinWindow(window, 10)).toBe(true);
    expect(isWithinWindow(window, 20)).toBe(true);
    expect(isWithinWindow(window, 21)).toBe(false);
    expect(isExpired(window, 20)).toBe(false);
    expect(isExpired(window, 21)).toBe(true);
  });
});

describe('conditions', () => {
  const state: GameState = {
    ...createInitialState(),
    money: 500,
    flags: [FlagIds.carryingLetter],
    completedEvents: [EventIds.barFirstRound],
    relationships: { [CharacterIds.ilse]: 30 },
    day: 100,
  };

  it('evaluates every condition kind against state', () => {
    expect(evaluateCondition(state, { kind: 'flagSet', flag: FlagIds.carryingLetter })).toBe(true);
    expect(evaluateCondition(state, { kind: 'flagNotSet', flag: FlagIds.carryingLetter })).toBe(
      false,
    );
    expect(evaluateCondition(state, { kind: 'moneyAtLeast', amount: 500 })).toBe(true);
    expect(evaluateCondition(state, { kind: 'moneyAtLeast', amount: 501 })).toBe(false);
    expect(
      evaluateCondition(state, {
        kind: 'relationshipAtLeast',
        character: CharacterIds.ilse,
        value: 30,
      }),
    ).toBe(true);
    expect(
      evaluateCondition(state, {
        kind: 'relationshipAtLeast',
        character: CharacterIds.bartender,
        value: 1,
      }),
    ).toBe(false);
    expect(
      evaluateCondition(state, { kind: 'eventCompleted', event: EventIds.barFirstRound }),
    ).toBe(true);
    expect(evaluateCondition(state, { kind: 'dateBetween', from: 50, until: 100 })).toBe(true);
    expect(evaluateCondition(state, { kind: 'dateBetween', from: 101, until: 200 })).toBe(false);
  });
});

describe('availability', () => {
  it('lists events at the current location whose window is open and conditions hold', () => {
    expect(availableEvents(createInitialState()).map((event) => event.id)).toEqual([]);
    expect(availableEvents(atMeridian()).map((event) => event.id)).toEqual([letter.id]);
  });

  it('closes and reports events once their window has passed', () => {
    const late = atMeridian(letter.availableUntil + 1);
    expect(availableEvents(late)).toEqual([]);
    expect(missedEvents(late).map((event) => event.id)).toContain(letter.id);
    expect(missedEvents(atMeridian(letter.availableUntil))).not.toContain(letter);
  });

  it('unlocks follow-up events through flags', () => {
    const carrying = { ...createInitialState(), flags: [FlagIds.carryingLetter] };
    expect(availableEvents(carrying).map((event) => event.id)).toEqual([
      EventIds.haldenDeliverLetter,
    ]);
  });

  it('lists bulletins posted here right now', () => {
    expect(availableBulletins(createInitialState()).length).toBeGreaterThan(0);
    expect(availableBulletins({ ...createInitialState(), day: 100_000 })).toEqual([]);
  });
});

describe('resolveEvent', () => {
  it('applies the choice effects, completes the event and logs the outcome', () => {
    const before = atMeridian();
    const after = resolveEvent(before, letter.id, 'accept');

    expect(after.flags).toContain(FlagIds.carryingLetter);
    expect(getRelationship(after, CharacterIds.ilse)).toBe(
      getRelationship(before, CharacterIds.ilse) + 15,
    );
    expect(after.completedEvents).toEqual([letter.id]);
    expect(after.log.at(-1)?.text).toContain(letter.title);
    expect(availableEvents(after)).toEqual([]);
    expect(resolveEvent(after, letter.id, 'accept')).toBe(after);
  });

  it('rejects choices whose conditions are not met, unknown choices and wrong places', () => {
    const poor = { ...atMeridian(), money: 100 };
    expect(resolveEvent(poor, letter.id, 'pay-courier')).toBe(poor);
    expect(resolveEvent(poor, letter.id, 'nope')).toBe(poor);

    const home = createInitialState();
    expect(resolveEvent(home, letter.id, 'accept')).toBe(home);
  });

  it('clamps relationships to the allowed range', () => {
    const cold = { ...atMeridian(), relationships: { [CharacterIds.ilse]: 3 } };
    expect(getRelationship(resolveEvent(cold, letter.id, 'decline'), CharacterIds.ilse)).toBe(0);
  });
});
