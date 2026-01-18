import React from 'react';

interface TimerClockProps {
  remainingSeconds: number;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * TimerClock Component
 * Displays remaining time in MM:SS format
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export const TimerClock: React.FC<TimerClockProps> = ({ remainingSeconds }) => {
  return (
    <div className="text-center text-[72px] font-bold font-mono tracking-[4px] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
      {formatTime(remainingSeconds)}
    </div>
  );
};
