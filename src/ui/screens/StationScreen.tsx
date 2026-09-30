import { useState } from 'react';
import { getLocation } from '@/content';
import {
  availableBulletins,
  availableEvents,
  availableJobs,
  availableUpgrades,
  barAt,
  formatDuration,
  journeyDurationDays,
  monthsCrossed,
} from '@/engine';
import { EventCard } from '../components/EventCard';
import { Panel } from '../components/Panel';
import { formatMoney } from '../format';
import { useGame } from '../GameContext';
import { MapScreen } from './MapScreen';

export function StationScreen() {
  const { state, dispatch } = useGame();
  const [showMap, setShowMap] = useState(false);
  const [payment, setPayment] = useState(500);

  const here = getLocation(state.location);
  const bar = barAt(state.location);
  const events = availableEvents(state);
  const bulletins = availableBulletins(state);
  const jobs = availableJobs(state);
  const upgrades = availableUpgrades(state);

  return (
    <>
      <Panel
        title={here.name}
        actions={
          <>
            {bar && (
              <button type="button" onClick={() => dispatch({ type: 'ENTER_BAR' })}>
                Enter {bar.name}
              </button>
            )}
            <button type="button" onClick={() => setShowMap((open) => !open)}>
              {showMap ? 'Close map' : 'Open map'}
            </button>
          </>
        }
      >
        <p className="prose">{here.description}</p>
      </Panel>

      {showMap && <MapScreen />}

      {events.length > 0 && (
        <Panel title="People">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </Panel>
      )}

      {bulletins.length > 0 && (
        <Panel title="Bulletins">
          {bulletins.map((bulletin) => (
            <article key={bulletin.id} className="bulletin">
              <h3 className="bulletin__headline">{bulletin.headline}</h3>
              <p className="prose">{bulletin.body}</p>
            </article>
          ))}
        </Panel>
      )}

      <Panel title="Freight board">
        {jobs.length === 0 && <p className="muted">No contracts are posted right now.</p>}
        {jobs.map((job) => {
          const days = journeyDurationDays(job, state.ship);
          const paymentsEnRoute = monthsCrossed(state.day, state.day + days);
          return (
            <article key={job.id} className="job">
              <h3 className="job__title">{job.title}</h3>
              <p className="prose">{job.description}</p>
              <dl className="facts">
                <dt>To</dt>
                <dd>{getLocation(job.to).name}</dd>
                <dt>Travel</dt>
                <dd>{formatDuration(days)}</dd>
                <dt>Pay on delivery</dt>
                <dd>{formatMoney(job.pay)}</dd>
                <dt>Loan drafts en route</dt>
                <dd>
                  {paymentsEnRoute} × {formatMoney(state.loan.monthlyPayment)}
                </dd>
              </dl>
              <button type="button" onClick={() => dispatch({ type: 'ACCEPT_JOB', jobId: job.id })}>
                Accept contract
              </button>
            </article>
          );
        })}
      </Panel>

      <Panel title="Shipyard">
        {upgrades.length === 0 && <p className="muted">Nothing new on the market yet.</p>}
        {upgrades.map((upgrade) => (
          <article key={upgrade.id} className="upgrade">
            <h3 className="upgrade__title">{upgrade.name}</h3>
            <p className="prose">{upgrade.description}</p>
            <button
              type="button"
              disabled={state.money < upgrade.cost}
              onClick={() => dispatch({ type: 'BUY_UPGRADE', upgradeId: upgrade.id })}
            >
              Install for {formatMoney(upgrade.cost)}
            </button>
          </article>
        ))}
      </Panel>

      <Panel title="Bank">
        <dl className="facts">
          <dt>Outstanding</dt>
          <dd>{formatMoney(state.loan.principal)}</dd>
          <dt>Monthly draft</dt>
          <dd>{formatMoney(state.loan.monthlyPayment)}</dd>
        </dl>
        <form
          className="inline-form"
          onSubmit={(submit) => {
            submit.preventDefault();
            dispatch({ type: 'PAY_LOAN', amount: payment });
          }}
        >
          <label>
            Extra payment
            <input
              type="number"
              min={1}
              step={100}
              value={payment}
              onChange={(change) => setPayment(Number(change.target.value))}
            />
          </label>
          <button type="submit" disabled={payment <= 0 || state.money <= 0}>
            Pay
          </button>
        </form>
      </Panel>
    </>
  );
}
