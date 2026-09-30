import { describe, expect, it } from 'vitest';
import { getJob, getLocation, JobIds, LocationIds, UpgradeIds } from '@/content';
import { reduce } from './actions';
import { processMonth } from './economy';
import {
  acceptJob,
  availableJobs,
  journeyDurationDays,
  journeyProgress,
  REAL_MS_PER_GAME_DAY,
  shipSpeed,
  tickJourney,
} from './journey';
import { distanceBetween } from './map';
import { createInitialState, type GameState } from './state';
import { monthsCrossed } from './time';

const job = getJob(JobIds.haldenToMeridian);

function depart(): GameState {
  return acceptJob(createInitialState(), JobIds.haldenToMeridian);
}

describe('journey planning', () => {
  it('derives duration from map distance and ship speed', () => {
    const state = createInitialState();
    const distance = distanceBetween(getLocation(job.from), getLocation(job.to));
    expect(journeyDurationDays(job, state.ship)).toBe(Math.ceil(distance / state.ship.baseSpeed));

    const faster = { ...state.ship, upgrades: [UpgradeIds.driveCoils] };
    expect(shipSpeed(faster)).toBeGreaterThan(shipSpeed(state.ship));
    expect(journeyDurationDays(job, faster)).toBeLessThan(journeyDurationDays(job, state.ship));
  });

  it('only offers jobs departing from the current location', () => {
    const state = createInitialState();
    expect(availableJobs(state).map((candidate) => candidate.id)).toEqual([
      JobIds.haldenToMeridian,
    ]);
    expect(availableJobs({ ...state, location: LocationIds.meridian }).map((c) => c.id)).toEqual([
      JobIds.meridianToHalden,
    ]);
  });

  it('starts a journey with the departure day and zero progress', () => {
    const state = depart();
    expect(state.phase).toBe('journey');
    expect(state.journey).toMatchObject({
      jobId: job.id,
      from: job.from,
      to: job.to,
      departedOnDay: 0,
      elapsedMs: 0,
    });
    expect(state.location).toBe(job.from);
  });
});

describe('tickJourney', () => {
  it('converts real milliseconds into whole in-game days', () => {
    let state = depart();

    state = tickJourney(state, REAL_MS_PER_GAME_DAY / 2);
    expect(state.day).toBe(0);
    expect(state.journey?.elapsedMs).toBe(REAL_MS_PER_GAME_DAY / 2);

    state = tickJourney(state, REAL_MS_PER_GAME_DAY / 2 + 100);
    expect(state.day).toBe(1);
    expect(journeyProgress(state.journey!)).toBeCloseTo(
      (REAL_MS_PER_GAME_DAY + 100) / (state.journey!.durationDays * REAL_MS_PER_GAME_DAY),
    );
  });

  it('ignores ticks outside a journey and non-positive deltas', () => {
    const docked = createInitialState();
    expect(tickJourney(docked, 1000)).toBe(docked);

    const travelling = depart();
    expect(tickJourney(travelling, 0)).toBe(travelling);
    expect(tickJourney(travelling, -50)).toBe(travelling);
    expect(tickJourney(travelling, Number.NaN)).toBe(travelling);
  });

  it('arrives, moves the player, pays the job and settles loan months en route', () => {
    const start = depart();
    const duration = start.journey!.durationDays;
    const arrived = tickJourney(start, duration * REAL_MS_PER_GAME_DAY);

    expect(arrived.phase).toBe('station');
    expect(arrived.journey).toBeNull();
    expect(arrived.location).toBe(job.to);
    expect(arrived.day).toBe(duration);

    let money = start.money;
    let loan = start.loan;
    for (let i = 0; i < monthsCrossed(0, duration); i += 1) {
      const result = processMonth(money, loan);
      money = result.money;
      loan = result.loan;
    }
    expect(arrived.money).toBe(money + job.pay);
    expect(arrived.loan).toEqual(loan);
    expect(arrived.log.at(-1)?.text).toContain(getLocation(job.to).name);
  });

  it('produces the same end state regardless of how ticks are split', () => {
    const start = depart();
    const totalMs = start.journey!.durationDays * REAL_MS_PER_GAME_DAY;

    const oneShot = tickJourney(start, totalMs);

    let chunked = start;
    let remaining = totalMs;
    while (remaining > 0) {
      const step = Math.min(remaining, 733);
      chunked = reduce(chunked, { type: 'TICK', deltaMs: step });
      remaining -= step;
    }

    expect(chunked).toEqual(oneShot);
  });

  it('ends the game mid-journey when payments are missed', () => {
    const broke: GameState = { ...depart(), money: 0 };
    const total = broke.journey!.durationDays * REAL_MS_PER_GAME_DAY;
    const result = tickJourney(broke, total);

    expect(result.phase).toBe('gameOver');
    expect(result.journey).toBeNull();
  });
});
