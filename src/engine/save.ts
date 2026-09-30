import { STATE_VERSION, type GameState } from './state';

/** Bump this and add a migration whenever the shape of `GameState` changes. */
export const SAVE_VERSION = STATE_VERSION;
export const SAVE_KEY = 'idle-freighter.save';

type RawSave = Record<string, unknown> & { version: number };

/** Transforms a save from version N to version N+1. Keyed by N. */
export type Migration = (raw: RawSave) => Record<string, unknown>;

export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

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
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { version?: unknown }).version === 'number'
  );
}

function looksLikeGameState(value: RawSave): value is RawSave & GameState {
  return (
    typeof value.phase === 'string' &&
    typeof value.day === 'number' &&
    typeof value.money === 'number' &&
    typeof value.location === 'string' &&
    typeof value.loan === 'object' &&
    value.loan !== null &&
    typeof value.ship === 'object' &&
    value.ship !== null &&
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
