import { CharacterIds, LocationIds } from '../ids';
import type { CharacterDef } from '../types';

export const characters = [
  {
    id: CharacterIds.bartender,
    name: 'Seven',
    description:
      'A service robot behind the bar of The Long Wait. It remembers every order you have ever made.',
    home: LocationIds.haldenBar,
    initialRelationship: 40,
  },
  {
    id: CharacterIds.ilse,
    name: 'Ilse Varga',
    description: 'A dock clerk on Meridian Station with family back on Halden.',
    home: LocationIds.meridian,
    initialRelationship: 10,
  },
] as const satisfies readonly CharacterDef[];
