import { BulletinIds, LocationIds } from '../ids';
import type { BulletinDef } from '../types';

export const bulletins = [
  {
    id: BulletinIds.haldenCharter,
    location: LocationIds.halden,
    availableFrom: 0,
    availableUntil: 720,
    headline: 'Colonial Charter ratified',
    body: 'Halden is now a chartered colony. Freight licences issued before this date remain valid for two years.',
  },
  {
    id: BulletinIds.meridianDockFees,
    location: LocationIds.meridian,
    availableFrom: 0,
    availableUntil: 500,
    headline: 'Docking fees suspended for independent haulers',
    body: 'Meridian Station is short on carriers. Independent freighters dock free until further notice.',
  },
] as const satisfies readonly BulletinDef[];
