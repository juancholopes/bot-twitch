import React from 'react';
import type { TimerPhase } from '@bot-twitch/shared';

interface PhaseIndicatorProps {
  phase: TimerPhase;
}

const getPhaseColor = (phase: TimerPhase): string => {
  switch (phase) {
    case 'work':
      return '#ef4444'; // red
    case 'shortBreak':
      return '#3b82f6'; // blue
    case 'longBreak':
      return '#10b981'; // green
  }
};

const getPhaseLabel = (phase: TimerPhase): string => {
  switch (phase) {
    case 'work':
      return '🎯 Sesión de Trabajo';
    case 'shortBreak':
      return '☕ Descanso Corto';
    case 'longBreak':
      return '🌴 Descanso Largo';
  }
};

/**
 * PhaseIndicator Component
 * Shows current pomodoro phase with color coding
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase }) => {
  const phaseColor = getPhaseColor(phase);

  return (
    <div
      className="mb-4 rounded-xl px-8 py-4 text-center text-[28px] font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-300"
      style={{
        backgroundColor: phaseColor,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px ${phaseColor}40`,
      }}
    >
      {getPhaseLabel(phase)}
    </div>
  );
};
