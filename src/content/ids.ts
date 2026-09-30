/**
 * Every content ID lives here as a `const` object so that a typo anywhere in
 * content or engine code is a compile error instead of a silent missing lookup.
 *
 * Convention: `<kind>.<slug>`, e.g. `loc.halden`, `evt.meridian.letter`.
 */

export const LocationIds = {
  halden: 'loc.halden',
  haldenBar: 'loc.halden.bar',
  meridian: 'loc.meridian',
  vergeOutpost: 'loc.verge-outpost',
} as const;
export type LocationId = (typeof LocationIds)[keyof typeof LocationIds];

export const CharacterIds = {
  bartender: 'chr.bartender',
  ilse: 'chr.ilse',
} as const;
export type CharacterId = (typeof CharacterIds)[keyof typeof CharacterIds];

export const JobIds = {
  haldenToMeridian: 'job.halden-to-meridian',
  meridianToHalden: 'job.meridian-to-halden',
} as const;
export type JobId = (typeof JobIds)[keyof typeof JobIds];

export const EventIds = {
  meridianLetter: 'evt.meridian.letter',
  haldenDeliverLetter: 'evt.halden.deliver-letter',
  barFirstRound: 'evt.halden.bar.first-round',
} as const;
export type EventId = (typeof EventIds)[keyof typeof EventIds];

export const UpgradeIds = {
  driveCoils: 'upg.drive-coils',
} as const;
export type UpgradeId = (typeof UpgradeIds)[keyof typeof UpgradeIds];

export const BulletinIds = {
  haldenCharter: 'bul.halden.charter',
  meridianDockFees: 'bul.meridian.dock-fees',
} as const;
export type BulletinId = (typeof BulletinIds)[keyof typeof BulletinIds];

export const FlagIds = {
  carryingLetter: 'flag.carrying-letter',
  letterDelivered: 'flag.letter-delivered',
} as const;
export type FlagId = (typeof FlagIds)[keyof typeof FlagIds];
