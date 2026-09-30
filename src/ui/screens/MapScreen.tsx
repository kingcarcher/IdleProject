import { getLocation } from '@/content';
import { distanceBetween, formatDuration, knownLocations, shipSpeed } from '@/engine';
import { Panel } from '../components/Panel';
import { useGame } from '../GameContext';

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 200;
const PADDING = 24;

export function MapScreen() {
  const { state } = useGame();
  const here = getLocation(state.location);
  const locations = knownLocations(state);
  const speed = shipSpeed(state.ship);

  const xs = locations.map((location) => location.position.x);
  const ys = locations.map((location) => location.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (VIEW_WIDTH - PADDING * 2) / Math.max(1, maxX - minX);
  const scaleY = (VIEW_HEIGHT - PADDING * 2) / Math.max(1, maxY - minY);
  const scale = Math.min(scaleX, scaleY);
  const toView = (x: number, y: number) => ({
    x: PADDING + (x - minX) * scale,
    y: PADDING + (y - minY) * scale,
  });

  return (
    <Panel title="Charted lanes">
      <svg
        className="map"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label="Map of known locations"
      >
        {locations.map((location) => {
          const point = toView(location.position.x, location.position.y);
          const isHere = location.id === here.id || location.id === here.parent;
          // Labels flip to the left of the node in the right half so they stay inside the map.
          const labelLeft = point.x > VIEW_WIDTH / 2;
          return (
            <g key={location.id} className={isHere ? 'map__node map__node--here' : 'map__node'}>
              <circle cx={point.x} cy={point.y} r={isHere ? 5 : 3.5} />
              <text
                x={labelLeft ? point.x - 8 : point.x + 8}
                y={point.y + 4}
                textAnchor={labelLeft ? 'end' : 'start'}
              >
                {location.name}
              </text>
            </g>
          );
        })}
      </svg>
      <dl className="facts">
        {locations
          .filter((location) => location.id !== here.id && location.id !== here.parent)
          .map((location) => {
            const days = Math.ceil(distanceBetween(here, location) / speed);
            return (
              <div key={location.id} className="facts__row">
                <dt>{location.name}</dt>
                <dd>{formatDuration(days)} away</dd>
              </div>
            );
          })}
      </dl>
    </Panel>
  );
}
