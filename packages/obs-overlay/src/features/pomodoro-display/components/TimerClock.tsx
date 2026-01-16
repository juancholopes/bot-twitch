import React from 'react';
import styled from 'styled-components';

interface TimerClockProps {
  remainingSeconds: number;
}

const ClockContainer = styled.div`
  font-size: 72px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #ffffff;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 255, 255, 0.3);
  letter-spacing: 4px;
  text-align: center;
`;

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
    <ClockContainer>
      {formatTime(remainingSeconds)}
    </ClockContainer>
  );
};
