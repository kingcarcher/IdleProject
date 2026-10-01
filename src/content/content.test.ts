import { describe, expect, it } from 'vitest';
import {
  ActivityIds,
  allActivities,
  allBulletins,
  allCharacters,
  allEvents,
  allJobs,
  allLocations,
  allUpgrades,
  BulletinIds,
  CharacterIds,
  CLOSE_ONE_ROLES,
  content,
  EventIds,
  FlagIds,
  howToPlay,
  introPages,
  JobIds,
  journalPages,
  JOURNEY_EFFECT_KINDS,
  loanSignedLog,
  LocationIds,
  MAP_BOUNDS,
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
const journeyEffectKinds = new Set<string>(JOURNEY_EFFECT_KINDS);

const KNOWN_TOKENS = new Set(['name', 'ship', 'target']);

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) repeated.push(id);
    seen.add(id);
  }
  return repeated;
}

/** Every `{token}` used anywhere inside a content definition. */
function tokensIn(value: unknown): string[] {
  return [...JSON.stringify(value).matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
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
      case 'relationshipAtMost':
        expect(characterIds, `${where}: unknown character`).toContain(condition.character);
        expect(condition.value).toBeGreaterThanOrEqual(0);
        expect(condition.value).toBeLessThanOrEqual(100);
        break;
      case 'daysSinceContactAtLeast':
        expect(characterIds, `${where}: unknown character`).toContain(condition.character);
        expect(condition.days, `${where}: silence must be positive`).toBeGreaterThan(0);
        break;
      case 'eventCompleted':
      case 'eventNotCompleted':
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
      case 'anyOf':
        expect(condition.conditions.length, `${where}: empty anyOf`).toBeGreaterThan(0);
        checkConditions(condition.conditions, `${where}/anyOf`);
        break;
    }
  }
}

function checkEffects(effects: readonly Effect[], where: string): void {
  for (const effect of effects) {
    switch (effect.kind) {
      case 'relationship':
        expect(characterIds, `${where}: unknown character`).toContain(effect.character);
        expect(effect.delta, `${where}: relationship effect of zero`).not.toBe(0);
        break;
      case 'setFlag':
      case 'clearFlag':
        expect(flagIds, `${where}: unknown flag ${effect.flag}`).toContain(effect.flag);
        break;
      case 'money':
        expect(effect.delta, `${where}: money effect of zero`).not.toBe(0);
        break;
      case 'relocate':
        expect(characterIds, `${where}: unknown character`).toContain(effect.character);
        if (effect.to !== null) expect(locationIds, `${where}: unknown place`).toContain(effect.to);
        break;
      case 'shortenJourney':
        expect(effect.fraction).toBeGreaterThan(0);
        expect(effect.fraction).toBeLessThanOrEqual(1);
        break;
      case 'deliveryBonus':
        expect(effect.amount).toBeGreaterThan(0);
        break;
      case 'journal':
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
      { defs: allActivities, ids: ActivityIds },
    ] as const;

    for (const { defs, ids } of kinds) {
      const defIds = defs.map((def) => def.id);
      expect(duplicates(defIds)).toEqual([]);
      expect([...defIds].sort()).toEqual([...Object.values(ids)].sort());
    }
  });

  it('only use template tokens the engine knows how to fill', () => {
    const everything = [
      ...allEvents,
      ...allJobs,
      ...allLocations,
      ...allCharacters,
      ...allBulletins,
      ...allUpgrades,
      introPages,
      howToPlay,
      loanSignedLog,
      journalPages,
    ];
    for (const token of everything.flatMap(tokensIn)) {
      expect(KNOWN_TOKENS, `unknown template token {${token}}`).toContain(token);
    }
    for (const activity of allActivities) {
      for (const token of tokensIn(activity)) {
        expect(KNOWN_TOKENS).toContain(token);
        if (token === 'target') {
          expect(activity.target, `${activity.id} uses {target} without a target`).toBeDefined();
        }
      }
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

  it('sit inside the map bounds with unique catalogue names', () => {
    const catalogNames: string[] = [];
    for (const location of allLocations) {
      expect(location.position.x).toBeGreaterThanOrEqual(MAP_BOUNDS.minX);
      expect(location.position.x).toBeLessThanOrEqual(MAP_BOUNDS.maxX);
      expect(location.position.y).toBeGreaterThanOrEqual(MAP_BOUNDS.minY);
      expect(location.position.y).toBeLessThanOrEqual(MAP_BOUNDS.maxY);
      if (location.kind !== 'bar') {
        expect(location.catalogName, `${location.id} needs a catalogue name`).toBeDefined();
        catalogNames.push(location.catalogName!);
      }
    }
    expect(duplicates(catalogNames)).toEqual([]);
  });
});

describe('characters', () => {
  it('live somewhere real with a sane starting relationship and drift', () => {
    for (const character of allCharacters) {
      expect(locationIds, `${character.id}: unknown home`).toContain(character.home);
      expect(character.initialRelationship).toBeGreaterThanOrEqual(0);
      expect(character.initialRelationship).toBeLessThanOrEqual(100);
      expect(character.driftPerMonth).toBeGreaterThanOrEqual(0);
      let lastDay = 0;
      for (const move of character.moves ?? []) {
        expect(move.day, `${character.id}: moves must be in order`).toBeGreaterThan(lastDay);
        if (move.to !== null)
          expect(locationIds, `${character.id}: unknown move`).toContain(move.to);
        lastDay = move.day;
      }
    }
  });

  it('include the three close ones, each with a farewell scene at home', () => {
    const closeOnes = allCharacters.filter((c) => CLOSE_ONE_ROLES.includes(c.role));
    expect(closeOnes.map((c) => c.role).sort()).toEqual([...CLOSE_ONE_ROLES].sort());
    for (const character of closeOnes) {
      const farewell = allEvents.find(
        (event) =>
          event.character === character.id &&
          event.location === character.home &&
          event.availableFrom === 0,
      );
      expect(farewell, `${character.id} has no farewell scene`).toBeDefined();
      expect(character.driftPerMonth, `${character.id} should fade when ignored`).toBeGreaterThan(
        0,
      );
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

  it('never strand the player: every dockable place has jobs in and out', () => {
    const origins = new Set(allJobs.map((job) => job.from));
    const destinations = new Set(allJobs.map((job) => job.to));
    for (const location of allLocations) {
      if (location.kind === 'bar') continue;
      expect(origins, `no job departs from ${location.id}`).toContain(location.id);
      expect(destinations, `no job arrives at ${location.id}`).toContain(location.id);
    }
  });
});

describe('events', () => {
  it('reference known IDs and have valid windows and choices', () => {
    for (const event of allEvents) {
      expect(locationIds, `${event.id}: unknown location`).toContain(event.location);
      if (event.character !== undefined) {
        expect(characterIds, `${event.id}: unknown character`).toContain(event.character);
      }
      checkWindow(event, event.id);
      checkConditions(event.conditions, event.id);
      expect(event.choices.length, `${event.id}: needs at least one choice`).toBeGreaterThan(0);
      expect(duplicates(event.choices.map((choice) => choice.id))).toEqual([]);
      for (const choice of event.choices) {
        checkConditions(choice.conditions, `${event.id}/${choice.id}`);
        checkEffects(choice.effects, `${event.id}/${choice.id}`);
        for (const effect of choice.effects) {
          expect(
            journeyEffectKinds,
            `${event.id}/${choice.id}: ${effect.kind} only belongs in activities`,
          ).not.toContain(effect.kind);
        }
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
    const flatten = (conditions: readonly Condition[]): Condition[] =>
      conditions.flatMap((c) => (c.kind === 'anyOf' ? flatten(c.conditions) : [c]));
    const gates = flatten([
      ...allEvents.flatMap((event) => event.conditions ?? []),
      ...allEvents.flatMap((event) => event.choices.flatMap((choice) => choice.conditions ?? [])),
      ...allJobs.flatMap((job) => job.conditions ?? []),
    ]);
    for (const condition of gates) {
      if (condition.kind === 'flagSet') {
        expect(settable, `nothing sets ${condition.flag}`).toContain(condition.flag);
      }
    }
  });
});

describe('activities', () => {
  it('take time, have valid effects, and only target close ones meaningfully', () => {
    for (const activity of allActivities) {
      expect(activity.durationDays, `${activity.id}: must take time`).toBeGreaterThan(0);
      checkEffects(activity.effects, activity.id);
      if (activity.target !== undefined) {
        expect(activity.target.relationshipDelta).not.toBe(0);
      } else {
        expect(activity.effects.length, `${activity.id} does nothing`).toBeGreaterThan(0);
      }
    }
  });

  it('fit comfortably inside the shortest run', () => {
    const shortest = Math.min(
      ...allJobs.map((job) => {
        const a = content.locations[job.from].position;
        const b = content.locations[job.to].position;
        return Math.ceil(Math.hypot(a.x - b.x, a.y - b.y));
      }),
    );
    for (const activity of allActivities) {
      expect(activity.durationDays, `${activity.id} is longer than the shortest run`).toBeLessThan(
        shortest / 2,
      );
    }
  });
});

describe('protagonist', () => {
  it('has an intro that ends at the loan office, help text and a journal to fill', () => {
    expect(introPages.length).toBeGreaterThanOrEqual(3);
    for (const page of introPages) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.paragraphs.length).toBeGreaterThan(0);
    }
    expect(introPages.at(-1)!.title).toMatch(/loan/i);
    expect(howToPlay.length).toBeGreaterThan(3);
    expect(journalPages.length).toBeGreaterThan(0);
    expect(loanSignedLog).toContain('{name}');
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
