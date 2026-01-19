import { usePomodoro } from './hooks/use-pomodoro';
import { TimerClock } from './components/TimerClock';
import { PhaseIndicator } from './components/PhaseIndicator';
import { SessionCounter } from './components/SessionCounter';

/**
 * PomodoroDisplay Component
 * Main container for pomodoro timer visualization on OBS overlay
 * 
 * Screaming Architecture: Name matches feature directory
 * Scope Rule: Container component local to this feature
 */
const PomodoroDisplay: React.FC = () => {
  const { state, isConnected } = usePomodoro();

  console.log('[PomodoroDisplay] State:', state);
  console.log('[PomodoroDisplay] isConnected:', isConnected);

  const connectionColor = isConnected ? '#10b981' : '#ef4444';
  const connectionGlow = isConnected ? '#10b98180' : '#ef444480';

  if (!state) {
    return (
      <div className="pointer-events-none fixed right-[50px] top-[50px] min-w-[350px] rounded-2xl border-2 border-white/10 bg-[rgba(15,23,42,0.95)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5),0_0_100px_rgba(0,0,0,0.3)] backdrop-blur-[10px]">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center text-[18px] text-slate-400">Cargando timer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed right-[50px] top-[50px] min-w-[350px] rounded-2xl border-2 border-white/10 bg-[rgba(15,23,42,0.95)] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.5),0_0_100px_rgba(0,0,0,0.3)] backdrop-blur-[10px]">
      <div
        className="absolute right-3 top-3 h-3 w-3 rounded-full"
        style={{ backgroundColor: connectionColor, boxShadow: `0 0 10px ${connectionGlow}` }}
      />
      <div className="flex flex-col items-center gap-6">
        <PhaseIndicator phase={state.phase} />
        <TimerClock remainingSeconds={state.remainingSeconds} />
        <SessionCounter count={state.sessionCount} totalToday={state.totalSessionsToday} />
      </div>
    </div>
  );
};

export default PomodoroDisplay;
