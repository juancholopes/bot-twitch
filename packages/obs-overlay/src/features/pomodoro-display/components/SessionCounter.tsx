import React from 'react';
import styled from 'styled-components';

interface SessionCounterProps {
  count: number;
  totalToday: number;
}

const CounterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const CountLabel = styled.div`
  font-size: 18px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
`;

const CountValue = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const TodayTotal = styled.div`
  font-size: 16px;
  color: #64748b;
  margin-top: 4px;
`;

/**
 * SessionCounter Component
 * Displays completed sessions in current cycle and total today
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export const SessionCounter: React.FC<SessionCounterProps> = ({ count, totalToday }) => {
  return (
    <CounterContainer>
      <CountLabel>Sesiones Completadas</CountLabel>
      <CountValue>{count}</CountValue>
      <TodayTotal>Total hoy: {totalToday}</TodayTotal>
    </CounterContainer>
  );
};
