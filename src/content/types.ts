import type {
  ActivityId,
  BulletinId,
  CharacterId,
  EventId,
  FlagId,
  JobId,
  LocationId,
  UpgradeId,
} from './ids';

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
  | {
      readonly kind: 'relationshipAtMost';
      readonly character: CharacterId;
      readonly value: number;
    }
  | {
      readonly kind: 'daysSinceContactAtLeast';
      readonly character: CharacterId;
      readonly days: number;
    }
  | { readonly kind: 'moneyAtLeast'; readonly amount: Credits }
  | { readonly kind: 'eventCompleted'; readonly event: EventId }
  | { readonly kind: 'eventNotCompleted'; readonly event: EventId }
  | { readonly kind: 'dateBetween'; readonly from: GameDay; readonly until: GameDay }
  | { readonly kind: 'anyOf'; readonly conditions: readonly Condition[] };

/** State mutation produced by resolving an event choice or finishing an activity. */
export type Effect =
  | { readonly kind: 'money'; readonly delta: Credits }
  | { readonly kind: 'relationship'; readonly character: CharacterId; readonly delta: number }
  | { readonly kind: 'setFlag'; readonly flag: FlagId }
  | { readonly kind: 'clearFlag'; readonly flag: FlagId }
  | { readonly kind: 'relocate'; readonly character: CharacterId; readonly to: LocationId | null }
  | { readonly kind: 'shortenJourney'; readonly fraction: number }
  | { readonly kind: 'deliveryBonus'; readonly amount: number }
  | { readonly kind: 'journal' };

/** Effects that only make sense while underway; content tests forbid them in events. */
export const JOURNEY_EFFECT_KINDS = [
  'shortenJourney',
  'deliveryBonus',
  'journal',
] as const satisfies readonly Effect['kind'][];

/** Inclusive in-game day range during which something can be found. */
export interface TimeWindow {
  readonly availableFrom: GameDay;
  readonly availableUntil: GameDay;
}

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export interface MapBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export type LocationKind = 'planet' | 'station' | 'bar';

export interface LocationDef {
  readonly id: LocationId;
  readonly name: string;
  readonly kind: LocationKind;
  readonly description: string;
  /** Distances between locations derive from these coordinates (arbitrary units). */
  readonly position: MapPosition;
  /** Day the colony is founded and named on the map; omitted means it exists from the start. */
  readonly availableFrom?: GameDay;
  /** Star-catalogue designation shown before the colony is founded. */
  readonly catalogName?: string;
  /** Bars live inside another location and share its position. */
  readonly parent?: LocationId;
}

export type CharacterRole = 'mother' | 'friend' | 'partner' | 'bartender' | 'acquaintance';

export const CLOSE_ONE_ROLES: readonly CharacterRole[] = ['mother', 'friend', 'partner'];

/** A relocation that happens on schedule whether or not the player is around. */
export interface CharacterMove {
  readonly day: GameDay;
  /** `null` means the person is no longer reachable. */
  readonly to: LocationId | null;
}

export interface CharacterDef {
  readonly id: CharacterId;
  readonly name: string;
  readonly role: CharacterRole;
  readonly description: string;
  readonly home: LocationId;
  /** Starting relationship value, 0–100. */
  readonly initialRelationship: number;
  /** Rapport lost at every month boundary without contact; 0 for people who do not fade. */
  readonly driftPerMonth: number;
  readonly moves?: readonly CharacterMove[];
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
  /** The person this scene is about; used to group scenes under them in the UI. */
  readonly character?: CharacterId;
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

/** Something to do with the ship's time while underway. */
export interface ActivityDef {
  readonly id: ActivityId;
  readonly title: string;
  readonly description: string;
  /** Ship time it occupies, in in-game days. */
  readonly durationDays: number;
  /** When set, the player picks one of their close ones; finishing counts as contact. */
  readonly target?: { readonly kind: 'closeOne'; readonly relationshipDelta: number };
  readonly effects: readonly Effect[];
  /** May use `{target}` when the activity has a target. */
  readonly outcomeText: string;
}

export interface IntroPage {
  readonly title: string;
  readonly paragraphs: readonly string[];
}
