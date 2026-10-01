import { getLocation } from '@/content';
import { Panel } from '../components/Panel';
import { PeoplePanel } from '../components/PeoplePanel';
import { useGame } from '../GameContext';

export function BarScreen() {
  const { state, dispatch } = useGame();
  const bar = getLocation(state.location);

  return (
    <>
      <Panel
        title={bar.name}
        actions={
          <button type="button" onClick={() => dispatch({ type: 'LEAVE_BAR' })}>
            Leave
          </button>
        }
      >
        <p className="prose">{bar.description}</p>
      </Panel>

      <PeoplePanel title="At the bar" emptyText="Seven has nothing to say tonight." />
    </>
  );
}
