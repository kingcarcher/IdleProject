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
import { characterLocation } from './relationships';
import { getRelationship, getRelationshipState, type GameState } from './state';
import { startedState } from './testUtils';

const letter = getEvent(EventIds.meridianLetter);

function atMeridian(day = 0): GameState {
  return { ...startedState(), location: LocationIds.meridian, day };
}

function withRelationship(
  state: GameState,
  character: (typeof CharacterIds)[keyof typeof CharacterIds],
  value: number,
  lastContactDay: number | null = 0,
): GameState {
  return {
    ...state,
    relationships: { ...state.relationships, [character]: { value, lastContactDay } },
  };
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
  const state: GameState = withRelationship(
    {
      ...startedState(),
      money: 500,
      flags: [FlagIds.carryingLetter],
      completedEvents: [EventIds.barFirstRound],
      day: 100,
    },
    CharacterIds.ilse,
    30,
    40,
  );

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
        kind: 'relationshipAtMost',
        character: CharacterIds.ilse,
        value: 29,
      }),
    ).toBe(false);
    expect(
      evaluateCondition(state, {
        kind: 'relationshipAtLeast',
        character: CharacterIds.bartender,
        value: 100,
      }),
    ).toBe(false);
    expect(
      evaluateCondition(state, { kind: 'eventCompleted', event: EventIds.barFirstRound }),
    ).toBe(true);
    expect(
      evaluateCondition(state, { kind: 'eventNotCompleted', event: EventIds.barFirstRound }),
    ).toBe(false);
    expect(evaluateCondition(state, { kind: 'dateBetween', from: 50, until: 100 })).toBe(true);
    expect(evaluateCondition(state, { kind: 'dateBetween', from: 101, until: 200 })).toBe(false);
    expect(
      evaluateCondition(state, {
        kind: 'daysSinceContactAtLeast',
        character: CharacterIds.ilse,
        days: 60,
      }),
    ).toBe(true);
    expect(
      evaluateCondition(state, {
        kind: 'daysSinceContactAtLeast',
        character: CharacterIds.ilse,
        days: 61,
      }),
    ).toBe(false);
    expect(
      evaluateCondition(state, {
        kind: 'anyOf',
        conditions: [
          { kind: 'moneyAtLeast', amount: 9999 },
          { kind: 'flagSet', flag: FlagIds.carryingLetter },
        ],
      }),
    ).toBe(true);
    expect(evaluateCondition(state, { kind: 'anyOf', conditions: [] })).toBe(false);
  });

  it('treats never having spoken as an unbounded silence', () => {
    const never = withRelationship(startedState(), CharacterIds.ilse, 10, null);
    expect(
      evaluateCondition(never, {
        kind: 'daysSinceContactAtLeast',
        character: CharacterIds.ilse,
        days: 100_000,
      }),
    ).toBe(true);
  });
});

describe('availability', () => {
  it('lists events at the current location whose window is open and conditions hold', () => {
    const home = availableEvents(startedState()).map((event) => event.id);
    expect(home).toEqual(
      expect.arrayContaining([
        EventIds.partnerFarewell,
        EventIds.motherFarewell,
        EventIds.friendFarewell,
      ]),
    );
    expect(home).not.toContain(letter.id);
    expect(availableEvents(atMeridian()).map((event) => event.id)).toEqual([letter.id]);
  });

  it('closes and reports events once their window has passed', () => {
    const late = atMeridian(letter.availableUntil + 1);
    expect(availableEvents(late).map((event) => event.id)).not.toContain(letter.id);
    expect(missedEvents(late).map((event) => event.id)).toContain(letter.id);
    expect(missedEvents(atMeridian(letter.availableUntil))).not.toContain(letter);
  });

  it('unlocks follow-up events through flags', () => {
    const carrying = { ...startedState(), flags: [FlagIds.carryingLetter] };
    expect(availableEvents(carrying).map((event) => event.id)).toContain(
      EventIds.haldenDeliverLetter,
    );
  });

  it('lists bulletins posted here right now', () => {
    expect(availableBulletins(startedState()).length).toBeGreaterThan(0);
    expect(availableBulletins({ ...startedState(), day: 100_000 })).toEqual([]);
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

    const home = startedState();
    expect(resolveEvent(home, letter.id, 'accept')).toBe(home);
  });

  it('clamps relationships to the allowed range', () => {
    const cold = withRelationship(atMeridian(), CharacterIds.ilse, 3);
    expect(getRelationship(resolveEvent(cold, letter.id, 'decline'), CharacterIds.ilse)).toBe(0);
  });

  it('counts any scene with someone as contact and fills in the player name', () => {
    const start = { ...startedState(), day: 200 };
    const after = resolveEvent(start, EventIds.partnerNoGoodbye, 'sorry');
    expect(getRelationshipState(after, CharacterIds.partner).lastContactDay).toBe(200);

    const distant = withRelationship({ ...startedState(), day: 200 }, CharacterIds.partner, 30);
    const scene = resolveEvent(distant, EventIds.partnerReturnDistant, 'someone-else');
    expect(scene.log.at(-1)?.text).toContain('No, Test. I have been here.');
  });
});

describe('the partner arc', () => {
  it('offers the warm or distant return depending on rapport, never both', () => {
    const warm = { ...startedState(), day: 200 };
    const warmIds = availableEvents(warm).map((event) => event.id);
    expect(warmIds).toContain(EventIds.partnerReturnWarm);
    expect(warmIds).not.toContain(EventIds.partnerReturnDistant);

    const cold = withRelationship(warm, CharacterIds.partner, 40);
    const coldIds = availableEvents(cold).map((event) => event.id);
    expect(coldIds).toContain(EventIds.partnerReturnDistant);
    expect(coldIds).not.toContain(EventIds.partnerReturnWarm);
  });

  it('she leaves when rapport collapses, after long silence, or after straying', () => {
    const base = { ...startedState(), day: 400, flags: [FlagIds.saidGoodbyePartner] };

    const collapsed = withRelationship(base, CharacterIds.partner, 20);
    expect(availableEvents(collapsed).map((e) => e.id)).toContain(EventIds.partnerGoneDrift);

    const silent = withRelationship({ ...base, day: 600 }, CharacterIds.partner, 60, 0);
    expect(availableEvents(silent).map((e) => e.id)).toContain(EventIds.partnerGoneDrift);

    const strayed = withRelationship(
      { ...base, flags: [...base.flags, FlagIds.strayed] },
      CharacterIds.partner,
      45,
    );
    const ids = availableEvents(strayed).map((e) => e.id);
    expect(ids).toContain(EventIds.partnerGoneStrayed);
    expect(ids).not.toContain(EventIds.partnerGoneDrift);

    const fine = withRelationship(base, CharacterIds.partner, 60);
    const fineIds = availableEvents(fine).map((e) => e.id);
    expect(fineIds).not.toContain(EventIds.partnerGoneDrift);
    expect(fineIds).not.toContain(EventIds.partnerGoneStrayed);
  });

  it('relocates her out of reach for good once she is gone', () => {
    const collapsed = withRelationship(
      { ...startedState(), day: 400, flags: [FlagIds.saidGoodbyePartner] },
      CharacterIds.partner,
      20,
    );
    const gone = resolveEvent(collapsed, EventIds.partnerGoneDrift, 'take-box');
    expect(gone.flags).toContain(FlagIds.partnerLeft);
    expect(characterLocation(gone, CharacterIds.partner)).toBeNull();
    const ids = availableEvents(gone).map((e) => e.id);
    expect(ids).not.toContain(EventIds.partnerReturnWarm);
    expect(ids).not.toContain(EventIds.partnerReturnDistant);
    expect(ids).not.toContain(EventIds.partnerGoneStrayed);
  });
});
