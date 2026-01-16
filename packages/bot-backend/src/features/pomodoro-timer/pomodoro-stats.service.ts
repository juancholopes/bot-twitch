import * as fs from 'fs';
import * as path from 'path';
import type { PomodoroStats, SessionRecord, TimerPhase } from '@bot-twitch/shared';
import logger from '../../utils/logger';

/**
 * PomodoroStatsService
 * Handles tracking and persistence of pomodoro statistics
 * Scope Rule: Local to pomodoro-timer feature (only this feature uses it)
 */
export class PomodoroStatsService {
  private readonly statsPath: string;
  private stats: Record<string, PomodoroStats> = {};

  constructor(dataDir = './data') {
    this.statsPath = path.join(dataDir, 'pomodoro-stats.json');
    this.ensureDataDirectory(dataDir);
    this.loadAllStats();
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(dataDir: string): void {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    }
  }

  /**
   * Load all statistics from file
   */
  private loadAllStats(): void {
    try {
      if (!fs.existsSync(this.statsPath)) {
        this.stats = {};
        this.saveAllStats();
        logger.info('Created new pomodoro stats file');
        return;
      }

      const data = fs.readFileSync(this.statsPath, 'utf-8');
      this.stats = JSON.parse(data);
      logger.info('Pomodoro statistics loaded successfully');
    } catch (error) {
      logger.error('Error loading pomodoro stats:', error);
      this.stats = {};
    }
  }

  /**
   * Save all statistics to file
   */
  private saveAllStats(): void {
    try {
      fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Error saving pomodoro stats:', error);
      throw error;
    }
  }

  /**
   * Get date key in YYYY-MM-DD format
   */
  private getDateKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Ensure stats object exists for a given date
   */
  private ensureStatsForDate(dateKey: string): PomodoroStats {
    if (!this.stats[dateKey]) {
      this.stats[dateKey] = {
        date: dateKey,
        sessionsCompleted: 0,
        shortBreaksTaken: 0,
        longBreaksTaken: 0,
        totalWorkTime: 0,
        sessions: [],
      };
    }
    return this.stats[dateKey];
  }

  /**
   * Record a completed or cancelled session
   */
  recordSession(session: SessionRecord): void {
    try {
      const dateKey = this.getDateKey(new Date(session.startTime));
      const dayStats = this.ensureStatsForDate(dateKey);

      // Add session to history
      dayStats.sessions.push(session);

      // Update counters only if session was completed
      if (session.completed) {
        if (session.type === 'work') {
          dayStats.sessionsCompleted++;
          dayStats.totalWorkTime += session.durationMinutes;
        } else if (session.type === 'shortBreak') {
          dayStats.shortBreaksTaken++;
        } else if (session.type === 'longBreak') {
          dayStats.longBreaksTaken++;
        }
      }

      this.saveAllStats();
      logger.info(`Recorded ${session.type} session: completed=${session.completed}, duration=${session.durationMinutes}min`);
    } catch (error) {
      logger.error('Error recording session:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a specific date
   */
  getStatsForDate(date: string): PomodoroStats | null {
    return this.stats[date] || null;
  }

  /**
   * Get statistics for today
   */
  getTodayStats(): PomodoroStats {
    const dateKey = this.getDateKey();
    return this.ensureStatsForDate(dateKey);
  }

  /**
   * Get statistics for a date range
   */
  getStatsForDateRange(startDate: string, endDate: string): PomodoroStats[] {
    const result: PomodoroStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const dateKey in this.stats) {
      const date = new Date(dateKey);
      if (date >= start && date <= end) {
        result.push(this.stats[dateKey]);
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, PomodoroStats> {
    return { ...this.stats };
  }

  /**
   * Get total sessions completed today
   */
  getTotalSessionsToday(): number {
    const todayStats = this.getTodayStats();
    return todayStats.sessionsCompleted;
  }

  /**
   * Clear statistics for a specific date
   */
  clearStatsForDate(date: string): void {
    if (this.stats[date]) {
      delete this.stats[date];
      this.saveAllStats();
      logger.info(`Cleared stats for date: ${date}`);
    }
  }

  /**
   * Clear all statistics (use with caution)
   */
  clearAllStats(): void {
    this.stats = {};
    this.saveAllStats();
    logger.warn('All pomodoro statistics cleared');
  }
}
