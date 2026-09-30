import { allUpgrades, getUpgrade, type Credits, type UpgradeDef, type UpgradeId } from '@/content';
import { appendLog, type GameState, type Loan } from './state';
import { DAYS_PER_MONTH, monthIndex } from './time';

export const MAX_MISSED_PAYMENTS = 3;

export function monthlyInterest(loan: Loan): Credits {
  return Math.round(loan.principal * loan.monthlyInterestRate);
}

export function isLoanPaidOff(loan: Loan): boolean {
  return loan.principal <= 0;
}

export function isBankrupt(loan: Loan): boolean {
  return loan.missedPayments >= MAX_MISSED_PAYMENTS;
}

interface MonthResult {
  readonly money: Credits;
  readonly loan: Loan;
  readonly notes: readonly string[];
}

/** Accrues one month of interest, then drafts the automatic payment if funds allow. */
export function processMonth(money: Credits, loan: Loan): MonthResult {
  if (isLoanPaidOff(loan)) {
    return { money, loan, notes: [] };
  }

  const interest = monthlyInterest(loan);
  const principal = loan.principal + interest;
  const due = Math.min(loan.monthlyPayment, principal);

  if (money >= due) {
    return {
      money: money - due,
      loan: { ...loan, principal: principal - due },
      notes: [`Loan payment drafted: ${due} cr (interest ${interest} cr).`],
    };
  }

  const missedPayments = loan.missedPayments + 1;
  return {
    money,
    loan: { ...loan, principal, missedPayments },
    notes: [
      `Insufficient funds for the ${due} cr loan payment. Missed payments: ${missedPayments}/${MAX_MISSED_PAYMENTS}.`,
    ],
  };
}

/**
 * Moves the calendar forward to `toDay`, settling the loan at every month boundary crossed.
 * Log entries are dated at the boundary itself, so the result does not depend on how the
 * span was split into ticks. Ends the game at the boundary where the bank forecloses.
 */
export function advanceTo(state: GameState, toDay: number): GameState {
  if (toDay <= state.day) return state;

  const firstMonth = monthIndex(state.day) + 1;
  const lastMonth = monthIndex(toDay);
  let next: GameState = { ...state, day: toDay };

  for (let month = firstMonth; month <= lastMonth; month += 1) {
    const boundaryDay = month * DAYS_PER_MONTH;
    const wasPaidOff = isLoanPaidOff(next.loan);
    const result = processMonth(next.money, next.loan);
    next = { ...next, money: result.money, loan: result.loan };
    for (const note of result.notes) {
      next = appendLog(next, note, boundaryDay);
    }

    if (isBankrupt(result.loan)) {
      next = appendLog(
        next,
        'The bank has repossessed the ship. There is nothing left to haul.',
        boundaryDay,
      );
      return { ...next, day: boundaryDay, phase: 'gameOver', gameOver: 'bankrupt', journey: null };
    }
    if (!wasPaidOff && isLoanPaidOff(result.loan)) {
      next = appendLog(next, LOAN_PAID_OFF_TEXT, boundaryDay);
    }
  }

  return next;
}

const LOAN_PAID_OFF_TEXT = 'The loan is paid off. The ship is finally yours.';

/** Manual extra payment; clamped to what the player has and what is still owed. */
export function payLoan(state: GameState, amount: Credits): GameState {
  const payment = Math.min(Math.floor(amount), state.money, state.loan.principal);
  if (!Number.isFinite(payment) || payment <= 0) return state;

  const loan = { ...state.loan, principal: state.loan.principal - payment };
  let next: GameState = { ...state, money: state.money - payment, loan };
  next = appendLog(next, `Paid ${payment} cr toward the loan. Remaining: ${loan.principal} cr.`);
  if (isLoanPaidOff(loan)) {
    next = appendLog(next, LOAN_PAID_OFF_TEXT);
  }
  return next;
}

export function isUpgradeAvailable(state: GameState, upgrade: UpgradeDef): boolean {
  if (state.ship.upgrades.includes(upgrade.id)) return false;
  if (upgrade.availableFrom !== undefined && state.day < upgrade.availableFrom) return false;
  return (upgrade.requires ?? []).every((id) => state.ship.upgrades.includes(id));
}

export function availableUpgrades(state: GameState): readonly UpgradeDef[] {
  return allUpgrades.filter((upgrade) => isUpgradeAvailable(state, upgrade));
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const upgrade = getUpgrade(upgradeId);
  if (!isUpgradeAvailable(state, upgrade) || state.money < upgrade.cost) return state;

  const next: GameState = {
    ...state,
    money: state.money - upgrade.cost,
    ship: { ...state.ship, upgrades: [...state.ship.upgrades, upgrade.id] },
  };
  return appendLog(next, `Installed ${upgrade.name} for ${upgrade.cost} cr.`);
}
