import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialState, createStorageAdapter, createStore, type Store } from '@/engine';
import { App } from '@/ui/App';
import { GameProvider } from '@/ui/GameProvider';
import '@/ui/styles.css';

const TICK_INTERVAL_MS = 250;

const saves = createStorageAdapter(window.localStorage);
const store = createStore(saves.load() ?? createInitialState(), {
  persist: (state) => saves.save(state),
  persistIntervalMs: 1000,
});

// Save promptly when the page is being hidden or closed.
window.addEventListener('pagehide', () => store.flush());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.flush();
});

startTickLoop(store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider store={store}>
      <App />
    </GameProvider>
  </StrictMode>,
);

/**
 * Real time only advances the game during journeys and while the tab is visible.
 * Time spent hidden is dropped, so a journey pauses rather than catching up.
 */
function startTickLoop(target: Store): void {
  let last = performance.now();

  document.addEventListener('visibilitychange', () => {
    last = performance.now();
  });

  window.setInterval(() => {
    const now = performance.now();
    const deltaMs = Math.round(now - last);
    last = now;

    if (document.visibilityState !== 'visible') return;
    if (target.getState().phase !== 'journey') return;
    target.dispatch({ type: 'TICK', deltaMs });
  }, TICK_INTERVAL_MS);
}
