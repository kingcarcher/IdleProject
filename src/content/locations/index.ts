import { LocationIds } from '../ids';
import type { LocationDef } from '../types';

export const locations = [
  {
    id: LocationIds.halden,
    name: 'Halden',
    kind: 'planet',
    description:
      'A grey, over-farmed colony world. The place you grew up. Nobody leaves unless they have to.',
    position: { x: 0, y: 0 },
  },
  {
    id: LocationIds.haldenBar,
    name: 'The Long Wait',
    kind: 'bar',
    parent: LocationIds.halden,
    description:
      'A low-ceilinged bar by the freight docks. The same robot has poured drinks here for decades.',
    position: { x: 0, y: 0 },
  },
  {
    id: LocationIds.meridian,
    name: 'Meridian Station',
    kind: 'station',
    description:
      'A transfer hub strung along an asteroid. Cargo comes through faster than people do.',
    position: { x: 120, y: 40 },
  },
  {
    id: LocationIds.vergeOutpost,
    name: 'Verge Outpost',
    kind: 'station',
    description: 'A newly commissioned survey outpost at the edge of the charted lanes.',
    position: { x: -200, y: 150 },
    availableFrom: 720,
  },
] as const satisfies readonly LocationDef[];
