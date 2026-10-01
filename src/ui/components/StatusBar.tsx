import { getLocation, type LocationDef } from '@/content';
import { formatDate, monthlyInterest, MAX_MISSED_PAYMENTS } from '@/engine';
import { formatMoney, formatPercent } from '../format';
import { useGame } from '../GameContext';

interface StatusBarProps {
  readonly helpOpen: boolean;
  readonly onToggleHelp: () => void;
}

export function StatusBar({ helpOpen, onToggleHelp }: StatusBarProps) {
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
            {formatPercent(state.loan.monthlyInterestRate, 1)}/mo · +
            {formatMoney(monthlyInterest(state.loan))} next · missed {state.loan.missedPayments}/
            {MAX_MISSED_PAYMENTS}
          </span>
        </span>
      </div>
      <div className="status__item">
        <span className="status__label">
          {state.player.name} · {state.ship.name}
        </span>
        <span className="status__value">{whereabouts}</span>
      </div>
      <button
        type="button"
        className="status__help"
        aria-expanded={helpOpen}
        aria-label={helpOpen ? 'Close help' : 'Open help'}
        onClick={onToggleHelp}
      >
        ?
      </button>
    </header>
  );
}
