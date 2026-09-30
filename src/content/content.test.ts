import { describe, expect, it } from 'vitest';
import {
  allBulletins,
  allCharacters,
  allEvents,
  allJobs,
  allLocations,
  allUpgrades,
  BulletinIds,
  CharacterIds,
  content,
  EventIds,
  FlagIds,
  JobIds,
  LocationIds,
  UpgradeIds,
  type Condition,
  type Effect,
  type LocationDef,
  type TimeWindow,
} from './index';

const locationIds = new Set<string>(Object.values(LocationIds));
const characterIds = new Set<string>(Object.values(CharacterIds));
const eventIds = new Set<string>(Object.values(EventIds));
const upgradeIds = new Set<string>(Object.values(UpgradeIds));
const flagIds = new Set<string>(Object.values(FlagIds));

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) repeated.push(id);
    seen.add(id);
  }
  return repeated;
}

/** Day a location (or the location a bar belongs to) first appears on the map. */
function locationAppears(location: LocationDef): number {
  if (location.kind === 'bar' && location.parent !== undefined) {
    return content.locations[location.parent]?.availableFrom ?? 0;
  }
  return location.availableFrom ?? 0;
}

function checkConditions(conditions: readonly Condition[] | undefined, where: string): void {
  for (const condition of conditions ?? []) {
    switch (condition.kind) {
      case 'flagSet':
      case 'flagNotSet':
        expect(flagIds, `${where}: unknown flag ${condition.flag}`).toContain(condition.flag);
        break;
      case 'relationshipAtLeast':
        expect(characterIds, `${where}: unknown character`).toContain(condition.character);
        break;
      case 'eventCompleted':
        expect(eventIds, `${where}: unknown event ${condition.event}`).toContain(condition.event);
        break;
      case 'dateBetween':
        expect(condition.from, `${where}: dateBetween window is empty`).toBeLessThan(
          condition.until,
        );
        break;
      case 'moneyAtLeast':
        expect(condition.amount, `${where}: moneyAtLeast must be positive`).toBeGreaterThan(0);
        break;
    }
  }
}

function checkEffects(effects: readonly Effect[], where: string): void {
  for (const effect of effects) {
    switch (effect.kind) {
      case 'relationship':
        expect(characterIds, `${where}: unknown character`).toContain(effect.character);
        break;
      case 'setFlag':
      case 'clearFlag':
        expect(flagIds, `${where}: unknown flag ${effect.flag}`).toContain(effect.flag);
        break;
      case 'money':
        expect(effect.delta, `${where}: money effect of zero`).not.toBe(0);
        break;
    }
  }
}

function checkWindow(window: TimeWindow, where: string): void {
  expect(window.availableFrom, `${where}: window must open before it closes`).toBeLessThan(
    window.availableUntil,
  );
  expect(window.availableFrom, `${where}: window cannot open before day 0`).toBeGreaterThanOrEqual(
    0,
  );
}

describe('content registries', () => {
  it('have no duplicate IDs and match the ID constants exactly', () => {
    const kinds = [
      { defs: allLocations, ids: LocationIds },
      { defs: allCharacters, ids: CharacterIds },
      { defs: allJobs, ids: JobIds },
      { defs: allEvents, ids: EventIds },
      { defs: allUpgrades, ids: UpgradeIds },
      { defs: allBulletins, ids: BulletinIds },
    ] as const;

    for (const { defs, ids } of kinds) {
      const defIds = defs.map((def) => def.id);
      expect(duplicates(defIds)).toEqual([]);
      expect([...defIds].sort()).toEqual([...Object.values(ids)].sort());
    }
  });
});

describe('locations', () => {
  it('bars belong to a real planet or station; nothing else has a parent', () => {
    for (const location of allLocations) {
      if (location.kind === 'bar') {
        expect(location.parent, `${location.id} needs a parent`).toBeDefined();
        const parent = content.locations[location.parent!];
        expect(parent, `${location.id}: unknown parent`).toBeDefined();
        expect(parent.kind, `${location.id}: parent cannot be a bar`).not.toBe('bar');
      } else {
        expect(location.parent, `${location.id} should not have a parent`).toBeUndefined();
      }
    }
  });
});

describe('characters', () => {
  it('live somewhere real with a sane starting relationship', () => {
    for (const character of allCharacters) {
      expect(locationIds, `${character.id}: unknown home`).toContain(character.home);
      expect(character.initialRelationship).toBeGreaterThanOrEqual(0);
      expect(character.initialRelationship).toBeLessThanOrEqual(100);
    }
  });
});

describe('jobs', () => {
  it('run between two different, non-bar locations and pay something', () => {
    for (const job of allJobs) {
      expect(locationIds, `${job.id}: unknown origin`).toContain(job.from);
      expect(locationIds, `${job.id}: unknown destination`).toContain(job.to);
      expect(job.from, `${job.id}: must go somewhere`).not.toBe(job.to);
      expect(content.locations[job.from].kind).not.toBe('bar');
      expect(content.locations[job.to].kind).not.toBe('bar');
      expect(job.pay).toBeGreaterThan(0);
      if (job.window) checkWindow(job.window, job.id);
      checkConditions(job.conditions, job.id);
    }
  });

  it('never strand the player: every destination has an outgoing job', () => {
    const origins = new Set(allJobs.map((job) => job.from));
    for (const destination of new Set(allJobs.map((job) => job.to))) {
      expect(origins, `no job departs from ${destination}`).toContain(destination);
    }
  });
});

describe('events', () => {
  it('reference known IDs and have valid windows and choices', () => {
    for (const event of allEvents) {
      expect(locationIds, `${event.id}: unknown location`).toContain(event.location);
      checkWindow(event, event.id);
      checkConditions(event.conditions, event.id);
      expect(event.choices.length, `${event.id}: needs at least one choice`).toBeGreaterThan(0);
      expect(duplicates(event.choices.map((choice) => choice.id))).toEqual([]);
      for (const choice of event.choices) {
        checkConditions(choice.conditions, `${event.id}/${choice.id}`);
        checkEffects(choice.effects, `${event.id}/${choice.id}`);
      }
    }
  });

  it('are reachable: their location exists before the window closes', () => {
    for (const event of allEvents) {
      const location = content.locations[event.location];
      expect(
        locationAppears(location),
        `${event.id}: ${location.id} appears after the event expires`,
      ).toBeLessThanOrEqual(event.availableUntil);
      for (const condition of event.conditions ?? []) {
        if (condition.kind === 'dateBetween') {
          expect(condition.from).toBeLessThanOrEqual(event.availableUntil);
          expect(condition.until).toBeGreaterThanOrEqual(event.availableFrom);
        }
      }
    }
  });

  it('only gate on flags that some choice can actually set', () => {
    const settable = new Set<string>();
    for (const event of allEvents) {
      for (const choice of event.choices) {
        for (const effect of choice.effects) {
          if (effect.kind === 'setFlag') settable.add(effect.flag);
        }
      }
    }
    const gates = [
      ...allEvents.flatMap((event) => event.conditions ?? []),
      ...allEvents.flatMap((event) => event.choices.flatMap((choice) => choice.conditions ?? [])),
      ...allJobs.flatMap((job) => job.conditions ?? []),
    ];
    for (const condition of gates) {
      if (condition.kind === 'flagSet') {
        expect(settable, `nothing sets ${condition.flag}`).toContain(condition.flag);
      }
    }
  });
});

describe('upgrades', () => {
  it('cost something and only require other known upgrades', () => {
    for (const upgrade of allUpgrades) {
      expect(upgrade.cost).toBeGreaterThan(0);
      expect(upgrade.speedMultiplier).toBeGreaterThan(0);
      for (const requirement of upgrade.requires ?? []) {
        expect(upgradeIds, `${upgrade.id}: unknown requirement`).toContain(requirement);
        expect(requirement).not.toBe(upgrade.id);
      }
    }
  });
});

describe('bulletins', () => {
  it('are posted at known locations with valid windows', () => {
    for (const bulletin of allBulletins) {
      expect(locationIds, `${bulletin.id}: unknown location`).toContain(bulletin.location);
      checkWindow(bulletin, bulletin.id);
      expect(locationAppears(content.locations[bulletin.location])).toBeLessThanOrEqual(
        bulletin.availableUntil,
      );
    }
  });
});
