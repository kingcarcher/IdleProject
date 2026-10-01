import { useState } from 'react';
import { getActivity, journalPages, type ActivityDef, type CharacterId } from '@/content';
import {
  activityBlocker,
  activityProgress,
  availableActivities,
  characterLocation,
  closeOnes,
  daysUntilArrival,
  formatDuration,
  type ActivityBlocker,
} from '@/engine';
import { formatPercent } from '../format';
import { useGame } from '../GameContext';
import { Panel } from './Panel';

const BLOCKER_TEXT: Record<ActivityBlocker, string> = {
  notUnderway: 'Only while underway.',
  busy: 'You are in the middle of something.',
  notEnoughTime: 'Not enough of the run left.',
  needsTarget: 'Choose who to write to.',
  unreachable: 'There is no address for them any more.',
  nothingLeft: 'The journal is full.',
};

/** What to do with the ship's time: the current task, or the list of things to start. */
export function ActivityList() {
  const { state } = useGame();
  const journey = state.journey;
  if (journey === null) return null;

  return (
    <Panel title="Ship's time">
      <p className="muted">{formatDuration(daysUntilArrival(state))} of the run left to fill.</p>
      {journey.activity !== null ? (
        <CurrentActivity />
      ) : (
        availableActivities(state).map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))
      )}
      {state.journalPagesRead > 0 && <Journal />}
    </Panel>
  );
}

function CurrentActivity() {
  const { state } = useGame();
  const journey = state.journey;
  if (journey === null || journey.activity === null) return null;

  const activity = getActivity(journey.activity.id);
  const progress = activityProgress(journey);
  const remaining = Math.max(0, journey.activity.endsDay - state.day);

  return (
    <article className="activity activity--current">
      <h3 className="activity__title">{activity.title}</h3>
      <p className="prose">{activity.description}</p>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="progress__fill" style={{ width: formatPercent(progress, 2) }} />
      </div>
      <p className="muted">{formatDuration(remaining)} to go.</p>
    </article>
  );
}

function ActivityRow({ activity }: { readonly activity: ActivityDef }) {
  const { state, dispatch } = useGame();
  const reachable = closeOnes.filter((c) => characterLocation(state, c.id) !== null);
  const [target, setTarget] = useState<CharacterId | null>(reachable[0]?.id ?? null);
  const blocker = activityBlocker(state, activity.id, target);

  return (
    <article className="activity">
      <div className="activity__header">
        <h3 className="activity__title">{activity.title}</h3>
        <span className="person__meta">{formatDuration(activity.durationDays)}</span>
      </div>
      <p className="prose">{activity.description}</p>
      <div className="inline-form">
        {activity.target !== undefined && (
          <label>
            To
            <select
              value={target ?? ''}
              onChange={(change) => setTarget((change.target.value as CharacterId) || null)}
            >
              {reachable.length === 0 && <option value="">Nobody left to write to</option>}
              {reachable.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={blocker !== null}
          onClick={() => dispatch({ type: 'START_ACTIVITY', activityId: activity.id, target })}
        >
          Start
        </button>
        {blocker !== null && blocker !== 'busy' && (
          <span className="muted">{BLOCKER_TEXT[blocker]}</span>
        )}
      </div>
    </article>
  );
}

function Journal() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const pages = journalPages.slice(0, state.journalPagesRead);
  const latest = pages.at(-1);

  return (
    <section className="journal">
      <header className="activity__header">
        <h3 className="activity__title">Journal</h3>
        <button type="button" className="button--quiet" onClick={() => setOpen((o) => !o)}>
          {open ? 'Show latest only' : `Read all ${pages.length}`}
        </button>
      </header>
      {(open ? pages : latest ? [latest] : []).map((page, index) => (
        <p key={open ? index : pages.length - 1} className="prose journal__page">
          {page}
        </p>
      ))}
    </section>
  );
}
