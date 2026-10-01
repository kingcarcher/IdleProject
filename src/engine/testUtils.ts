import { reduce } from './actions';
import { createInitialState, type GameState } from './state';

/** A fresh game that has already been through the intro and is standing on Halden. */
export function startedState(name = 'Test'): GameState {
  return reduce(createInitialState(), { type: 'BEGIN_GAME', name });
}
