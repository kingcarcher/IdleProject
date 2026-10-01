import { describe, expect, it } from 'vitest';
import { allLocations, MAP_BOUNDS } from '@/content';
import { generateStarfield, mulberry32, systemName } from './starfield';

const avoid = allLocations.map((location) => location.position);
const reserved = allLocations.flatMap((l) => (l.catalogName ? [l.catalogName] : []));

describe('starfield', () => {
  it('is deterministic for a given seed', () => {
    const a = generateStarfield(2201, MAP_BOUNDS, avoid, { reserved });
    const b = generateStarfield(2201, MAP_BOUNDS, avoid, { reserved });
    expect(a).toEqual(b);
    expect(generateStarfield(7, MAP_BOUNDS, avoid)).not.toEqual(a);
  });

  it('places the requested number of uniquely named specks inside the bounds', () => {
    const field = generateStarfield(2201, MAP_BOUNDS, avoid, { specks: 80, reserved });
    expect(field.specks).toHaveLength(80);
    expect(new Set(field.specks.map((speck) => speck.name)).size).toBe(80);
    for (const speck of field.specks) {
      expect(speck.x).toBeGreaterThanOrEqual(MAP_BOUNDS.minX);
      expect(speck.x).toBeLessThanOrEqual(MAP_BOUNDS.maxX);
      expect(speck.y).toBeGreaterThanOrEqual(MAP_BOUNDS.minY);
      expect(speck.y).toBeLessThanOrEqual(MAP_BOUNDS.maxY);
      expect(reserved).not.toContain(speck.name);
    }
  });

  it('keeps specks clear of real locations and of each other', () => {
    const minDistance = 28;
    const { specks } = generateStarfield(2201, MAP_BOUNDS, avoid, { minDistance });
    for (const speck of specks) {
      for (const point of avoid) {
        expect(Math.hypot(point.x - speck.x, point.y - speck.y)).toBeGreaterThanOrEqual(
          minDistance - 0.2,
        );
      }
      for (const other of specks) {
        if (other === speck) continue;
        expect(Math.hypot(other.x - speck.x, other.y - speck.y)).toBeGreaterThanOrEqual(
          minDistance - 0.2,
        );
      }
    }
  });

  it('generates catalogue-style names', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i += 1) {
      expect(systemName(rng)).toMatch(
        /^(HD \d{4,5}|Gliese \d{3}|Kepler-\d{2,4}|Wolf \d{3,4}|Ross \d{3}|Lacaille \d{4}|Luyten \d{3}|[A-Z][a-z]+ [A-ZÖa-zö]+)$/u,
      );
    }
  });
});
