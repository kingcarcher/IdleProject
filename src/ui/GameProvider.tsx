import type { ReactNode } from 'react';
import type { Store } from '@/engine';
import { StoreContext } from './GameContext';

interface GameProviderProps {
  readonly store: Store;
  readonly children: ReactNode;
}

export function GameProvider({ store, children }: GameProviderProps) {
  return <StoreContext value={store}>{children}</StoreContext>;
}
