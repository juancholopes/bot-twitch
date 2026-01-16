/**
 * Pomodoro Timer Types
 * Shared between backend and frontend (Scope Rule: 2+ features usage)
 */

/**
 * Timer phase types
 */
export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';

/**
 * Pomodoro configuration
 * Persisted in data/pomodoro-config.json
 */
export interface PomodoroConfig {
  workDuration: number;              // in minutes
  shortBreakDuration: number;        // in minutes
  longBreakDuration: number;         // in minutes
  sessionsBeforeLongBreak: number;   // number of work sessions
}

/**
 * Current state of the timer
 * Sent via WebSocket for real-time updates
 */
export interface PomodoroState {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  sessionCount: number;              // completed work sessions in current cycle
  totalSessionsToday: number;        // total work sessions completed today
  currentSessionStartTime?: string;  // ISO 8601 timestamp
}

/**
 * Record of a single pomodoro session
 */
export interface SessionRecord {
  startTime: string;      // ISO 8601
  endTime: string;        // ISO 8601
  type: TimerPhase;
  durationMinutes: number;
  completed: boolean;     // false if paused/cancelled
}

/**
 * Daily statistics for pomodoro sessions
 * Stored in data/pomodoro-stats.json grouped by date
 */
export interface PomodoroStats {
  date: string;  // YYYY-MM-DD
  sessionsCompleted: number;
  shortBreaksTaken: number;
  longBreaksTaken: number;
  totalWorkTime: number;  // in minutes
  sessions: SessionRecord[];
}

/**
 * Statistics query response with date range
 */
export interface PomodoroStatsRange {
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalWorkTime: number;
  dailyStats: PomodoroStats[];
}
