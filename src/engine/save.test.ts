import { describe, expect, it } from 'vitest';
import { CharacterIds, DEFAULT_NAME, JobIds, LocationIds } from '@/content';
import { BASE_MS_PER_GAME_DAY } from './journey';
import {
  createStorageAdapter,
  deserialize,
  migrate,
  SAVE_VERSION,
  serialize,
  type Migration,
  type StorageLike,
} from './save';
import { createInitialState, getRelationshipState } from './state';
import { startedState } from './testUtils';

function fakeStorage(): StorageLike & { readonly data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** What a save looked like before the protagonist, activities and contact tracking existed. */
const V1_SAVE = {
  version: 1,
  phase: 'journey',
  day: 40,
  money: 2400,
  loan: { principal: 59700, monthlyInterestRate: 0.005, monthlyPayment: 600, missedPayments: 0 },
  ship: { name: 'Threnody', baseSpeed: 1, upgrades: [] },
  location: LocationIds.halden,
  journey: {
    jobId: JobIds.haldenToMeridian,
    from: LocationIds.halden,
    to: LocationIds.meridian,
    departedOnDay: 0,
    durationDays: 127,
    elapsedMs: 40_500,
  },
  relationships: { [CharacterIds.bartender]: 45, [CharacterIds.ilse]: 10 },
  flags: [],
  completedEvents: ['evt.halden.bar.first-round'],
  log: [{ day: 0, text: 'The ship is yours, on paper.' }],
  gameOver: null,
};

describe('serialization', () => {
  it('round-trips the initial and a started state', () => {
    const fresh = createInitialState();
    expect(deserialize(serialize(fresh))).toEqual(fresh);
    const started = startedState('Juno');
    expect(deserialize(serialize(started))).toEqual(started);
  });

  it('rejects garbage, non-objects and saves from newer builds', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('42')).toBeNull();
    expect(deserialize('{"version":2}')).toBeNull();
    expect(
      deserialize(JSON.stringify({ ...createInitialState(), version: SAVE_VERSION + 1 })),
    ).toBeNull();
  });

  it('upgrades a v1 save in place, keeping its phase and progress', () => {
    const loaded = deserialize(JSON.stringify(V1_SAVE));
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.phase).toBe('journey');
    expect(loaded!.day).toBe(40);
    expect(loaded!.player.name).toBe(DEFAULT_NAME);
    expect(loaded!.journey).toMatchObject({
      jobId: JobIds.haldenToMeridian,
      elapsedMs: 40_500,
      msPerDay: BASE_MS_PER_GAME_DAY,
      activity: null,
      deliveryBonus: 0,
    });
    expect(getRelationshipState(loaded!, CharacterIds.bartender)).toEqual({
      value: 45,
      lastContactDay: null,
    });
    expect(getRelationshipState(loaded!, CharacterIds.partner)).toEqual({
      value: 70,
      lastContactDay: 0,
    });
    expect(loaded!.characters).toEqual({});
    expect(loaded!.journalPagesRead).toBe(0);
    // A migrated save round-trips unchanged.
    expect(deserialize(serialize(loaded!))).toEqual(loaded);
  });
});

describe('migrate', () => {
  const chain: Record<number, Migration> = {
    1: (raw) => ({ ...raw, renamed: raw.old, old: undefined }),
    2: (raw) => ({ ...raw, added: true }),
  };

  it('applies each step in order and stamps the new version', () => {
    const migrated = migrate({ version: 1, old: 'x' }, chain, 3);
    expect(migrated).toEqual({ version: 3, renamed: 'x', old: undefined, added: true });
  });

  it('starts from the save version, not from the beginning', () => {
    expect(migrate({ version: 2 }, chain, 3)).toEqual({ version: 3, added: true });
  });

  it('fails when a step is missing or the save is from the future', () => {
    expect(migrate({ version: 1 }, { 1: chain[1]! }, 3)).toBeNull();
    expect(migrate({ version: 4 }, chain, 3)).toBeNull();
    expect(migrate({ notAVersion: 1 }, chain, 3)).toBeNull();
  });
});

describe('storage adapter', () => {
  it('saves, loads and clears through the storage interface', () => {
    const storage = fakeStorage();
    const adapter = createStorageAdapter(storage, 'test-key');
    const state = createInitialState();

    expect(adapter.load()).toBeNull();
    adapter.save(state);
    expect(storage.data.get('test-key')).toBe(serialize(state));
    expect(adapter.load()).toEqual(state);
    adapter.clear();
    expect(adapter.load()).toBeNull();
  });

  it('swallows storage failures', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('disabled');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('disabled');
      },
    };
    const adapter = createStorageAdapter(broken);
    expect(adapter.load()).toBeNull();
    expect(() => adapter.save(createInitialState())).not.toThrow();
    expect(() => adapter.clear()).not.toThrow();
  });
});
