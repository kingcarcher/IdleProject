import {
  allActivities,
  allJobs,
  getActivity,
  getCharacter,
  getJob,
  getLocation,
  getUpgrade,
  journalPages,
  type ActivityDef,
  type ActivityId,
  type CharacterId,
  type Effect,
  type GameDay,
  type JobDef,
  type JobId,
} from '@/content';
import { advanceTo } from './clock';
import { applyEffects, conditionsMet, isWithinWindow } from './events';
import { distanceBetween } from './map';
import { characterLocation, contact, isCloseOne } from './relationships';
import { appendLog, type ActivityProgress, type GameState, type Journey, type Ship } from './state';
import { fillFromState } from './text';
import { DAYS_PER_YEAR } from './time';

/** Real milliseconds one in-game day of travel takes at the start of the game. */
export const BASE_MS_PER_GAME_DAY = 1000;
/** How much faster the outside world moves per elapsed year as drives improve. */
export const DILATION_PER_YEAR = 0.5;
/** Every run, however short or long in in-game days, lands inside this real-time band. */
export const MIN_JOURNEY_MS = 45_000;
export const MAX_JOURNEY_MS = 360_000;

/** In-game days that pass per unit of ship time, growing with the era's drive technology. */
export function eraDilation(day: GameDay): number {
  return 1 + (DILATION_PER_YEAR * Math.max(0, day)) / DAYS_PER_YEAR;
}

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

/** Real length of a run of `durationDays` departing on `departedOnDay`. */
export function journeyRealDurationMs(durationDays: number, departedOnDay: GameDay): number {
  const raw = (durationDays * BASE_MS_PER_GAME_DAY) / eraDilation(departedOnDay);
  return Math.round(Math.min(MAX_JOURNEY_MS, Math.max(MIN_JOURNEY_MS, raw)));
}

export interface JourneyEstimate {
  readonly days: number;
  readonly realMs: number;
  readonly msPerDay: number;
}

export function estimateJourney(job: JobDef, state: GameState): JourneyEstimate {
  const days = journeyDurationDays(job, state.ship);
  const realMs = journeyRealDurationMs(days, state.day);
  return { days, realMs, msPerDay: realMs / days };
}

export function journeyTotalMs(journey: Journey): number {
  return journey.durationDays * journey.msPerDay;
}

/** 0..1 fraction of the trip completed. */
export function journeyProgress(journey: Journey): number {
  return Math.min(1, journey.elapsedMs / journeyTotalMs(journey));
}

export function journeyRemainingMs(journey: Journey): number {
  return Math.max(0, journeyTotalMs(journey) - journey.elapsedMs);
}

export function arrivalDay(journey: Journey): GameDay {
  return journey.departedOnDay + journey.durationDays;
}

/** In-game day reached after `elapsedMs` of travel, never past arrival. */
function dayAt(journey: Journey, elapsedMs: number): GameDay {
  const days = Math.floor(elapsedMs / journey.msPerDay);
  return journey.departedOnDay + Math.min(journey.durationDays, days);
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

  const { days, msPerDay } = estimateJourney(job, state);
  const journey: Journey = {
    jobId: job.id,
    from: job.from,
    to: job.to,
    departedOnDay: state.day,
    durationDays: days,
    elapsedMs: 0,
    msPerDay,
    activity: null,
    deliveryBonus: 0,
  };
  const next: GameState = { ...state, phase: 'journey', journey };
  return appendLog(
    next,
    `Departed ${getLocation(job.from).name} for ${getLocation(job.to).name} with "${job.title}".`,
  );
}

/**
 * Advances a journey by real milliseconds. Finishes an activity whose end day is reached before
 * moving past it, then arrives and pays out when the trip completes.
 */
export function tickJourney(state: GameState, deltaMs: number): GameState {
  if (state.phase !== 'journey' || state.journey === null) return state;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return state;

  const elapsedMs = state.journey.elapsedMs + deltaMs;
  let journey: Journey = { ...state.journey, elapsedMs };
  let next: GameState = { ...state, journey };

  const activity = journey.activity;
  if (activity !== null && dayAt(journey, elapsedMs) >= activity.endsDay) {
    next = advanceTo(next, activity.endsDay);
    if (next.phase !== 'journey' || next.journey === null) return next;
    next = completeActivity(next);
    if (next.journey === null) return next;
    journey = next.journey;
  }

  if (elapsedMs >= journeyTotalMs(journey)) return arrive(next);
  return advanceTo(next, dayAt(journey, elapsedMs));
}

function arrive(state: GameState): GameState {
  const journey = state.journey;
  if (journey === null) return state;

  let next = advanceTo(state, arrivalDay(journey));
  if (next.phase !== 'journey') return next;

  const job = getJob(journey.jobId);
  const pay = Math.round(job.pay * (1 + journey.deliveryBonus));
  next = {
    ...next,
    phase: 'station',
    location: journey.to,
    journey: null,
    money: next.money + pay,
  };
  const bonusNote =
    journey.deliveryBonus > 0
      ? ` (including ${Math.round(journey.deliveryBonus * 100)}% for clean paperwork)`
      : '';
  return appendLog(next, `Arrived at ${getLocation(journey.to).name}. Paid ${pay} cr${bonusNote}.`);
}

// ---------------------------------------------------------------------------
// Activities: things to do with the ship's time while underway.

export type ActivityBlocker =
  'notUnderway' | 'busy' | 'notEnoughTime' | 'needsTarget' | 'unreachable' | 'nothingLeft';

export function daysUntilArrival(state: GameState): number {
  return state.journey === null ? 0 : arrivalDay(state.journey) - state.day;
}

/** Why an activity cannot start right now, or null if it can. */
export function activityBlocker(
  state: GameState,
  activityId: ActivityId,
  target: CharacterId | null = null,
): ActivityBlocker | null {
  if (state.phase !== 'journey' || state.journey === null) return 'notUnderway';
  if (state.journey.activity !== null) return 'busy';

  const activity = getActivity(activityId);
  if (activity.durationDays > daysUntilArrival(state)) return 'notEnoughTime';
  if (hasEffect(activity, 'journal') && state.journalPagesRead >= journalPages.length) {
    return 'nothingLeft';
  }
  if (activity.target !== undefined) {
    if (target === null || !isCloseOne(getCharacter(target))) return 'needsTarget';
    if (characterLocation(state, target) === null) return 'unreachable';
  }
  return null;
}

export function availableActivities(state: GameState): readonly ActivityDef[] {
  return state.phase === 'journey' ? allActivities : [];
}

export function startActivity(
  state: GameState,
  activityId: ActivityId,
  target: CharacterId | null = null,
): GameState {
  if (activityBlocker(state, activityId, target) !== null || state.journey === null) return state;

  const activity = getActivity(activityId);
  const progress: ActivityProgress = {
    id: activityId,
    startedDay: state.day,
    endsDay: state.day + activity.durationDays,
    target: activity.target === undefined ? null : target,
  };
  return { ...state, journey: { ...state.journey, activity: progress } };
}

/** 0..1 fraction of the current activity done, smooth within a day. */
export function activityProgress(journey: Journey): number {
  const activity = journey.activity;
  if (activity === null) return 0;
  const travelledDays = journey.elapsedMs / journey.msPerDay;
  const startOffset = activity.startedDay - journey.departedOnDay;
  const duration = activity.endsDay - activity.startedDay;
  return Math.min(1, Math.max(0, (travelledDays - startOffset) / duration));
}

function completeActivity(state: GameState): GameState {
  const journey = state.journey;
  if (journey === null || journey.activity === null) return state;

  const progress = journey.activity;
  const activity = getActivity(progress.id);
  let next: GameState = { ...state, journey: { ...journey, activity: null } };

  let targetName: string | undefined;
  if (activity.target !== undefined && progress.target !== null) {
    targetName = getCharacter(progress.target).name;
    next = contact(next, progress.target, activity.target.relationshipDelta, progress.endsDay);
  }

  next = applyEffects(next, activity.effects);
  for (const effect of activity.effects) {
    next = applyJourneyEffect(next, effect);
  }

  return appendLog(
    next,
    fillFromState(next, `${activity.title} — ${activity.outcomeText}`, targetName),
    progress.endsDay,
  );
}

function applyJourneyEffect(state: GameState, effect: Effect): GameState {
  const journey = state.journey;
  if (journey === null) return state;

  switch (effect.kind) {
    case 'shortenJourney': {
      const remaining = arrivalDay(journey) - state.day;
      if (remaining <= 0) return state;
      const cut = Math.min(remaining, Math.max(1, Math.floor(remaining * effect.fraction)));
      return { ...state, journey: { ...journey, durationDays: journey.durationDays - cut } };
    }
    case 'deliveryBonus':
      return {
        ...state,
        journey: { ...journey, deliveryBonus: journey.deliveryBonus + effect.amount },
      };
    case 'journal':
      return {
        ...state,
        journalPagesRead: Math.min(journalPages.length, state.journalPagesRead + 1),
      };
    default:
      return state;
  }
}

function hasEffect(activity: ActivityDef, kind: Effect['kind']): boolean {
  return activity.effects.some((effect) => effect.kind === kind);
}
