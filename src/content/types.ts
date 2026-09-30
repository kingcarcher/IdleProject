import type { BulletinId, CharacterId, EventId, FlagId, JobId, LocationId, UpgradeId } from './ids';

/** Whole in-game days since the start of the game (day 0). */
export type GameDay = number;

/** Integer credits. */
export type Credits = number;

/**
 * Declarative gate used by events, choices, jobs and upgrades.
 * Conditions are data (not functions) so content stays inspectable and serializable.
 */
export type Condition =
  | { readonly kind: 'flagSet'; readonly flag: FlagId }
  | { readonly kind: 'flagNotSet'; readonly flag: FlagId }
  | {
      readonly kind: 'relationshipAtLeast';
      readonly character: CharacterId;
      readonly value: number;
    }
  | { readonly kind: 'moneyAtLeast'; readonly amount: Credits }
  | { readonly kind: 'eventCompleted'; readonly event: EventId }
  | { readonly kind: 'dateBetween'; readonly from: GameDay; readonly until: GameDay };

/** State mutation produced by resolving an event choice. */
export type Effect =
  | { readonly kind: 'money'; readonly delta: Credits }
  | { readonly kind: 'relationship'; readonly character: CharacterId; readonly delta: number }
  | { readonly kind: 'setFlag'; readonly flag: FlagId }
  | { readonly kind: 'clearFlag'; readonly flag: FlagId };

/** Inclusive in-game day range during which something can be found. */
export interface TimeWindow {
  readonly availableFrom: GameDay;
  readonly availableUntil: GameDay;
}

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export type LocationKind = 'planet' | 'station' | 'bar';

export interface LocationDef {
  readonly id: LocationId;
  readonly name: string;
  readonly kind: LocationKind;
  readonly description: string;
  /** Distances between locations derive from these coordinates (arbitrary units). */
  readonly position: MapPosition;
  /** Day the location appears on the map; omitted means it exists from the start. */
  readonly availableFrom?: GameDay;
  /** Bars live inside another location and share its position. */
  readonly parent?: LocationId;
}

export interface CharacterDef {
  readonly id: CharacterId;
  readonly name: string;
  readonly description: string;
  readonly home: LocationId;
  /** Starting relationship value, 0–100. */
  readonly initialRelationship: number;
}

export interface JobDef {
  readonly id: JobId;
  readonly title: string;
  readonly description: string;
  readonly from: LocationId;
  readonly to: LocationId;
  readonly pay: Credits;
  readonly window?: TimeWindow;
  readonly conditions?: readonly Condition[];
}

export interface ChoiceDef {
  /** Unique within its event. */
  readonly id: string;
  readonly label: string;
  readonly conditions?: readonly Condition[];
  readonly effects: readonly Effect[];
  readonly outcomeText: string;
}

export interface EventDef extends TimeWindow {
  readonly id: EventId;
  readonly title: string;
  readonly location: LocationId;
  readonly conditions?: readonly Condition[];
  readonly text: string;
  readonly choices: readonly ChoiceDef[];
}

export interface UpgradeDef {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly cost: Credits;
  /** Technology improves over time; omitted means available from the start. */
  readonly availableFrom?: GameDay;
  readonly requires?: readonly UpgradeId[];
  readonly speedMultiplier: number;
}

export interface BulletinDef extends TimeWindow {
  readonly id: BulletinId;
  readonly location: LocationId;
  readonly headline: string;
  readonly body: string;
}
