import type { ComponentType } from 'react';
import type { Phase } from '@/engine';
import { StatusBar } from './components/StatusBar';
import { TextLog } from './components/TextLog';
import { useGame } from './GameContext';
import { BarScreen } from './screens/BarScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { StationScreen } from './screens/StationScreen';

// The current screen is derived from the game phase; there is no router.
const SCREENS: Record<Phase, ComponentType> = {
  station: StationScreen,
  journey: JourneyScreen,
  bar: BarScreen,
  gameOver: GameOverScreen,
};

export function App() {
  const { state } = useGame();
  const Screen = SCREENS[state.phase];

  return (
    <div className="app">
      <StatusBar />
      <main className="screen">
        <Screen />
      </main>
      <TextLog />
    </div>
  );
}
