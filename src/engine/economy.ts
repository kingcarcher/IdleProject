import {
  allUpgrades,
  getUpgrade,
  type Credits,
  type GameDay,
  type UpgradeDef,
  type UpgradeId,
} from '@/content';
import { appendLog, type GameState, type Loan } from './state';

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
 * Settles the loan at one month boundary: interest, the automatic draft, and foreclosure.
 * Log entries are dated at the boundary so results are independent of tick granularity.
 */
export function settleMonth(state: GameState, boundaryDay: GameDay): GameState {
  const wasPaidOff = isLoanPaidOff(state.loan);
  const result = processMonth(state.money, state.loan);
  let next: GameState = { ...state, money: result.money, loan: result.loan };
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
  return next;
}

const LOAN_PAID_OFF_TEXT = 'The loan is paid off. The ship is finally yours.';

/** The amount `payLoan` would actually move: whole credits, capped by cash and by what is owed. */
export function clampPayment(state: GameState, amount: Credits): Credits {
  const payment = Math.min(Math.floor(amount), state.money, state.loan.principal);
  return Number.isFinite(payment) && payment > 0 ? payment : 0;
}

export type PaymentWarning = 'everything' | 'belowDraft';

/** Why the player might want to think twice before an extra payment, if at all. */
export function paymentWarning(state: GameState, amount: Credits): PaymentWarning | null {
  const payment = clampPayment(state, amount);
  if (payment <= 0) return null;
  if (payment >= state.money) return 'everything';
  const remaining = state.loan.principal - payment;
  if (remaining > 0 && state.money - payment < state.loan.monthlyPayment) return 'belowDraft';
  return null;
}

/** Manual extra payment; clamped to what the player has and what is still owed. */
export function payLoan(state: GameState, amount: Credits): GameState {
  const payment = clampPayment(state, amount);
  if (payment <= 0) return state;

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
