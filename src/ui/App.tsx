import { useState, type ComponentType } from 'react';
import type { Phase } from '@/engine';
import { HelpPanel } from './components/HelpPanel';
import { StatusBar } from './components/StatusBar';
import { TextLog } from './components/TextLog';
import { useGame } from './GameContext';
import { BarScreen } from './screens/BarScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { IntroScreen } from './screens/IntroScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { StationScreen } from './screens/StationScreen';

// The current screen is derived from the game phase; there is no router.
const SCREENS: Record<Exclude<Phase, 'intro'>, ComponentType> = {
  station: StationScreen,
  journey: JourneyScreen,
  bar: BarScreen,
  gameOver: GameOverScreen,
};

export function App() {
  const { state } = useGame();
  const [helpOpen, setHelpOpen] = useState(false);

  if (state.phase === 'intro') {
    return (
      <div className="app">
        <main className="screen">
          <IntroScreen />
        </main>
      </div>
    );
  }

  const Screen = SCREENS[state.phase];

  return (
    <div className="app">
      <StatusBar helpOpen={helpOpen} onToggleHelp={() => setHelpOpen((open) => !open)} />
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      <main className="screen">
        <Screen />
      </main>
      <TextLog />
    </div>
  );
}
