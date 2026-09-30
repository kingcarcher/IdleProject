import { UpgradeIds } from '../ids';
import type { UpgradeDef } from '../types';

export const upgrades = [
  {
    id: UpgradeIds.driveCoils,
    name: 'Refurbished drive coils',
    description: 'Second-hand coils from a decommissioned liner. Shorter jumps, fewer months lost.',
    cost: 6000,
    availableFrom: 360,
    speedMultiplier: 1.25,
  },
] as const satisfies readonly UpgradeDef[];
