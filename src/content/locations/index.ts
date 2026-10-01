import { LocationIds } from '../ids';
import type { LocationDef, MapBounds } from '../types';

/** Extent of the charted region in map units; the star map is drawn to fill it. */
export const MAP_BOUNDS: MapBounds = { minX: -400, maxX: 400, minY: -260, maxY: 260 };

export const locations = [
  {
    id: LocationIds.halden,
    name: 'Halden',
    kind: 'planet',
    description:
      'A grey, over-farmed colony world. The place you grew up. Nobody leaves unless they have to.',
    position: { x: 0, y: 0 },
    catalogName: 'Gliese 581',
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
    catalogName: 'HD 40307',
  },
  {
    id: LocationIds.vergeOutpost,
    name: 'Verge Outpost',
    kind: 'station',
    description: 'A newly commissioned survey outpost at the edge of the charted lanes.',
    position: { x: -200, y: 150 },
    availableFrom: 720,
    catalogName: 'Wolf 1061',
  },
  {
    id: LocationIds.kestrelReach,
    name: 'Kestrel Reach',
    kind: 'planet',
    description:
      'A cold ocean world under a thin sky. The first colony founded after you left home; its docks still smell of new sealant.',
    position: { x: 260, y: -180 },
    availableFrom: 1080,
    catalogName: 'Kepler-442',
  },
  {
    id: LocationIds.tarsisRing,
    name: 'Tarsis Ring',
    kind: 'station',
    description:
      'A ring habitat spun up around a gas giant. Ten thousand people who have never stood on a planet.',
    position: { x: -340, y: -120 },
    availableFrom: 1800,
    catalogName: 'Ross 128',
  },
  {
    id: LocationIds.longShore,
    name: 'Long Shore',
    kind: 'planet',
    description:
      'A terraformed coastline at the far end of the lanes, the kind of place people on Halden used to talk about moving to.',
    position: { x: 380, y: 210 },
    availableFrom: 2520,
    catalogName: 'Tau Ceti',
  },
] as const satisfies readonly LocationDef[];
