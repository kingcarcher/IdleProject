import { getLocation, type CharacterDef, type EventDef } from '@/content';
import {
  availableEvents,
  characterLocation,
  charactersHere,
  closeOnes,
  daysSinceContact,
  getRelationship,
  isCharacterHere,
} from '@/engine';
import { formatTimeAgo, roleLabel } from '../format';
import { useGame } from '../GameContext';
import { EventCard } from './EventCard';
import { Panel } from './Panel';

interface PeoplePanelProps {
  readonly title?: string;
  readonly emptyText: string;
}

/** Everyone at the current place, each with their scenes, plus where the close ones have got to. */
export function PeoplePanel({ title = 'People', emptyText }: PeoplePanelProps) {
  const { state } = useGame();
  const here = charactersHere(state);
  const events = availableEvents(state);
  const unattributed = events.filter(
    (event) => event.character === undefined || !here.some((c) => c.id === event.character),
  );
  const away = closeOnes.filter((character) => !isCharacterHere(state, character.id));

  return (
    <Panel title={title}>
      {here.length === 0 && unattributed.length === 0 && <p className="muted">{emptyText}</p>}
      {here.map((character) => (
        <PersonCard
          key={character.id}
          character={character}
          events={events.filter((event) => event.character === character.id)}
        />
      ))}
      {unattributed.length > 0 && (
        <section className="person">
          <h3 className="person__name">Around the docks</h3>
          {unattributed.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
      {away.length > 0 && (
        <section className="person person--away">
          <h3 className="person__name">Far from here</h3>
          <ul className="away">
            {away.map((character) => (
              <AwayLine key={character.id} character={character} />
            ))}
          </ul>
        </section>
      )}
    </Panel>
  );
}

function PersonCard({
  character,
  events,
}: {
  readonly character: CharacterDef;
  readonly events: readonly EventDef[];
}) {
  const { state } = useGame();
  const role = roleLabel(character.role);
  const since = daysSinceContact(state, character.id);

  return (
    <section className="person">
      <header className="person__header">
        <h3 className="person__name">
          {character.name}
          {role && <span className="person__role"> · {role}</span>}
        </h3>
        <span className="person__meta">
          rapport {getRelationship(state, character.id)}
          {since !== null && since > 0 && ` · last spoke ${formatTimeAgo(since)}`}
        </span>
      </header>
      <p className="muted">{character.description}</p>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </section>
  );
}

function AwayLine({ character }: { readonly character: CharacterDef }) {
  const { state } = useGame();
  const where = characterLocation(state, character.id);
  const since = daysSinceContact(state, character.id);

  return (
    <li className="away__line">
      <span>
        {character.name}
        <span className="person__role"> · {roleLabel(character.role)}</span>
      </span>
      <span className="person__meta">
        {where === null ? 'gone' : getLocation(where).name}
        {where !== null && since !== null && ` · last spoke ${formatTimeAgo(since)}`}
      </span>
    </li>
  );
}
