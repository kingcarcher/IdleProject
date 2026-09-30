import { formatDate } from '@/engine';
import { useGame } from '../GameContext';
import { Panel } from './Panel';

const VISIBLE_ENTRIES = 12;

export function TextLog() {
  const { state } = useGame();
  const entries = state.log.slice(-VISIBLE_ENTRIES).reverse();

  return (
    <Panel title="Log">
      <ol className="log">
        {entries.map((entry, index) => (
          <li key={`${state.log.length - index}`} className="log__entry">
            <span className="log__date">{formatDate(entry.day)}</span>
            <span className="log__text">{entry.text}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
