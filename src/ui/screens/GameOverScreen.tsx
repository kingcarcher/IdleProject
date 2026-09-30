import { formatDuration } from '@/engine';
import { Panel } from '../components/Panel';
import { useGame } from '../GameContext';

export function GameOverScreen() {
  const { state, dispatch } = useGame();

  return (
    <Panel title="Repossessed">
      <p className="prose">
        You kept the ship for {formatDuration(state.day)}. The bank keeps it now. Somewhere behind
        you, people you meant to call are going on without you.
      </p>
      <button type="button" onClick={() => dispatch({ type: 'NEW_GAME' })}>
        Start over
      </button>
    </Panel>
  );
}
