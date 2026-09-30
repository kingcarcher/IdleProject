import {
  allCharacters,
  LocationIds,
  type CharacterId,
  type Credits,
  type EventId,
  type FlagId,
  type GameDay,
  type JobId,
  type LocationId,
  type UpgradeId,
} from '@/content';

export type Phase = 'station' | 'journey' | 'bar' | 'gameOver';

export interface Loan {
  readonly principal: Credits;
  /** Fraction of the principal added at every in-game month boundary. */
  readonly monthlyInterestRate: number;
  /** Automatically drafted from the player's account at every month boundary. */
  readonly monthlyPayment: Credits;
  readonly missedPayments: number;
}

export interface Ship {
  readonly name: string;
  /** Map units per in-game day before upgrades. */
  readonly baseSpeed: number;
  readonly upgrades: readonly UpgradeId[];
}

export interface Journey {
  readonly jobId: JobId;
  readonly from: LocationId;
  readonly to: LocationId;
  readonly departedOnDay: GameDay;
  readonly durationDays: number;
  /** Real milliseconds of travel accumulated so far (only advances while the tab is open). */
  readonly elapsedMs: number;
}

export interface LogEntry {
  readonly day: GameDay;
  readonly text: string;
}

export type GameOverReason = 'bankrupt';

export interface GameState {
  /** Save-format version; see engine/save.ts. */
  readonly version: number;
  readonly phase: Phase;
  readonly day: GameDay;
  readonly money: Credits;
  readonly loan: Loan;
  readonly ship: Ship;
  /** Where the player is, or where they departed from while `journey` is set. */
  readonly location: LocationId;
  readonly journey: Journey | null;
  readonly relationships: Readonly<Partial<Record<CharacterId, number>>>;
  readonly flags: readonly FlagId[];
  readonly completedEvents: readonly EventId[];
  readonly log: readonly LogEntry[];
  readonly gameOver: GameOverReason | null;
}

export const STATE_VERSION = 1;
export const MAX_LOG_ENTRIES = 200;
export const MAX_RELATIONSHIP = 100;
export const MIN_RELATIONSHIP = 0;

export function createInitialState(): GameState {
  const relationships: Partial<Record<CharacterId, number>> = {};
  for (const character of allCharacters) {
    relationships[character.id] = character.initialRelationship;
  }

  return {
    version: STATE_VERSION,
    phase: 'station',
    day: 0,
    money: 3000,
    loan: {
      principal: 60000,
      monthlyInterestRate: 0.005,
      monthlyPayment: 600,
      missedPayments: 0,
    },
    ship: {
      name: 'Threnody',
      baseSpeed: 1,
      upgrades: [],
    },
    location: LocationIds.halden,
    journey: null,
    relationships,
    flags: [],
    completedEvents: [],
    log: [
      {
        day: 0,
        text: 'The ship is yours, on paper. The bank owns the paper. First payment is due in a month.',
      },
    ],
    gameOver: null,
  };
}

export function appendLog(state: GameState, text: string, day: GameDay = state.day): GameState {
  const log = [...state.log, { day, text }];
  return {
    ...state,
    log: log.length > MAX_LOG_ENTRIES ? log.slice(log.length - MAX_LOG_ENTRIES) : log,
  };
}

export function hasFlag(state: GameState, flag: FlagId): boolean {
  return state.flags.includes(flag);
}

export function getRelationship(state: GameState, character: CharacterId): number {
  return state.relationships[character] ?? 0;
}

export function clampRelationship(value: number): number {
  return Math.min(MAX_RELATIONSHIP, Math.max(MIN_RELATIONSHIP, Math.round(value)));
}
