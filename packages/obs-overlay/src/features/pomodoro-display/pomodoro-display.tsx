import React from 'react';
import styled from 'styled-components';
import { usePomodoro } from './hooks/use-pomodoro';
import { TimerClock } from './components/TimerClock';
import { PhaseIndicator } from './components/PhaseIndicator';
import { SessionCounter } from './components/SessionCounter';

const Container = styled.div`
  position: fixed;
  top: 50px;
  right: 50px;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 10px 50px rgba(0, 0, 0, 0.5),
    0 0 100px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-width: 350px;
  pointer-events: none;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const LoadingMessage = styled.div`
  color: #64748b;
  font-size: 18px;
  text-align: center;
`;

const ConnectionStatus = styled.div<{ $isConnected: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$isConnected ? '#10b981' : '#ef4444'};
  box-shadow: 0 0 10px ${props => props.$isConnected ? '#10b98180' : '#ef444480'};
`;

/**
 * PomodoroDisplay Component
 * Main container for pomodoro timer visualization on OBS overlay
 * 
 * Screaming Architecture: Name matches feature directory
 * Scope Rule: Container component local to this feature
 */
const PomodoroDisplay: React.FC = () => {
  const { state, isConnected } = usePomodoro();

  if (!state) {
    return (
      <Container>
        <Content>
          <LoadingMessage>Cargando timer...</LoadingMessage>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <ConnectionStatus $isConnected={isConnected} />
      <Content>
        <PhaseIndicator phase={state.phase} />
        <TimerClock remainingSeconds={state.remainingSeconds} />
        <SessionCounter count={state.sessionCount} totalToday={state.totalSessionsToday} />
      </Content>
    </Container>
  );
};

export default PomodoroDisplay;
