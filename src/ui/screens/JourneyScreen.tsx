import { getJob, getLocation } from '@/content';
import { formatDate, formatDuration, journeyProgress } from '@/engine';
import { Panel } from '../components/Panel';
import { formatPercent } from '../format';
import { useGame } from '../GameContext';

export function JourneyScreen() {
  const { state } = useGame();
  const journey = state.journey;
  if (journey === null) return null;

  const job = getJob(journey.jobId);
  const progress = journeyProgress(journey);
  const daysTravelled = state.day - journey.departedOnDay;
  const arrivalDay = journey.departedOnDay + journey.durationDays;

  return (
    <Panel title={`Underway: ${job.title}`}>
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
      <dl className="facts">
        <dt>Elapsed</dt>
        <dd>
          {formatDuration(daysTravelled)} of {formatDuration(journey.durationDays)}
        </dd>
        <dt>Arrival</dt>
        <dd>{formatDate(arrivalDay)}</dd>
      </dl>
      <p className="muted">
        The drive hums. Out there, months pass. The journey pauses while this tab is hidden.
      </p>
    </Panel>
  );
}
