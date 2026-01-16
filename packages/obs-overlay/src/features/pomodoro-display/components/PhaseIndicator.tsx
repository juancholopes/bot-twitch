import React from 'react';
import styled from 'styled-components';
import type { TimerPhase } from '@bot-twitch/shared';

interface PhaseIndicatorProps {
  phase: TimerPhase;
}

interface IndicatorContainerProps {
  $phase: TimerPhase;
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

const IndicatorContainer = styled.div<IndicatorContainerProps>`
  background: ${props => getPhaseColor(props.$phase)};
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.4),
    0 0 40px ${props => getPhaseColor(props.$phase)}40;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
  transition: all 0.3s ease;
`;

/**
 * PhaseIndicator Component
 * Shows current pomodoro phase with color coding
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase }) => {
  return (
    <IndicatorContainer $phase={phase}>
      {getPhaseLabel(phase)}
    </IndicatorContainer>
  );
};
