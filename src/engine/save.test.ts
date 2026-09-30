import { describe, expect, it } from 'vitest';
import {
  createStorageAdapter,
  deserialize,
  migrate,
  SAVE_VERSION,
  serialize,
  type Migration,
  type StorageLike,
} from './save';
import { createInitialState } from './state';

function fakeStorage(): StorageLike & { readonly data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('serialization', () => {
  it('round-trips the initial state', () => {
    const state = createInitialState();
    expect(deserialize(serialize(state))).toEqual(state);
  });

  it('rejects garbage, non-objects and saves from newer builds', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('42')).toBeNull();
    expect(deserialize('{"version":1}')).toBeNull();
    expect(
      deserialize(JSON.stringify({ ...createInitialState(), version: SAVE_VERSION + 1 })),
    ).toBeNull();
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
