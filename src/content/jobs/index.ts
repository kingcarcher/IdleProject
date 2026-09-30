import { JobIds, LocationIds } from '../ids';
import type { JobDef } from '../types';

export const jobs = [
  {
    id: JobIds.haldenToMeridian,
    title: 'Grain haul to Meridian',
    description: 'Forty containers of processed grain. Nobody will notice if it arrives late.',
    from: LocationIds.halden,
    to: LocationIds.meridian,
    pay: 4000,
  },
  {
    id: JobIds.meridianToHalden,
    title: 'Machine parts to Halden',
    description: 'Replacement parts for the Halden agricultural combines.',
    from: LocationIds.meridian,
    to: LocationIds.halden,
    pay: 3500,
  },
] as const satisfies readonly JobDef[];
