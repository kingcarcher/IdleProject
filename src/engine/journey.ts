import { allJobs, getJob, getLocation, getUpgrade, type JobDef, type JobId } from '@/content';
import { advanceTo } from './economy';
import { conditionsMet, isWithinWindow } from './events';
import { distanceBetween } from './map';
import { appendLog, type GameState, type Journey, type Ship } from './state';

/** Pacing constant: how many real milliseconds one in-game day of travel takes. */
export const REAL_MS_PER_GAME_DAY = 1000;

export function shipSpeed(ship: Ship): number {
  return ship.upgrades.reduce(
    (speed, upgradeId) => speed * getUpgrade(upgradeId).speedMultiplier,
    ship.baseSpeed,
  );
}

export function journeyDurationDays(job: JobDef, ship: Ship): number {
  const distance = distanceBetween(getLocation(job.from), getLocation(job.to));
  return Math.max(1, Math.ceil(distance / shipSpeed(ship)));
}

export function journeyRealDurationMs(journey: Journey): number {
  return journey.durationDays * REAL_MS_PER_GAME_DAY;
}

/** 0..1 fraction of the trip completed. */
export function journeyProgress(journey: Journey): number {
  return Math.min(1, journey.elapsedMs / journeyRealDurationMs(journey));
}

export function isJobAvailable(state: GameState, job: JobDef): boolean {
  if (job.from !== state.location) return false;
  if (job.window && !isWithinWindow(job.window, state.day)) return false;
  const destination = getLocation(job.to);
  if (destination.availableFrom !== undefined && state.day < destination.availableFrom) {
    return false;
  }
  return conditionsMet(state, job.conditions);
}

export function availableJobs(state: GameState): readonly JobDef[] {
  return allJobs.filter((job) => isJobAvailable(state, job));
}

export function acceptJob(state: GameState, jobId: JobId): GameState {
  if (state.phase !== 'station') return state;
  const job = getJob(jobId);
  if (!isJobAvailable(state, job)) return state;

  const journey: Journey = {
    jobId: job.id,
    from: job.from,
    to: job.to,
    departedOnDay: state.day,
    durationDays: journeyDurationDays(job, state.ship),
    elapsedMs: 0,
  };
  const next: GameState = { ...state, phase: 'journey', journey };
  return appendLog(
    next,
    `Departed ${getLocation(job.from).name} for ${getLocation(job.to).name} with "${job.title}".`,
  );
}

/** Advances a journey by real milliseconds; arrives and pays out when the trip completes. */
export function tickJourney(state: GameState, deltaMs: number): GameState {
  if (state.phase !== 'journey' || state.journey === null) return state;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return state;

  const journey = state.journey;
  const elapsedMs = journey.elapsedMs + deltaMs;

  if (elapsedMs >= journeyRealDurationMs(journey)) {
    return arrive(state);
  }

  const daysTravelled = Math.floor(elapsedMs / REAL_MS_PER_GAME_DAY);
  const next = advanceTo(state, journey.departedOnDay + daysTravelled);
  if (next.phase !== 'journey') return next;
  return { ...next, journey: { ...journey, elapsedMs } };
}

function arrive(state: GameState): GameState {
  const journey = state.journey;
  if (journey === null) return state;

  let next = advanceTo(state, journey.departedOnDay + journey.durationDays);
  if (next.phase !== 'journey') return next;

  const job = getJob(journey.jobId);
  next = {
    ...next,
    phase: 'station',
    location: journey.to,
    journey: null,
    money: next.money + job.pay,
  };
  return appendLog(next, `Arrived at ${getLocation(journey.to).name}. Paid ${job.pay} cr.`);
}
