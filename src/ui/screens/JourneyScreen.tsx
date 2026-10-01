import { useState } from 'react';
import { getJob, getLocation } from '@/content';
import {
  arrivalDay,
  formatDate,
  formatDuration,
  journeyProgress,
  journeyRemainingMs,
} from '@/engine';
import { ActivityList } from '../components/ActivityList';
import { Panel } from '../components/Panel';
import { formatCountdown, formatPercent } from '../format';
import { useGame } from '../GameContext';
import { MapScreen } from './MapScreen';

export function JourneyScreen() {
  const { state } = useGame();
  const [showMap, setShowMap] = useState(false);
  const journey = state.journey;
  if (journey === null) return null;

  const job = getJob(journey.jobId);
  const progress = journeyProgress(journey);
  const daysTravelled = state.day - journey.departedOnDay;

  return (
    <>
      <Panel
        title={`Underway: ${job.title}`}
        actions={
          <button type="button" onClick={() => setShowMap((open) => !open)}>
            {showMap ? 'Close map' : 'Open map'}
          </button>
        }
      >
        <p className="prose">
          {getLocation(journey.from).name} → {getLocation(journey.to).name}
        </p>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="progress__fill" style={{ width: formatPercent(progress, 2) }} />
        </div>
        <p className="countdown" aria-live="off">
          <span className="countdown__time">{formatCountdown(journeyRemainingMs(journey))}</span>
          <span className="muted"> until arrival</span>
        </p>
        <dl className="facts">
          <dt>Out there</dt>
          <dd>
            {formatDuration(daysTravelled)} of {formatDuration(journey.durationDays)}
          </dd>
          <dt>Arrival</dt>
          <dd>{formatDate(arrivalDay(journey))}</dd>
          {journey.deliveryBonus > 0 && (
            <>
              <dt>Delivery bonus</dt>
              <dd>+{formatPercent(journey.deliveryBonus)}</dd>
            </>
          )}
        </dl>
        <p className="muted">
          The drive hums. Out there, months pass. The journey pauses while this tab is hidden.
        </p>
      </Panel>

      {showMap && <MapScreen />}

      <ActivityList />
    </>
  );
}
