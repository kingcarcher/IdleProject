import {
  allCharacters,
  CLOSE_ONE_ROLES,
  DEFAULT_NAME,
  LocationIds,
  type ActivityId,
  type CharacterId,
  type Credits,
  type EventId,
  type FlagId,
  type GameDay,
  type JobId,
  type LocationId,
  type UpgradeId,
} from '@/content';

export type Phase = 'intro' | 'station' | 'journey' | 'bar' | 'gameOver';

export interface PlayerProfile {
  readonly name: string;
}

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

export interface ActivityProgress {
  readonly id: ActivityId;
  readonly startedDay: GameDay;
  readonly endsDay: GameDay;
  readonly target: CharacterId | null;
}

export interface Journey {
  readonly jobId: JobId;
  readonly from: LocationId;
  readonly to: LocationId;
  readonly departedOnDay: GameDay;
  readonly durationDays: number;
  /** Real milliseconds of travel accumulated so far (only advances while the tab is open). */
  readonly elapsedMs: number;
  /** Real milliseconds per in-game day, fixed at departure from the era's time dilation. */
  readonly msPerDay: number;
  readonly activity: ActivityProgress | null;
  /** Fraction added to the job's pay on arrival. */
  readonly deliveryBonus: number;
}

export interface Relationship {
  /** 0–100. */
  readonly value: number;
  /** Last in-game day the player spoke or wrote to them; null if never. */
  readonly lastContactDay: GameDay | null;
}

export interface CharacterState {
  /** Overrides the character's scheduled whereabouts; null means they are gone for good. */
  readonly location: LocationId | null;
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
  readonly player: PlayerProfile;
  readonly day: GameDay;
  readonly money: Credits;
  readonly loan: Loan;
  readonly ship: Ship;
  /** Where the player is, or where they departed from while `journey` is set. */
  readonly location: LocationId;
  readonly journey: Journey | null;
  readonly relationships: Readonly<Partial<Record<CharacterId, Relationship>>>;
  readonly characters: Readonly<Partial<Record<CharacterId, CharacterState>>>;
  readonly flags: readonly FlagId[];
  readonly completedEvents: readonly EventId[];
  readonly journalPagesRead: number;
  readonly log: readonly LogEntry[];
  readonly gameOver: GameOverReason | null;
}

export const STATE_VERSION = 2;
export const MAX_LOG_ENTRIES = 200;
export const MAX_RELATIONSHIP = 100;
export const MIN_RELATIONSHIP = 0;

export function initialRelationships(): Partial<Record<CharacterId, Relationship>> {
  const relationships: Partial<Record<CharacterId, Relationship>> = {};
  for (const character of allCharacters) {
    relationships[character.id] = {
      value: character.initialRelationship,
      // You live among your close ones on day 0; everyone else you have yet to meet.
      lastContactDay: CLOSE_ONE_ROLES.includes(character.role) ? 0 : null,
    };
  }
  return relationships;
}

export function createInitialState(): GameState {
  return {
    version: STATE_VERSION,
    phase: 'intro',
    player: { name: DEFAULT_NAME },
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
    relationships: initialRelationships(),
    characters: {},
    flags: [],
    completedEvents: [],
    journalPagesRead: 0,
    log: [],
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

export function getRelationshipState(state: GameState, character: CharacterId): Relationship {
  return state.relationships[character] ?? { value: 0, lastContactDay: null };
}

export function getRelationship(state: GameState, character: CharacterId): number {
  return getRelationshipState(state, character).value;
}

export function clampRelationship(value: number): number {
  return Math.min(MAX_RELATIONSHIP, Math.max(MIN_RELATIONSHIP, Math.round(value)));
}
