import {
  allCharacters,
  CLOSE_ONE_ROLES,
  getCharacter,
  getLocation,
  type CharacterDef,
  type CharacterId,
  type GameDay,
  type LocationId,
} from '@/content';
import {
  clampRelationship,
  getRelationshipState,
  type GameState,
  type Relationship,
} from './state';
import { DAYS_PER_MONTH } from './time';

export function isCloseOne(character: CharacterDef): boolean {
  return CLOSE_ONE_ROLES.includes(character.role);
}

export const closeOnes: readonly CharacterDef[] = allCharacters.filter(isCloseOne);

/**
 * Where a character is on a given day: an explicit override (from a `relocate` effect) wins,
 * otherwise their scheduled moves, otherwise home. `null` means they are gone for good.
 */
export function characterLocation(
  state: GameState,
  character: CharacterId,
  day: GameDay = state.day,
): LocationId | null {
  const override = state.characters[character];
  if (override !== undefined) return override.location;

  const def = getCharacter(character);
  let location: LocationId | null = def.home;
  for (const move of def.moves ?? []) {
    if (move.day <= day) location = move.to;
  }
  return location;
}

/** Is the player standing where this character is (including a bar inside the same place)? */
export function isCharacterHere(state: GameState, character: CharacterId): boolean {
  if (state.phase === 'journey') return false;
  const where = characterLocation(state, character);
  if (where === null) return false;
  if (where === state.location) return true;
  const here = getLocation(state.location);
  return here.parent === where;
}

export function charactersHere(state: GameState): readonly CharacterDef[] {
  return allCharacters.filter((character) => isCharacterHere(state, character.id));
}

export function daysSinceContact(state: GameState, character: CharacterId): number | null {
  const { lastContactDay } = getRelationshipState(state, character);
  return lastContactDay === null ? null : Math.max(0, state.day - lastContactDay);
}

/** Records that the player spoke or wrote to someone, moving the relationship by `delta`. */
export function contact(
  state: GameState,
  character: CharacterId,
  delta: number,
  day: GameDay = state.day,
): GameState {
  const current = getRelationshipState(state, character);
  return {
    ...state,
    relationships: {
      ...state.relationships,
      [character]: { value: clampRelationship(current.value + delta), lastContactDay: day },
    },
  };
}

export function relocate(
  state: GameState,
  character: CharacterId,
  to: LocationId | null,
): GameState {
  return { ...state, characters: { ...state.characters, [character]: { location: to } } };
}

/**
 * Applied at every month boundary: people the player has neither visited nor written to in the
 * past month drift away a little. Returns the same reference when nothing changed.
 */
export function driftAtMonthBoundary(state: GameState, boundaryDay: GameDay): GameState {
  let updated: Partial<Record<CharacterId, Relationship>> | null = null;

  for (const character of allCharacters) {
    if (character.driftPerMonth <= 0) continue;
    if (characterLocation(state, character.id, boundaryDay) === null) continue;
    if (isCharacterHere(state, character.id)) continue;

    const current = getRelationshipState(state, character.id);
    const recentlyInTouch =
      current.lastContactDay !== null && boundaryDay - current.lastContactDay < DAYS_PER_MONTH;
    if (recentlyInTouch) continue;

    const value = clampRelationship(current.value - character.driftPerMonth);
    if (value === current.value) continue;
    updated ??= { ...state.relationships };
    updated[character.id] = { ...current, value };
  }

  return updated === null ? state : { ...state, relationships: updated };
}
