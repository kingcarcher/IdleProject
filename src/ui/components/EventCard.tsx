import type { EventDef } from '@/content';
import { conditionsMet, fillFromState } from '@/engine';
import { useGame } from '../GameContext';
import { ChoiceList } from './ChoiceList';

interface EventCardProps {
  readonly event: EventDef;
}

export function EventCard({ event }: EventCardProps) {
  const { state, dispatch } = useGame();

  return (
    <article className="event">
      <h3 className="event__title">{event.title}</h3>
      <p className="event__text">{fillFromState(state, event.text)}</p>
      <ChoiceList
        choices={event.choices.map((choice) => ({
          id: choice.id,
          label: fillFromState(state, choice.label),
          disabled: !conditionsMet(state, choice.conditions),
        }))}
        onChoose={(choiceId) => dispatch({ type: 'RESOLVE_EVENT', eventId: event.id, choiceId })}
      />
    </article>
  );
}
