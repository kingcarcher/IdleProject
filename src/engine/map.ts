import { allLocations, type LocationDef, type LocationId } from '@/content';
import type { GameState } from './state';

export function distanceBetween(a: LocationDef, b: LocationDef): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.hypot(dx, dy);
}

/** Planets and stations that exist on the map by the current in-game day. */
export function knownLocations(state: GameState): readonly LocationDef[] {
  return allLocations.filter(
    (location) =>
      location.kind !== 'bar' &&
      (location.availableFrom === undefined || state.day >= location.availableFrom),
  );
}

/** The bar attached to a planet/station, if it has one. */
export function barAt(locationId: LocationId): LocationDef | null {
  return (
    allLocations.find((location) => location.kind === 'bar' && location.parent === locationId) ??
    null
  );
}
