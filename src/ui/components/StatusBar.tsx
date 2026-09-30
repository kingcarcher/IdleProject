import { getLocation, type LocationDef } from '@/content';
import { formatDate, monthlyInterest, MAX_MISSED_PAYMENTS } from '@/engine';
import { formatMoney } from '../format';
import { useGame } from '../GameContext';

export function StatusBar() {
  const { state } = useGame();
  const here: LocationDef = getLocation(state.location);
  const whereabouts = state.journey
    ? `In transit to ${getLocation(state.journey.to).name}`
    : here.name;

  return (
    <header className="status">
      <div className="status__item">
        <span className="status__label">Date</span>
        <span className="status__value">{formatDate(state.day)}</span>
      </div>
      <div className="status__item">
        <span className="status__label">Credits</span>
        <span className="status__value">{formatMoney(state.money)}</span>
      </div>
      <div className="status__item">
        <span className="status__label">Loan</span>
        <span className="status__value">
          {formatMoney(state.loan.principal)}
          <span className="status__sub">
            {' '}
            (+{formatMoney(monthlyInterest(state.loan))}/mo, missed {state.loan.missedPayments}/
            {MAX_MISSED_PAYMENTS})
          </span>
        </span>
      </div>
      <div className="status__item">
        <span className="status__label">{state.ship.name}</span>
        <span className="status__value">{whereabouts}</span>
      </div>
    </header>
  );
}
