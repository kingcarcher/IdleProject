import { useState } from 'react';
import { getLocation } from '@/content';
import {
  availableBulletins,
  availableJobs,
  availableUpgrades,
  barAt,
  clampPayment,
  estimateJourney,
  formatDuration,
  monthlyInterest,
  monthsCrossed,
  paymentWarning,
} from '@/engine';
import { Panel } from '../components/Panel';
import { PeoplePanel } from '../components/PeoplePanel';
import { formatCountdown, formatMoney, formatPercent } from '../format';
import { useGame } from '../GameContext';
import { MapScreen } from './MapScreen';

export function StationScreen() {
  const { state, dispatch } = useGame();
  const [showMap, setShowMap] = useState(false);

  const here = getLocation(state.location);
  const bar = barAt(state.location);
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

      <PeoplePanel emptyText="Nobody here knows you." />

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
          const estimate = estimateJourney(job, state);
          const paymentsEnRoute = monthsCrossed(state.day, state.day + estimate.days);
          return (
            <article key={job.id} className="job">
              <h3 className="job__title">{job.title}</h3>
              <p className="prose">{job.description}</p>
              <dl className="facts">
                <dt>To</dt>
                <dd>{getLocation(job.to).name}</dd>
                <dt>Travel</dt>
                <dd>
                  {formatDuration(estimate.days)} out there · about{' '}
                  {formatCountdown(estimate.realMs)} at the console
                </dd>
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

      <BankPanel />
    </>
  );
}

const WARNING_TEXT = {
  everything:
    'This is every credit you have. The next monthly draft will bounce unless you earn before the first.',
  belowDraft: 'This leaves less than one monthly draft in your account.',
} as const;

function BankPanel() {
  const { state, dispatch } = useGame();
  const [amountText, setAmountText] = useState('500');
  const [confirming, setConfirming] = useState(false);

  const amount = Number(amountText);
  const payment = clampPayment(state, amount);
  const warning = paymentWarning(state, amount);
  const paidOff = state.loan.principal <= 0;

  const changeAmount = (value: string) => {
    setAmountText(value);
    setConfirming(false);
  };

  const submit = () => {
    if (payment <= 0) return;
    if (warning !== null && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    dispatch({ type: 'PAY_LOAN', amount: payment });
  };

  return (
    <Panel title="Bank">
      <dl className="facts">
        <dt>Outstanding</dt>
        <dd>{formatMoney(state.loan.principal)}</dd>
        <dt>Interest</dt>
        <dd>
          {formatPercent(state.loan.monthlyInterestRate, 1)} per month ·{' '}
          {formatMoney(monthlyInterest(state.loan))} next month
        </dd>
        <dt>Monthly draft</dt>
        <dd>{formatMoney(state.loan.monthlyPayment)}</dd>
      </dl>
      {paidOff ? (
        <p className="muted">Paid in full. The {state.ship.name} is yours.</p>
      ) : (
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label>
            Extra payment
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={amountText}
              onChange={(change) => changeAmount(change.target.value)}
            />
          </label>
          <button
            type="submit"
            className={confirming ? 'button--danger' : undefined}
            disabled={payment <= 0}
          >
            {confirming ? `Pay ${formatMoney(payment)} anyway` : 'Pay'}
          </button>
          {payment > 0 && payment !== Math.floor(amount) && (
            <span className="muted">You will pay {formatMoney(payment)}, all you can.</span>
          )}
          {confirming && warning !== null && (
            <span className="warning" role="alert">
              {WARNING_TEXT[warning]}
            </span>
          )}
        </form>
      )}
    </Panel>
  );
}
