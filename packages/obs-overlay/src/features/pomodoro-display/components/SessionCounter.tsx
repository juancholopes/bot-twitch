import React from 'react';

interface SessionCounterProps {
  count: number;
  totalToday: number;
}

/**
 * SessionCounter Component
 * Displays completed sessions in current cycle and total today
 * Scope Rule: Local to pomodoro-display feature (only this feature uses it)
 */
export const SessionCounter: React.FC<SessionCounterProps> = ({ count, totalToday }) => {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="text-[18px] font-semibold uppercase tracking-[2px] text-slate-400">Sesiones Completadas</div>
      <div className="text-[48px] font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">{count}</div>
      <div className="mt-1 text-[16px] text-slate-500">Total hoy: {totalToday}</div>
    </div>
  );
};
