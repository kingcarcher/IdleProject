import { allCharacters, CLOSE_ONE_ROLES, DEFAULT_NAME } from '@/content';
import { BASE_MS_PER_GAME_DAY } from './journey';
import { STATE_VERSION, type GameState } from './state';

/** Bump this and add a migration whenever the shape of `GameState` changes. */
export const SAVE_VERSION = STATE_VERSION;
export const SAVE_KEY = 'idle-freighter.save';

type RawSave = Record<string, unknown> & { version: number };

/** Transforms a save from version N to version N+1. Keyed by N. */
export type Migration = (raw: RawSave) => Record<string, unknown>;

export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  // v1 -> v2: named protagonist, relationship contact tracking, character whereabouts,
  // journey pacing/activities, journal. Existing saves keep their phase and skip the intro.
  1: (raw) => {
    const oldRelationships = isRecord(raw.relationships) ? raw.relationships : {};
    const relationships: Record<string, unknown> = {};
    for (const character of allCharacters) {
      const value = oldRelationships[character.id];
      relationships[character.id] = {
        value: typeof value === 'number' ? value : character.initialRelationship,
        lastContactDay: CLOSE_ONE_ROLES.includes(character.role) ? 0 : null,
      };
    }
    const journey = isRecord(raw.journey)
      ? { ...raw.journey, msPerDay: BASE_MS_PER_GAME_DAY, activity: null, deliveryBonus: 0 }
      : null;
    return {
      ...raw,
      player: { name: DEFAULT_NAME },
      relationships,
      characters: {},
      journey,
      journalPagesRead: 0,
    };
  },
};

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Brings a raw save up to `targetVersion`, one migration at a time.
 * Returns null if the save is from a newer build or a migration step is missing.
 */
export function migrate(
  raw: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): RawSave | null {
  if (!isRawSave(raw)) return null;
  let current: RawSave = raw;
  while (current.version < targetVersion) {
    const step = migrations[current.version];
    if (step === undefined) return null;
    current = { ...step(current), version: current.version + 1 };
  }
  return current.version === targetVersion ? current : null;
}

export function deserialize(json: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const migrated = migrate(parsed);
  return migrated !== null && looksLikeGameState(migrated) ? migrated : null;
}

function isRawSave(value: unknown): value is RawSave {
  return isRecord(value) && typeof value.version === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeGameState(value: RawSave): value is RawSave & GameState {
  return (
    typeof value.phase === 'string' &&
    isRecord(value.player) &&
    typeof value.player.name === 'string' &&
    typeof value.day === 'number' &&
    typeof value.money === 'number' &&
    typeof value.location === 'string' &&
    isRecord(value.loan) &&
    isRecord(value.ship) &&
    isRecord(value.relationships) &&
    isRecord(value.characters) &&
    typeof value.journalPagesRead === 'number' &&
    Array.isArray(value.flags) &&
    Array.isArray(value.completedEvents) &&
    Array.isArray(value.log)
  );
}

/** Minimal subset of the Web Storage API so the engine never imports DOM types. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveAdapter {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

export function createStorageAdapter(storage: StorageLike, key: string = SAVE_KEY): SaveAdapter {
  return {
    load() {
      try {
        const json = storage.getItem(key);
        return json === null ? null : deserialize(json);
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        storage.setItem(key, serialize(state));
      } catch {
        // Quota exceeded or storage disabled: the game keeps running unsaved.
      }
    },
    clear() {
      try {
        storage.removeItem(key);
      } catch {
        // Nothing to do if storage is unavailable.
      }
    },
  };
}
