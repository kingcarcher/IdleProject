import type { MapBounds, MapPosition } from '@/content';

/** An anonymous system drawn as a dot; its name only shows on hover or tap. */
export interface Speck {
  readonly x: number;
  readonly y: number;
  readonly name: string;
  readonly size: number;
}

export interface BackgroundStar {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly opacity: number;
  /** Seconds, so each star twinkles out of phase with its neighbours. */
  readonly delay: number;
}

export interface Starfield {
  readonly specks: readonly Speck[];
  readonly background: readonly BackgroundStar[];
}

export type Rng = () => number;

/** Small, fast seeded PRNG; the map must look the same on every visit. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GREEK = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega',
] as const;

const CONSTELLATIONS = [
  'Ceti',
  'Eridani',
  'Draconis',
  'Lyrae',
  'Aquilae',
  'Cygni',
  'Boötis',
  'Hydri',
  'Pavonis',
  'Indi',
  'Tucanae',
  'Reticuli',
  'Doradus',
  'Carinae',
  'Velorum',
  'Puppis',
  'Serpentis',
  'Ophiuchi',
  'Herculis',
  'Leporis',
  'Fornacis',
  'Sculptoris',
  'Columbae',
  'Lupi',
] as const;

function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

/** A plausible star-catalogue designation. */
export function systemName(rng: Rng): string {
  switch (int(rng, 0, 7)) {
    case 0:
      return `HD ${int(rng, 1000, 99999)}`;
    case 1:
      return `Gliese ${int(rng, 100, 999)}`;
    case 2:
      return `Kepler-${int(rng, 10, 1999)}`;
    case 3:
      return `Wolf ${int(rng, 100, 1500)}`;
    case 4:
      return `Ross ${int(rng, 100, 999)}`;
    case 5:
      return `Lacaille ${int(rng, 1000, 9999)}`;
    case 6:
      return `Luyten ${int(rng, 100, 999)}`;
    default:
      return `${pick(rng, GREEK)} ${pick(rng, CONSTELLATIONS)}`;
  }
}

export interface StarfieldOptions {
  readonly specks?: number;
  readonly background?: number;
  /** Map units a speck must keep from every other speck and from the real locations. */
  readonly minDistance?: number;
  /** Names already used by real locations; specks never reuse them. */
  readonly reserved?: readonly string[];
}

export function generateStarfield(
  seed: number,
  bounds: MapBounds,
  avoid: readonly MapPosition[],
  options: StarfieldOptions = {},
): Starfield {
  const {
    specks: speckCount = 80,
    background: backgroundCount = 180,
    minDistance = 28,
    reserved = [],
  } = options;
  const rng = mulberry32(seed);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const names = new Set<string>(reserved);
  const placed: MapPosition[] = [...avoid];
  const specks: Speck[] = [];
  const maxAttempts = speckCount * 50;
  for (let attempt = 0; specks.length < speckCount && attempt < maxAttempts; attempt += 1) {
    const x = bounds.minX + rng() * width;
    const y = bounds.minY + rng() * height;
    if (placed.some((point) => Math.hypot(point.x - x, point.y - y) < minDistance)) continue;

    let name = systemName(rng);
    for (let retry = 0; names.has(name) && retry < 20; retry += 1) name = systemName(rng);
    if (names.has(name)) continue;

    names.add(name);
    placed.push({ x, y });
    specks.push({ x: round1(x), y: round1(y), name, size: round1(0.8 + rng() * 1.2) });
  }

  const background: BackgroundStar[] = [];
  for (let i = 0; i < backgroundCount; i += 1) {
    background.push({
      x: round1(bounds.minX + rng() * width),
      y: round1(bounds.minY + rng() * height),
      r: round1(0.3 + rng() * 0.9),
      opacity: round1(0.25 + rng() * 0.6),
      delay: round1(rng() * 6),
    });
  }

  return { specks, background };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
