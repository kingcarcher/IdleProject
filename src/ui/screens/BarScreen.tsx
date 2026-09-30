import { allCharacters, getLocation } from '@/content';
import { availableEvents, getRelationship } from '@/engine';
import { EventCard } from '../components/EventCard';
import { Panel } from '../components/Panel';
import { useGame } from '../GameContext';

export function BarScreen() {
  const { state, dispatch } = useGame();
  const bar = getLocation(state.location);
  const regulars = allCharacters.filter((character) => character.home === bar.id);
  const events = availableEvents(state);

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
        {regulars.map((character) => (
          <p key={character.id} className="muted">
            {character.name} — {character.description} (rapport{' '}
            {getRelationship(state, character.id)})
          </p>
        ))}
      </Panel>

      <Panel title="At the bar">
        {events.length === 0 && <p className="muted">Seven has nothing to say tonight.</p>}
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </Panel>
    </>
  );
}
