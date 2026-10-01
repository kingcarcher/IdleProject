import { activities } from './activities';
import { bulletins } from './bulletins';
import { characters } from './characters';
import { events } from './events';
import type {
  ActivityId,
  BulletinId,
  CharacterId,
  EventId,
  JobId,
  LocationId,
  UpgradeId,
} from './ids';
import { jobs } from './jobs';
import { locations, MAP_BOUNDS } from './locations';
import type {
  ActivityDef,
  BulletinDef,
  CharacterDef,
  EventDef,
  JobDef,
  LocationDef,
  UpgradeDef,
} from './types';
import { upgrades } from './upgrades';

export * from './ids';
export * from './protagonist';
export * from './types';
export { MAP_BOUNDS };

function keyById<Id extends string, Def extends { readonly id: Id }>(
  defs: readonly Def[],
): Readonly<Record<Id, Def>> {
  const registry = {} as Record<Id, Def>;
  for (const def of defs) {
    registry[def.id] = def;
  }
  return registry;
}

export const content = {
  locations: keyById<LocationId, LocationDef>(locations),
  characters: keyById<CharacterId, CharacterDef>(characters),
  jobs: keyById<JobId, JobDef>(jobs),
  events: keyById<EventId, EventDef>(events),
  upgrades: keyById<UpgradeId, UpgradeDef>(upgrades),
  bulletins: keyById<BulletinId, BulletinDef>(bulletins),
  activities: keyById<ActivityId, ActivityDef>(activities),
} as const;

export const allLocations: readonly LocationDef[] = locations;
export const allCharacters: readonly CharacterDef[] = characters;
export const allJobs: readonly JobDef[] = jobs;
export const allEvents: readonly EventDef[] = events;
export const allUpgrades: readonly UpgradeDef[] = upgrades;
export const allBulletins: readonly BulletinDef[] = bulletins;
export const allActivities: readonly ActivityDef[] = activities;

export function getLocation(id: LocationId): LocationDef {
  return content.locations[id];
}

export function getCharacter(id: CharacterId): CharacterDef {
  return content.characters[id];
}

export function getJob(id: JobId): JobDef {
  return content.jobs[id];
}

export function getEvent(id: EventId): EventDef {
  return content.events[id];
}

export function getUpgrade(id: UpgradeId): UpgradeDef {
  return content.upgrades[id];
}

export function getActivity(id: ActivityId): ActivityDef {
  return content.activities[id];
}
