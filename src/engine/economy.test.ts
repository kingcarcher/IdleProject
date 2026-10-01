import { describe, expect, it } from 'vitest';
import { UpgradeIds } from '@/content';
import { advanceTo } from './clock';
import {
  buyUpgrade,
  clampPayment,
  isBankrupt,
  MAX_MISSED_PAYMENTS,
  monthlyInterest,
  payLoan,
  paymentWarning,
  processMonth,
} from './economy';
import type { Loan } from './state';
import { startedState } from './testUtils';
import { DAYS_PER_MONTH } from './time';

const loan: Loan = {
  principal: 10_000,
  monthlyInterestRate: 0.01,
  monthlyPayment: 300,
  missedPayments: 0,
};

describe('loan', () => {
  it('accrues interest then drafts the monthly payment', () => {
    expect(monthlyInterest(loan)).toBe(100);

    const result = processMonth(1000, loan);
    expect(result.money).toBe(700);
    expect(result.loan.principal).toBe(9800);
    expect(result.loan.missedPayments).toBe(0);
  });

  it('records a missed payment when funds are short, interest still compounds', () => {
    const result = processMonth(299, loan);
    expect(result.money).toBe(299);
    expect(result.loan.principal).toBe(10_100);
    expect(result.loan.missedPayments).toBe(1);
  });

  it('never drafts more than what is owed and stops once paid off', () => {
    const nearlyDone = processMonth(1000, { ...loan, principal: 100 });
    expect(nearlyDone.loan.principal).toBe(0);
    expect(nearlyDone.money).toBe(1000 - 101);

    const done = processMonth(1000, nearlyDone.loan);
    expect(done.money).toBe(1000);
    expect(done.notes).toEqual([]);
  });

  it('becomes bankrupt after the maximum number of missed payments', () => {
    let current = loan;
    for (let i = 0; i < MAX_MISSED_PAYMENTS; i += 1) {
      expect(isBankrupt(current)).toBe(false);
      current = processMonth(0, current).loan;
    }
    expect(isBankrupt(current)).toBe(true);
  });
});

describe('advanceTo', () => {
  it('settles one month per boundary crossed and dates the log at the boundary', () => {
    const start = { ...startedState(), loan, money: 1000 };
    const next = advanceTo(start, DAYS_PER_MONTH * 2 + 5);

    expect(next.day).toBe(DAYS_PER_MONTH * 2 + 5);
    expect(next.money).toBe(1000 - 300 - 300);
    expect(next.loan.principal).toBe(9800 + 98 - 300);
    const drafts = next.log.filter((entry) => entry.text.startsWith('Loan payment drafted'));
    expect(drafts.map((entry) => entry.day)).toEqual([DAYS_PER_MONTH, DAYS_PER_MONTH * 2]);
  });

  it('does nothing when time does not move forward', () => {
    const start = startedState();
    expect(advanceTo(start, 0)).toBe(start);
    expect(advanceTo({ ...start, day: 10 }, 5).day).toBe(10);
  });

  it('ends the game at the boundary where the bank forecloses', () => {
    const start = { ...startedState(), loan, money: 0 };
    const next = advanceTo(start, DAYS_PER_MONTH * 12);

    expect(next.phase).toBe('gameOver');
    expect(next.gameOver).toBe('bankrupt');
    expect(next.day).toBe(DAYS_PER_MONTH * MAX_MISSED_PAYMENTS);
    expect(next.loan.missedPayments).toBe(MAX_MISSED_PAYMENTS);
  });
});

describe('payLoan', () => {
  it('clamps extra payments to available money and remaining principal', () => {
    const start = { ...startedState(), loan, money: 500 };

    expect(payLoan(start, 800).money).toBe(0);
    expect(payLoan(start, 800).loan.principal).toBe(9500);

    const small = { ...start, loan: { ...loan, principal: 120 } };
    const paid = payLoan(small, 800);
    expect(paid.money).toBe(380);
    expect(paid.loan.principal).toBe(0);
    expect(paid.log.at(-1)?.text).toMatch(/paid off/);
  });

  it('accepts any whole number of credits, including round hundreds', () => {
    const start = { ...startedState(), loan, money: 5000 };
    expect(payLoan(start, 600).money).toBe(4400);
    expect(payLoan(start, 700).money).toBe(4300);
    expect(payLoan(start, 601.9).money).toBe(4399);
    expect(clampPayment(start, 600)).toBe(600);
    expect(clampPayment(start, 99_999)).toBe(5000);
    expect(clampPayment(start, -5)).toBe(0);
    expect(clampPayment(start, Number.NaN)).toBe(0);
  });
});

describe('paymentWarning', () => {
  const start = { ...startedState(), loan, money: 1000 };

  it('warns when the payment takes everything, even if clamped', () => {
    expect(paymentWarning(start, 1000)).toBe('everything');
    expect(paymentWarning(start, 5000)).toBe('everything');
  });

  it('warns when less than one monthly draft would be left', () => {
    expect(paymentWarning(start, 800)).toBe('belowDraft');
    expect(paymentWarning(start, 701)).toBe('belowDraft');
  });

  it('stays quiet for comfortable payments, nothing, or paying off the loan', () => {
    expect(paymentWarning(start, 700)).toBeNull();
    expect(paymentWarning(start, 0)).toBeNull();
    expect(paymentWarning(start, Number.NaN)).toBeNull();
    const almostFree = { ...start, loan: { ...loan, principal: 900 } };
    expect(paymentWarning(almostFree, 900)).toBeNull();
  });
});

describe('buyUpgrade', () => {
  it('requires the upgrade to be on the market and affordable', () => {
    const early = { ...startedState(), money: 100_000 };
    expect(buyUpgrade(early, UpgradeIds.driveCoils)).toBe(early);

    const poor = { ...early, day: 5000, money: 10 };
    expect(buyUpgrade(poor, UpgradeIds.driveCoils)).toBe(poor);

    const bought = buyUpgrade({ ...early, day: 5000 }, UpgradeIds.driveCoils);
    expect(bought.ship.upgrades).toEqual([UpgradeIds.driveCoils]);
    expect(bought.money).toBeLessThan(early.money);
    expect(buyUpgrade(bought, UpgradeIds.driveCoils)).toBe(bought);
  });
});
