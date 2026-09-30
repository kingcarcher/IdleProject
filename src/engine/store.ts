import { reduce, type Action } from './actions';
import type { GameState } from './state';

export interface Store {
  getState(): GameState;
  dispatch(action: Action): void;
  /** Returns an unsubscribe function. Listeners fire only when the state actually changed. */
  subscribe(listener: () => void): () => void;
  /** Persists immediately if there are unsaved changes. */
  flush(): void;
}

export interface StoreOptions {
  readonly persist?: (state: GameState) => void;
  /** Minimum spacing between autosaves; the first change in a window schedules one save. */
  readonly persistIntervalMs?: number;
}

export function createStore(initialState: GameState, options: StoreOptions = {}): Store {
  const { persist, persistIntervalMs = 1000 } = options;
  let state = initialState;
  let listeners: readonly (() => void)[] = [];
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (dirty && persist) {
      dirty = false;
      persist(state);
    }
  };

  const schedulePersist = () => {
    if (!persist) return;
    dirty = true;
    if (timer === null) {
      timer = setTimeout(flush, persistIntervalMs);
    }
  };

  return {
    getState: () => state,
    dispatch(action) {
      const next = reduce(state, action);
      if (next === state) return;
      state = next;
      schedulePersist();
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((candidate) => candidate !== listener);
      };
    },
    flush,
  };
}
