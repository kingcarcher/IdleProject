import { useState } from 'react';
import { howToPlay } from '@/content';
import { useGame } from '../GameContext';
import { Panel } from './Panel';

interface HelpPanelProps {
  readonly onClose: () => void;
}

export function HelpPanel({ onClose }: HelpPanelProps) {
  const { dispatch } = useGame();
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  return (
    <Panel
      title="How this works"
      actions={
        <button type="button" onClick={onClose}>
          Close
        </button>
      }
    >
      <ul className="help">
        {howToPlay.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="inline-form">
        {confirmingRestart ? (
          <>
            <span className="warning">
              This erases the current save. Everyone you know forgets you.
            </span>
            <button
              type="button"
              className="button--danger"
              onClick={() => {
                setConfirmingRestart(false);
                onClose();
                dispatch({ type: 'NEW_GAME' });
              }}
            >
              Start over
            </button>
            <button type="button" onClick={() => setConfirmingRestart(false)}>
              Keep playing
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button--quiet"
            onClick={() => setConfirmingRestart(true)}
          >
            Start a new game
          </button>
        )}
      </div>
    </Panel>
  );
}
