import { supabase, type Database } from '@infrastructure/database';
import type { PomodoroStats, SessionRecord } from '@bot-twitch/shared';
import { getServerIdentifier, parseSupabaseError } from '@bot-twitch/shared';
import logger from '@infrastructure/logging/logger';

type StatsRow = Database['public']['Tables']['pomodoro_stats']['Row'];

/**
 * PomodoroStatsService - Secure Implementation
 *
 * Uses Supabase secure wrapper functions with:
 * - Rate limiting protection
 * - Input validation
 * - SQL injection prevention
 *
 * Scope Rule: Local a pomodoro-timer feature
 *
 * CAMBIOS vs versión anterior:
 * - Usa secure_update_pomodoro_stats en lugar de update directo
 * - Incluye manejo de errores de rate limiting
 * - Mantiene cache en memoria para reducir queries
 */
export class PomodoroStatsServiceSecure {
  private statsCache: Map<string, PomodoroStats> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL_MS = 30000; // 30 segundos

  /**
   * Get date key in YYYY-MM-DD format
   */
  private getDateKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if cache is valid for a date
   */
  private isCacheValid(dateKey: string): boolean {
    const expiry = this.cacheExpiry.get(dateKey);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  /**
   * Invalidate cache for a date
   */
  private invalidateCache(dateKey: string): void {
    this.statsCache.delete(dateKey);
    this.cacheExpiry.delete(dateKey);
  }

  /**
   * Ensure stats object exists for a given date
   * READ operations don't have rate limits
   */
  private async ensureStatsForDate(dateKey: string): Promise<PomodoroStats> {
    // Check cache first
    if (this.isCacheValid(dateKey)) {
      return this.statsCache.get(dateKey)!;
    }

    try {
      // Try to fetch from DB (using public view for reads)
      const { data, error } = await supabase
        .from('pomodoro_stats')
        .select('*')
        .eq('date', dateKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows
        logger.error(`Error fetching stats for ${dateKey}:`, error);
        throw error;
      }

      if (data) {
        const row = data as StatsRow;
        // Convert DB format to PomodoroStats
        const stats: PomodoroStats = {
          date: row.date,
          sessionsCompleted: row.sessions_completed,
          shortBreaksTaken: row.short_breaks_taken,
          longBreaksTaken: row.long_breaks_taken,
          totalWorkTime: row.total_work_time,
          sessions: (row.sessions as SessionRecord[]) || [],
        };

        // Cache it
        this.statsCache.set(dateKey, stats);
        this.cacheExpiry.set(dateKey, Date.now() + this.CACHE_TTL_MS);
        return stats;
      }

      // Return empty stats if not found
      const newStats: PomodoroStats = {
        date: dateKey,
        sessionsCompleted: 0,
        shortBreaksTaken: 0,
        longBreaksTaken: 0,
        totalWorkTime: 0,
        sessions: [],
      };

      return newStats;
    } catch (error) {
      logger.error('Unexpected error ensuring stats:', error);
      // Return empty stats as fallback
      return {
        date: dateKey,
        sessionsCompleted: 0,
        shortBreaksTaken: 0,
        longBreaksTaken: 0,
        totalWorkTime: 0,
        sessions: [],
      };
    }
  }

  /**
   * Record a completed or cancelled session
   * Uses secure function with rate limiting
   */
  async recordSession(
    session: SessionRecord,
    context?: { identifier?: string }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const dateKey = this.getDateKey(new Date(session.startTime));
      const dayStats = await this.ensureStatsForDate(dateKey);

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

      // Use secure function to update
      const identifier = context?.identifier || getServerIdentifier();

      const { data: success, error } = await supabase.rpc('secure_update_pomodoro_stats', {
        p_date: dateKey,
        p_sessions_completed: dayStats.sessionsCompleted,
        p_short_breaks: dayStats.shortBreaksTaken,
        p_long_breaks: dayStats.longBreaksTaken,
        p_total_work_time: dayStats.totalWorkTime,
        p_sessions: dayStats.sessions as any,
        p_identifier: identifier,
      });

      if (error) {
        const parsed = parseSupabaseError(error);
        logger.error('Error updating stats:', parsed.message);
        return { success: false, message: parsed.userMessage };
      }

      // Invalidate cache to force refresh
      this.invalidateCache(dateKey);

      logger.info(
        `Recorded ${session.type} session: completed=${session.completed}, duration=${session.durationMinutes}min`
      );

      return { success: true };
    } catch (error) {
      logger.error('Error recording session:', error);
      return { success: false, message: 'Error inesperado al guardar sesión' };
    }
  }

  /**
   * Get statistics for a specific date
   * READ operation - no rate limit
   */
  async getStatsForDate(date: string): Promise<PomodoroStats | null> {
    try {
      return await this.ensureStatsForDate(date);
    } catch (error) {
      logger.error(`Error getting stats for ${date}:`, error);
      return null;
    }
  }

  /**
   * Get statistics for today
   * READ operation - no rate limit
   */
  async getTodayStats(): Promise<PomodoroStats> {
    const dateKey = this.getDateKey();
    return await this.ensureStatsForDate(dateKey);
  }

  /**
   * Get statistics for a date range
   * READ operation - no rate limit
   */
  async getStatsForDateRange(startDate: string, endDate: string): Promise<PomodoroStats[]> {
    try {
      const { data, error } = await supabase
        .from('pomodoro_stats')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        logger.error('Error fetching stats range:', error);
        return [];
      }

      return ((data || []) as StatsRow[]).map((row) => ({
        date: row.date,
        sessionsCompleted: row.sessions_completed,
        shortBreaksTaken: row.short_breaks_taken,
        longBreaksTaken: row.long_breaks_taken,
        totalWorkTime: row.total_work_time,
        sessions: (row.sessions as SessionRecord[]) || [],
      }));
    } catch (error) {
      logger.error('Unexpected error getting stats range:', error);
      return [];
    }
  }

  /**
   * Get all statistics
   * READ operation - no rate limit
   */
  async getAllStats(): Promise<Record<string, PomodoroStats>> {
    try {
      const { data, error } = await supabase
        .from('pomodoro_stats')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        logger.error('Error fetching all stats:', error);
        return {};
      }

      const result: Record<string, PomodoroStats> = {};
      for (const row of (data || []) as StatsRow[]) {
        result[row.date] = {
          date: row.date,
          sessionsCompleted: row.sessions_completed,
          shortBreaksTaken: row.short_breaks_taken,
          longBreaksTaken: row.long_breaks_taken,
          totalWorkTime: row.total_work_time,
          sessions: (row.sessions as SessionRecord[]) || [],
        };
      }

      return result;
    } catch (error) {
      logger.error('Unexpected error getting all stats:', error);
      return {};
    }
  }

  /**
   * Get total sessions completed today
   * READ operation - no rate limit
   */
  async getTotalSessionsToday(): Promise<number> {
    const todayStats = await this.getTodayStats();
    return todayStats.sessionsCompleted;
  }

  /**
   * Clear statistics for a specific date
   * ADMIN operation - uses direct delete
   */
  async clearStatsForDate(date: string): Promise<void> {
    try {
      const { error } = await supabase.from('pomodoro_stats').delete().eq('date', date);

      if (error) {
        logger.error(`Error clearing stats for ${date}:`, error);
        throw error;
      }

      this.invalidateCache(date);
      logger.info(`Cleared stats for date: ${date}`);
    } catch (error) {
      logger.error('Error clearing stats:', error);
      throw error;
    }
  }

  /**
   * Clear all statistics (use with caution)
   * ADMIN operation - uses direct delete
   */
  async clearAllStats(): Promise<void> {
    try {
      const { error } = await supabase
        .from('pomodoro_stats')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all workaround

      if (error) {
        logger.error('Error clearing all stats:', error);
        throw error;
      }

      // Clear cache
      this.statsCache.clear();
      this.cacheExpiry.clear();

      logger.warn('All pomodoro statistics cleared');
    } catch (error) {
      logger.error('Error clearing all stats:', error);
      throw error;
    }
  }

  /**
   * Update stats manually (for migrations or corrections)
   * Uses secure function with rate limiting
   */
  async updateStats(
    stats: PomodoroStats,
    context?: { identifier?: string }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const identifier = context?.identifier || getServerIdentifier();

      const { data: success, error } = await supabase.rpc('secure_update_pomodoro_stats', {
        p_date: stats.date,
        p_sessions_completed: stats.sessionsCompleted,
        p_short_breaks: stats.shortBreaksTaken,
        p_long_breaks: stats.longBreaksTaken,
        p_total_work_time: stats.totalWorkTime,
        p_sessions: stats.sessions as any,
        p_identifier: identifier,
      });

      if (error) {
        const parsed = parseSupabaseError(error);
        logger.error('Error updating stats manually:', parsed.message);
        return { success: false, message: parsed.userMessage };
      }

      this.invalidateCache(stats.date);
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating stats:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }
}
