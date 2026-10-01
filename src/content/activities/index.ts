import { ActivityIds } from '../ids';
import type { ActivityDef } from '../types';

export const activities = [
  {
    id: ActivityIds.maintenance,
    title: 'Run maintenance',
    description:
      'Crawl the coolant loops and rebalance the drive. Tedious, and it shaves days off the run.',
    durationDays: 20,
    effects: [{ kind: 'shortenJourney', fraction: 0.05 }],
    outcomeText: 'The drive runs cleaner. You have bought back a few days.',
  },
  {
    id: ActivityIds.writeHome,
    title: 'Write home',
    description:
      'Sit with a blank message for an hour, then write it. It will arrive months before you do.',
    durationDays: 10,
    target: { kind: 'closeOne', relationshipDelta: 6 },
    effects: [],
    outcomeText: 'You write to {target}. The message leaves the ship faster than you ever will.',
  },
  {
    id: ActivityIds.study,
    title: 'Study the lane manuals',
    description:
      'Manifests, tariffs, dock law. Boring enough to work; paperwork done right pays better on delivery.',
    durationDays: 25,
    effects: [{ kind: 'deliveryBonus', amount: 0.05 }],
    outcomeText:
      'You understand the tariff schedules a little better. It will show on the next manifest.',
  },
  {
    id: ActivityIds.journal,
    title: 'Keep the journal',
    description: 'Write down what you remember before the years out there take it.',
    durationDays: 15,
    effects: [{ kind: 'journal' }],
    outcomeText: 'You fill a page.',
  },
] as const satisfies readonly ActivityDef[];
