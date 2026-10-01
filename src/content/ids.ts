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
  kestrelReach: 'loc.kestrel-reach',
  tarsisRing: 'loc.tarsis-ring',
  longShore: 'loc.long-shore',
} as const;
export type LocationId = (typeof LocationIds)[keyof typeof LocationIds];

export const CharacterIds = {
  bartender: 'chr.bartender',
  ilse: 'chr.ilse',
  mother: 'chr.mother',
  partner: 'chr.partner',
  friend: 'chr.friend',
} as const;
export type CharacterId = (typeof CharacterIds)[keyof typeof CharacterIds];

export const JobIds = {
  haldenToMeridian: 'job.halden-to-meridian',
  meridianToHalden: 'job.meridian-to-halden',
  haldenToVerge: 'job.halden-to-verge',
  vergeToHalden: 'job.verge-to-halden',
  meridianToVerge: 'job.meridian-to-verge',
  vergeToMeridian: 'job.verge-to-meridian',
  haldenToKestrel: 'job.halden-to-kestrel',
  kestrelToHalden: 'job.kestrel-to-halden',
  meridianToKestrel: 'job.meridian-to-kestrel',
  kestrelToMeridian: 'job.kestrel-to-meridian',
  haldenToTarsis: 'job.halden-to-tarsis',
  tarsisToHalden: 'job.tarsis-to-halden',
  vergeToTarsis: 'job.verge-to-tarsis',
  tarsisToVerge: 'job.tarsis-to-verge',
  haldenToLongShore: 'job.halden-to-long-shore',
  longShoreToHalden: 'job.long-shore-to-halden',
  kestrelToLongShore: 'job.kestrel-to-long-shore',
  longShoreToKestrel: 'job.long-shore-to-kestrel',
} as const;
export type JobId = (typeof JobIds)[keyof typeof JobIds];

export const EventIds = {
  meridianLetter: 'evt.meridian.letter',
  haldenDeliverLetter: 'evt.halden.deliver-letter',
  barFirstRound: 'evt.halden.bar.first-round',
  barReflection: 'evt.halden.bar.reflection',
  partnerFarewell: 'evt.partner.farewell',
  partnerReturnWarm: 'evt.partner.return-warm',
  partnerReturnDistant: 'evt.partner.return-distant',
  partnerNoGoodbye: 'evt.partner.no-goodbye',
  partnerPlans: 'evt.partner.plans',
  partnerGoneDrift: 'evt.partner.gone-drift',
  partnerGoneStrayed: 'evt.partner.gone-strayed',
  motherFarewell: 'evt.mother.farewell',
  motherMoney1: 'evt.mother.money-1',
  motherMoney2: 'evt.mother.money-2',
  motherMoney3: 'evt.mother.money-3',
  motherMortgageDone: 'evt.mother.mortgage-done',
  friendFarewell: 'evt.friend.farewell',
  friendGoneNote: 'evt.friend.gone-note',
  friendMeetMeridian: 'evt.friend.meet-meridian',
  ilseInvitation: 'evt.meridian.ilse-invitation',
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

export const ActivityIds = {
  maintenance: 'act.maintenance',
  writeHome: 'act.write-home',
  study: 'act.study',
  journal: 'act.journal',
} as const;
export type ActivityId = (typeof ActivityIds)[keyof typeof ActivityIds];

export const FlagIds = {
  carryingLetter: 'flag.carrying-letter',
  letterDelivered: 'flag.letter-delivered',
  strayed: 'flag.strayed',
  partnerLeft: 'flag.partner-left',
  mortgagePaid: 'flag.mortgage-paid',
  saidGoodbyePartner: 'flag.said-goodbye-partner',
  saidGoodbyeMother: 'flag.said-goodbye-mother',
  saidGoodbyeFriend: 'flag.said-goodbye-friend',
} as const;
export type FlagId = (typeof FlagIds)[keyof typeof FlagIds];
