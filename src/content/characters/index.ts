import { CharacterIds, LocationIds } from '../ids';
import type { CharacterDef } from '../types';

export const characters = [
  {
    id: CharacterIds.bartender,
    name: 'Seven',
    role: 'bartender',
    description:
      'A service robot behind the bar of The Long Wait. It remembers every order you have ever made.',
    home: LocationIds.haldenBar,
    initialRelationship: 40,
    driftPerMonth: 0,
  },
  {
    id: CharacterIds.ilse,
    name: 'Ilse Varga',
    role: 'acquaintance',
    description: 'A dock clerk on Meridian Station with family back on Halden.',
    home: LocationIds.meridian,
    initialRelationship: 10,
    driftPerMonth: 0,
  },
  {
    id: CharacterIds.mother,
    name: 'Ruth',
    role: 'mother',
    description:
      'Your mother. Twenty-two years on the same farm block, most of them spent paying for it. She still gets up before the lights do.',
    home: LocationIds.halden,
    initialRelationship: 75,
    driftPerMonth: 2,
  },
  {
    id: CharacterIds.partner,
    name: 'Mara',
    role: 'partner',
    description:
      'Your partner. She fixes irrigation controllers for the co-op and keeps a folder of apartment listings from stations neither of you has seen.',
    home: LocationIds.halden,
    initialRelationship: 70,
    driftPerMonth: 3,
  },
  {
    id: CharacterIds.friend,
    name: 'Teo',
    role: 'friend',
    description:
      'Your best friend since the school bus. Works the grain elevators and talks about leaving Halden the way other people talk about the weather.',
    home: LocationIds.halden,
    initialRelationship: 65,
    driftPerMonth: 2,
    moves: [{ day: 360, to: LocationIds.meridian }],
  },
] as const satisfies readonly CharacterDef[];
