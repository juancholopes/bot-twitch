import StreamTaskDisplay from '@features/stream-task-display/stream-task-display';
import NowPlayingDisplay from '@features/now-playing-display/now-playing-display';
import PomodoroDisplay from '@features/pomodoro-display/pomodoro-display';

/**
 * OBS Overlay App
 * 
 * Orchestrates all overlay features for OBS streaming.
 * Features are independent and self-contained.
 */
function App() {
  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden bg-transparent pointer-events-none">
      <StreamTaskDisplay />
      <NowPlayingDisplay />
      <PomodoroDisplay />
    </div>
  );
}

export default App;
