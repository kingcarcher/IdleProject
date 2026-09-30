import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Action, GameState, Store } from '@/engine';

export const StoreContext = createContext<Store | null>(null);

export interface Game {
  readonly state: GameState;
  readonly dispatch: (action: Action) => void;
}

export function useGame(): Game {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error('useGame must be used inside <GameProvider>.');
  }
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { state, dispatch: store.dispatch };
}
