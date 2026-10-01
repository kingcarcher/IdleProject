import { useState } from 'react';
import {
  allLocations,
  getLocation,
  MAP_BOUNDS,
  type LocationDef,
  type MapPosition,
} from '@/content';
import {
  availableJobs,
  distanceBetween,
  formatDuration,
  journeyProgress,
  knownLocations,
  shipSpeed,
} from '@/engine';
import { Panel } from '../components/Panel';
import { useGame } from '../GameContext';
import { generateStarfield } from '../map/starfield';

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 400;
const LABEL_FONT_PX = 10;

// The decorative field never changes between runs; nothing in this game is random.
const STARFIELD = generateStarfield(
  2201,
  MAP_BOUNDS,
  allLocations.map((location) => location.position),
  { reserved: allLocations.flatMap((l) => (l.catalogName ? [l.catalogName] : [])) },
);

interface Tooltip {
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

function project(position: MapPosition): MapPosition {
  return {
    x: ((position.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * VIEW_WIDTH,
    y: ((position.y - MAP_BOUNDS.minY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY)) * VIEW_HEIGHT,
  };
}

export function MapScreen() {
  const { state } = useGame();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const here = getLocation(state.location);
  const hereId = here.parent ?? here.id;
  const named = knownLocations(state);
  const unfounded = allLocations.filter(
    (location) =>
      location.kind !== 'bar' &&
      location.availableFrom !== undefined &&
      state.day < location.availableFrom,
  );
  const speed = shipSpeed(state.ship);

  const journey = state.journey;
  const lanes: readonly (readonly [LocationDef, LocationDef])[] = journey
    ? [[getLocation(journey.from), getLocation(journey.to)]]
    : availableJobs(state).map((job) => [getLocation(hereId), getLocation(job.to)] as const);
  const ship = journey
    ? lerp(
        project(getLocation(journey.from).position),
        project(getLocation(journey.to).position),
        journeyProgress(journey),
      )
    : null;

  const showTooltip = (name: string, position: MapPosition) => {
    const point = project(position);
    setTooltip({ name, x: point.x, y: point.y });
  };
  const toggleTooltip = (name: string, position: MapPosition) => {
    if (tooltip?.name === name) setTooltip(null);
    else showTooltip(name, position);
  };

  return (
    <Panel title="Charted lanes">
      <svg
        className="starmap"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label="Star map of the charted lanes"
        onPointerLeave={() => setTooltip(null)}
      >
        <defs>
          <radialGradient id="starmap-space" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#141a27" />
            <stop offset="100%" stopColor="#07090e" />
          </radialGradient>
          <radialGradient id="starmap-nebula">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="starmap-nebula-cold">
            <stop offset="0%" stopColor="#4a6a8a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4a6a8a" stopOpacity="0" />
          </radialGradient>
          <filter id="starmap-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#starmap-space)" />
        <ellipse cx={450} cy={120} rx={220} ry={110} fill="url(#starmap-nebula)" />
        <ellipse cx={140} cy={300} rx={190} ry={90} fill="url(#starmap-nebula-cold)" />

        <g className="starmap__background">
          {STARFIELD.background.map((star, index) => {
            const point = project(star);
            return (
              <circle
                key={index}
                className="starmap__star"
                cx={point.x}
                cy={point.y}
                r={star.r}
                style={
                  { '--o': star.opacity, animationDelay: `${star.delay}s` } as React.CSSProperties
                }
              />
            );
          })}
        </g>

        <g className="starmap__lanes">
          {lanes.map(([from, to]) => {
            const a = project(from.position);
            const b = project(to.position);
            return (
              <line
                key={`${from.id}-${to.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={journey ? 'starmap__lane starmap__lane--active' : 'starmap__lane'}
              />
            );
          })}
        </g>

        <g className="starmap__specks">
          {STARFIELD.specks.map((speck) => (
            <Speck
              key={speck.name}
              name={speck.name}
              position={speck}
              size={speck.size}
              onShow={showTooltip}
              onToggle={toggleTooltip}
            />
          ))}
          {unfounded.map((location) => (
            <Speck
              key={location.id}
              name={location.catalogName ?? 'Uncharted system'}
              position={location.position}
              size={1.6}
              onShow={showTooltip}
              onToggle={toggleTooltip}
            />
          ))}
        </g>

        <g className="starmap__nodes">
          {named.map((location) => {
            const point = project(location.position);
            const isHere = location.id === hereId;
            const labelLeft = point.x > VIEW_WIDTH * 0.72;
            return (
              <g
                key={location.id}
                className={isHere ? 'starmap__node starmap__node--here' : 'starmap__node'}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHere ? 5 : 3.5}
                  filter="url(#starmap-glow)"
                />
                <text
                  x={labelLeft ? point.x - 9 : point.x + 9}
                  y={point.y + 3.5}
                  textAnchor={labelLeft ? 'end' : 'start'}
                >
                  {location.name}
                </text>
              </g>
            );
          })}
        </g>

        {ship && (
          <g className="starmap__ship" transform={`translate(${ship.x} ${ship.y})`}>
            <polygon points="0,-5 4,4 0,2 -4,4" />
          </g>
        )}

        {tooltip && <TooltipLabel tooltip={tooltip} />}
      </svg>

      <dl className="facts">
        {named
          .filter((location) => location.id !== hereId)
          .map((location) => {
            const days = Math.ceil(distanceBetween(getLocation(hereId), location) / speed);
            return (
              <div key={location.id} className="facts__row">
                <dt>{location.name}</dt>
                <dd>{formatDuration(days)} away</dd>
              </div>
            );
          })}
      </dl>
      <p className="muted">
        Named worlds are where you can dock. Hover or tap a speck to read its catalogue name;
        colonies are founded there as the years pass.
      </p>
    </Panel>
  );
}

interface SpeckProps {
  readonly name: string;
  readonly position: MapPosition;
  readonly size: number;
  readonly onShow: (name: string, position: MapPosition) => void;
  readonly onToggle: (name: string, position: MapPosition) => void;
}

function Speck({ name, position, size, onShow, onToggle }: SpeckProps) {
  const point = project(position);
  return (
    <g
      className="starmap__speck"
      onPointerEnter={() => onShow(name, position)}
      onClick={() => onToggle(name, position)}
    >
      <circle cx={point.x} cy={point.y} r={size} />
      {/* Generous invisible hit area so fingers can find a two-pixel star. */}
      <circle cx={point.x} cy={point.y} r={9} className="starmap__hit" />
      <title>{name}</title>
    </g>
  );
}

function TooltipLabel({ tooltip }: { readonly tooltip: Tooltip }) {
  const width = tooltip.name.length * LABEL_FONT_PX * 0.62 + 14;
  const height = 18;
  const above = tooltip.y > height + 12;
  const x = Math.min(VIEW_WIDTH - width - 4, Math.max(4, tooltip.x - width / 2));
  const y = above ? tooltip.y - height - 8 : tooltip.y + 10;
  return (
    <g className="starmap__tooltip" transform={`translate(${x} ${y})`}>
      <rect width={width} height={height} rx={3} />
      <text x={width / 2} y={height / 2 + 3.5} textAnchor="middle">
        {tooltip.name}
      </text>
    </g>
  );
}

function lerp(a: MapPosition, b: MapPosition, t: number): MapPosition {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
