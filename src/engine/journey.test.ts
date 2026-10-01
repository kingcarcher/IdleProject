import { describe, expect, it } from 'vitest';
import {
  ActivityIds,
  CharacterIds,
  getActivity,
  getJob,
  getLocation,
  JobIds,
  journalPages,
  LocationIds,
  UpgradeIds,
} from '@/content';
import { reduce } from './actions';
import { processMonth } from './economy';
import {
  acceptJob,
  activityBlocker,
  activityProgress,
  arrivalDay,
  availableJobs,
  BASE_MS_PER_GAME_DAY,
  DILATION_PER_YEAR,
  eraDilation,
  estimateJourney,
  journeyDurationDays,
  journeyProgress,
  journeyRealDurationMs,
  journeyRemainingMs,
  journeyTotalMs,
  MAX_JOURNEY_MS,
  MIN_JOURNEY_MS,
  shipSpeed,
  startActivity,
  tickJourney,
} from './journey';
import { distanceBetween } from './map';
import { getRelationshipState } from './state';
import type { GameState } from './state';
import { startedState } from './testUtils';
import { DAYS_PER_YEAR, monthsCrossed } from './time';

const job = getJob(JobIds.haldenToMeridian);

function depart(start: GameState = startedState()): GameState {
  return acceptJob(start, JobIds.haldenToMeridian);
}

/** Real ms that moves a journey forward by `days` whole in-game days. */
function msForDays(state: GameState, days: number): number {
  return days * state.journey!.msPerDay;
}

describe('journey planning', () => {
  it('derives duration from map distance and ship speed', () => {
    const state = startedState();
    const distance = distanceBetween(getLocation(job.from), getLocation(job.to));
    expect(journeyDurationDays(job, state.ship)).toBe(Math.ceil(distance / state.ship.baseSpeed));

    const faster = { ...state.ship, upgrades: [UpgradeIds.driveCoils] };
    expect(shipSpeed(faster)).toBeGreaterThan(shipSpeed(state.ship));
    expect(journeyDurationDays(job, faster)).toBeLessThan(journeyDurationDays(job, state.ship));
  });

  it('only offers jobs departing from the current location to founded destinations', () => {
    const state = startedState();
    expect(availableJobs(state).map((candidate) => candidate.id)).toEqual([
      JobIds.haldenToMeridian,
    ]);
    expect(availableJobs({ ...state, location: LocationIds.meridian }).map((c) => c.id)).toEqual([
      JobIds.meridianToHalden,
    ]);

    const later = { ...state, day: 720 };
    expect(availableJobs(later).map((c) => c.id)).toContain(JobIds.haldenToVerge);
    expect(availableJobs(later).map((c) => c.id)).not.toContain(JobIds.haldenToKestrel);
  });

  it('starts a journey with the departure day, pacing and zero progress', () => {
    const state = depart();
    expect(state.phase).toBe('journey');
    expect(state.journey).toMatchObject({
      jobId: job.id,
      from: job.from,
      to: job.to,
      departedOnDay: 0,
      elapsedMs: 0,
      activity: null,
      deliveryBonus: 0,
    });
    expect(state.journey!.msPerDay).toBeGreaterThan(0);
    expect(state.location).toBe(job.from);
  });
});

describe('time dilation', () => {
  it('makes the outside world move faster as the years pass', () => {
    expect(eraDilation(0)).toBe(1);
    expect(eraDilation(DAYS_PER_YEAR)).toBeCloseTo(1 + DILATION_PER_YEAR);
    expect(eraDilation(DAYS_PER_YEAR * 4)).toBeGreaterThan(eraDilation(DAYS_PER_YEAR * 3));
    expect(eraDilation(-100)).toBe(1);
  });

  it('shortens the real length of a run departing later, within the clamp', () => {
    const early = journeyRealDurationMs(127, 0);
    const late = journeyRealDurationMs(127, DAYS_PER_YEAR * 4);
    expect(early).toBe(127 * BASE_MS_PER_GAME_DAY);
    expect(late).toBeLessThan(early);
    expect(journeyRealDurationMs(1, 0)).toBe(MIN_JOURNEY_MS);
    expect(journeyRealDurationMs(100_000, 0)).toBe(MAX_JOURNEY_MS);
  });

  it('freezes the pacing on the journey at departure', () => {
    const early = depart();
    const late = depart({ ...startedState(), day: DAYS_PER_YEAR * 4 });
    expect(early.journey!.durationDays).toBe(late.journey!.durationDays);
    expect(late.journey!.msPerDay).toBeLessThan(early.journey!.msPerDay);

    const estimate = estimateJourney(job, startedState());
    expect(estimate.days).toBe(early.journey!.durationDays);
    expect(estimate.realMs).toBe(journeyTotalMs(early.journey!));
  });
});

describe('tickJourney', () => {
  it('converts real milliseconds into whole in-game days', () => {
    let state = depart();
    const msPerDay = state.journey!.msPerDay;

    state = tickJourney(state, msPerDay / 2);
    expect(state.day).toBe(0);
    expect(state.journey?.elapsedMs).toBe(msPerDay / 2);

    state = tickJourney(state, msPerDay / 2 + 100);
    expect(state.day).toBe(1);
    expect(journeyProgress(state.journey!)).toBeCloseTo(
      (msPerDay + 100) / journeyTotalMs(state.journey!),
    );
    expect(journeyRemainingMs(state.journey!)).toBeCloseTo(
      journeyTotalMs(state.journey!) - msPerDay - 100,
    );
  });

  it('ignores ticks outside a journey and non-positive deltas', () => {
    const docked = startedState();
    expect(tickJourney(docked, 1000)).toBe(docked);

    const travelling = depart();
    expect(tickJourney(travelling, 0)).toBe(travelling);
    expect(tickJourney(travelling, -50)).toBe(travelling);
    expect(tickJourney(travelling, Number.NaN)).toBe(travelling);
  });

  it('arrives, moves the player, pays the job and settles loan months en route', () => {
    const start = depart();
    const duration = start.journey!.durationDays;
    const arrived = tickJourney(start, journeyTotalMs(start.journey!));

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
    const totalMs = journeyTotalMs(start.journey!);

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
    const result = tickJourney(broke, journeyTotalMs(broke.journey!));

    expect(result.phase).toBe('gameOver');
    expect(result.journey).toBeNull();
  });
});

describe('activities', () => {
  it('can only start underway, one at a time, and only if they fit before arrival', () => {
    const docked = startedState();
    expect(activityBlocker(docked, ActivityIds.maintenance)).toBe('notUnderway');

    const underway = depart();
    expect(activityBlocker(underway, ActivityIds.maintenance)).toBeNull();

    const busy = startActivity(underway, ActivityIds.maintenance);
    expect(busy.journey!.activity).toMatchObject({
      id: ActivityIds.maintenance,
      startedDay: 0,
      endsDay: getActivity(ActivityIds.maintenance).durationDays,
      target: null,
    });
    expect(activityBlocker(busy, ActivityIds.study)).toBe('busy');
    expect(startActivity(busy, ActivityIds.study)).toBe(busy);

    const nearlyThere = tickJourney(
      underway,
      msForDays(underway, arrivalDay(underway.journey!) - 3),
    );
    expect(activityBlocker(nearlyThere, ActivityIds.maintenance)).toBe('notEnoughTime');
  });

  it('letters need a reachable close one', () => {
    const underway = depart();
    expect(activityBlocker(underway, ActivityIds.writeHome)).toBe('needsTarget');
    expect(activityBlocker(underway, ActivityIds.writeHome, CharacterIds.ilse)).toBe('needsTarget');
    expect(activityBlocker(underway, ActivityIds.writeHome, CharacterIds.partner)).toBeNull();

    const gone = { ...underway, characters: { [CharacterIds.partner]: { location: null } } };
    expect(activityBlocker(gone, ActivityIds.writeHome, CharacterIds.partner)).toBe('unreachable');
  });

  it('completes on its end day, applies its effects and logs at that day', () => {
    const underway = startActivity(depart(), ActivityIds.writeHome, CharacterIds.partner);
    const activity = getActivity(ActivityIds.writeHome);
    const before = getRelationshipState(underway, CharacterIds.partner);

    const almost = tickJourney(underway, msForDays(underway, activity.durationDays) - 1);
    expect(almost.journey!.activity).not.toBeNull();
    expect(activityProgress(almost.journey!)).toBeLessThan(1);
    expect(activityProgress(almost.journey!)).toBeGreaterThan(0.9);

    const done = tickJourney(almost, 1);
    expect(done.journey!.activity).toBeNull();
    const after = getRelationshipState(done, CharacterIds.partner);
    expect(after.value).toBe(before.value + activity.target!.relationshipDelta);
    expect(after.lastContactDay).toBe(activity.durationDays);
    const entry = done.log.at(-1)!;
    expect(entry.day).toBe(activity.durationDays);
    expect(entry.text).toContain('Write home');
    expect(entry.text).toContain('Mara');
  });

  it('maintenance brings arrival forward; study raises the delivery pay', () => {
    const underway = depart();
    const originalArrival = arrivalDay(underway.journey!);

    const maintained = tickJourney(
      startActivity(underway, ActivityIds.maintenance),
      msForDays(underway, getActivity(ActivityIds.maintenance).durationDays),
    );
    expect(arrivalDay(maintained.journey!)).toBeLessThan(originalArrival);
    expect(maintained.journey!.msPerDay).toBe(underway.journey!.msPerDay);

    const studied = tickJourney(
      startActivity(underway, ActivityIds.study),
      msForDays(underway, getActivity(ActivityIds.study).durationDays),
    );
    expect(studied.journey!.deliveryBonus).toBeCloseTo(0.05);
    const arrived = tickJourney(studied, journeyTotalMs(studied.journey!));
    expect(arrived.phase).toBe('station');
    const plain = tickJourney(underway, journeyTotalMs(underway.journey!));
    expect(arrived.money - plain.money).toBe(Math.round(job.pay * 0.05));
  });

  it('reveals journal pages one at a time until the journal is full', () => {
    let state = depart();
    for (let page = 1; page <= journalPages.length; page += 1) {
      state = startActivity(state, ActivityIds.journal);
      expect(state.journey!.activity).not.toBeNull();
      state = tickJourney(state, msForDays(state, getActivity(ActivityIds.journal).durationDays));
      expect(state.journalPagesRead).toBe(page);
    }
    expect(activityBlocker(state, ActivityIds.journal)).toBe('nothingLeft');
  });

  it('keeps tick-split invariance with an activity and month boundaries in flight', () => {
    const start = startActivity(depart(), ActivityIds.maintenance);
    const totalMs = journeyTotalMs(start.journey!);

    const oneShot = tickJourney(start, totalMs);

    let chunked = start;
    let remaining = totalMs;
    while (remaining > 0) {
      const step = Math.min(remaining, 517);
      chunked = reduce(chunked, { type: 'TICK', deltaMs: step });
      remaining -= step;
    }

    expect(chunked).toEqual(oneShot);
    expect(oneShot.phase).toBe('station');
  });
});
