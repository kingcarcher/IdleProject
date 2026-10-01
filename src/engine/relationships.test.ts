import { describe, expect, it } from 'vitest';
import { CharacterIds, getCharacter, LocationIds } from '@/content';
import { advanceTo } from './clock';
import {
  characterLocation,
  charactersHere,
  closeOnes,
  contact,
  daysSinceContact,
  driftAtMonthBoundary,
  isCharacterHere,
  relocate,
} from './relationships';
import { getRelationship, getRelationshipState, type GameState } from './state';
import { startedState } from './testUtils';
import { DAYS_PER_MONTH } from './time';

const mother = getCharacter(CharacterIds.mother);
const partner = getCharacter(CharacterIds.partner);

describe('whereabouts', () => {
  it('follows scheduled moves, with explicit relocations winning', () => {
    const state = startedState();
    expect(characterLocation(state, CharacterIds.friend)).toBe(LocationIds.halden);
    expect(characterLocation(state, CharacterIds.friend, 360)).toBe(LocationIds.meridian);
    expect(characterLocation({ ...state, day: 400 }, CharacterIds.friend)).toBe(
      LocationIds.meridian,
    );

    const moved = relocate(state, CharacterIds.friend, LocationIds.vergeOutpost);
    expect(characterLocation({ ...moved, day: 400 }, CharacterIds.friend)).toBe(
      LocationIds.vergeOutpost,
    );
    expect(
      characterLocation(relocate(state, CharacterIds.partner, null), CharacterIds.partner),
    ).toBe(null);
  });

  it('knows who is here, including people in the bar downstairs', () => {
    const home = startedState();
    expect(charactersHere(home).map((c) => c.id)).toEqual([
      CharacterIds.mother,
      CharacterIds.partner,
      CharacterIds.friend,
    ]);

    const inBar: GameState = { ...home, phase: 'bar', location: LocationIds.haldenBar };
    expect(isCharacterHere(inBar, CharacterIds.bartender)).toBe(true);
    expect(isCharacterHere(inBar, CharacterIds.mother)).toBe(true);

    const underway: GameState = { ...home, phase: 'journey' };
    expect(charactersHere(underway)).toEqual([]);
  });

  it('lists the close ones', () => {
    expect(closeOnes.map((c) => c.id)).toEqual([
      CharacterIds.mother,
      CharacterIds.partner,
      CharacterIds.friend,
    ]);
  });
});

describe('contact', () => {
  it('moves the relationship and stamps the day', () => {
    const state = { ...startedState(), day: 120 };
    const after = contact(state, CharacterIds.partner, -4);
    expect(getRelationshipState(after, CharacterIds.partner)).toEqual({
      value: partner.initialRelationship - 4,
      lastContactDay: 120,
    });
    expect(daysSinceContact(after, CharacterIds.partner)).toBe(0);
    expect(daysSinceContact({ ...after, day: 150 }, CharacterIds.partner)).toBe(30);
    expect(daysSinceContact(state, CharacterIds.ilse)).toBeNull();
  });
});

describe('drift', () => {
  it('fades people you have not spoken to for a month, never below zero', () => {
    const state: GameState = { ...startedState(), phase: 'journey', day: DAYS_PER_MONTH };
    const drifted = driftAtMonthBoundary(state, DAYS_PER_MONTH);
    expect(getRelationship(drifted, CharacterIds.mother)).toBe(
      mother.initialRelationship - mother.driftPerMonth,
    );
    expect(getRelationship(drifted, CharacterIds.partner)).toBe(
      partner.initialRelationship - partner.driftPerMonth,
    );
    expect(getRelationship(drifted, CharacterIds.bartender)).toBe(
      getRelationship(state, CharacterIds.bartender),
    );

    const almostGone = {
      ...state,
      relationships: {
        ...state.relationships,
        [CharacterIds.partner]: { value: 1, lastContactDay: 0 },
      },
    };
    expect(
      getRelationship(driftAtMonthBoundary(almostGone, DAYS_PER_MONTH), CharacterIds.partner),
    ).toBe(0);
  });

  it('spares people you wrote to this month, people you are with, and people who are gone', () => {
    const state: GameState = { ...startedState(), phase: 'journey', day: DAYS_PER_MONTH };

    const wrote = contact(state, CharacterIds.partner, 0, 5);
    expect(getRelationship(driftAtMonthBoundary(wrote, DAYS_PER_MONTH), CharacterIds.partner)).toBe(
      partner.initialRelationship,
    );

    const home = startedState();
    expect(driftAtMonthBoundary(home, DAYS_PER_MONTH)).toBe(home);

    const gone = relocate(state, CharacterIds.partner, null);
    expect(getRelationship(driftAtMonthBoundary(gone, DAYS_PER_MONTH), CharacterIds.partner)).toBe(
      partner.initialRelationship,
    );
  });

  it('is applied by the clock at every month boundary', () => {
    const state: GameState = { ...startedState(), phase: 'journey', money: 100_000 };
    const later = advanceTo(state, DAYS_PER_MONTH * 3 + 2);
    expect(getRelationship(later, CharacterIds.partner)).toBe(
      partner.initialRelationship - partner.driftPerMonth * 3,
    );
  });
});
