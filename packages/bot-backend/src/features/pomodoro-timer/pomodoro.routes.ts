import { Router, Request, Response } from 'express';
import type { PomodoroConfig } from '@bot-twitch/shared';
import { PomodoroTimerService } from './pomodoro-timer.service';
import { PomodoroConfigService } from './pomodoro-config.service';
import { PomodoroStatsService } from './pomodoro-stats.service';
import logger from '@infrastructure/logging/logger';

/**
 * Create Pomodoro routes
 * Provides REST API for timer control, configuration, and statistics
 */
export function createPomodoroRoutes(
  timerService: PomodoroTimerService,
  configService: PomodoroConfigService,
  statsService: PomodoroStatsService
): Router {
  const router = Router();

  // ===== Timer State =====
  
  /**
   * GET /api/pomodoro/state
   * Get current timer state
   */
  router.get('/state', (req: Request, res: Response) => {
    try {
      const state = timerService.getState();
      res.json(state);
    } catch (error) {
      logger.error('Error getting timer state:', error);
      res.status(500).json({ error: 'Failed to get timer state' });
    }
  });

  // ===== Timer Control =====

  /**
   * POST /api/pomodoro/start
   * Start or resume the timer
   */
  router.post('/start', (req: Request, res: Response) => {
    try {
      timerService.start();
      const state = timerService.getState();
      res.json({ message: 'Timer started', state });
    } catch (error) {
      logger.error('Error starting timer:', error);
      res.status(500).json({ error: 'Failed to start timer' });
    }
  });

  /**
   * POST /api/pomodoro/pause
   * Pause the timer
   */
  router.post('/pause', (req: Request, res: Response) => {
    try {
      timerService.pause();
      const state = timerService.getState();
      res.json({ message: 'Timer paused', state });
    } catch (error) {
      logger.error('Error pausing timer:', error);
      res.status(500).json({ error: 'Failed to pause timer' });
    }
  });

  /**
   * POST /api/pomodoro/reset
   * Reset timer to initial work phase
   */
  router.post('/reset', async (req: Request, res: Response) => {
    try {
      await timerService.reset();
      const state = timerService.getState();
      res.json({ message: 'Timer reset', state });
    } catch (error) {
      logger.error('Error resetting timer:', error);
      res.status(500).json({ error: 'Failed to reset timer' });
    }
  });

  /**
   * POST /api/pomodoro/skip
   * Skip to next phase
   */
  router.post('/skip', async (req: Request, res: Response) => {
    try {
      await timerService.skip();
      const state = timerService.getState();
      res.json({ message: 'Skipped to next phase', state });
    } catch (error) {
      logger.error('Error skipping phase:', error);
      res.status(500).json({ error: 'Failed to skip phase' });
    }
  });

  // ===== Configuration =====

  /**
   * GET /api/pomodoro/config
   * Get current configuration
   */
  router.get('/config', async (req: Request, res: Response) => {
    try {
      const config = await configService.load();
      res.json(config);
    } catch (error) {
      logger.error('Error getting config:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  });

  /**
   * PUT /api/pomodoro/config
   * Update configuration
   * Body: Partial<PomodoroConfig>
   */
  router.put('/config', async (req: Request, res: Response) => {
    try {
      const updates = req.body as Partial<PomodoroConfig>;
      
      // Validate updates
      if (updates.workDuration !== undefined && updates.workDuration <= 0) {
        return res.status(400).json({ error: 'Work duration must be greater than 0' });
      }
      if (updates.shortBreakDuration !== undefined && updates.shortBreakDuration <= 0) {
        return res.status(400).json({ error: 'Short break duration must be greater than 0' });
      }
      if (updates.longBreakDuration !== undefined && updates.longBreakDuration <= 0) {
        return res.status(400).json({ error: 'Long break duration must be greater than 0' });
      }
      if (updates.sessionsBeforeLongBreak !== undefined && updates.sessionsBeforeLongBreak <= 0) {
        return res.status(400).json({ error: 'Sessions before long break must be greater than 0' });
      }

      await timerService.updateConfig(updates);
      const config = await configService.load();
      res.json({ message: 'Configuration updated', config });
    } catch (error) {
      logger.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  /**
   * POST /api/pomodoro/config/reset
   * Reset configuration to defaults
   */
  router.post('/config/reset', async (req: Request, res: Response) => {
    try {
      await configService.resetToDefaults();
      await timerService.reloadConfig();
      const config = await configService.load();
      res.json({ message: 'Configuration reset to defaults', config });
    } catch (error) {
      logger.error('Error resetting config:', error);
      res.status(500).json({ error: 'Failed to reset configuration' });
    }
  });

  // ===== Statistics =====

  /**
   * GET /api/pomodoro/stats/today
   * Get statistics for today
   */
  router.get('/stats/today', async (req: Request, res: Response) => {
    try {
      const stats = await statsService.getTodayStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting today stats:', error);
      res.status(500).json({ error: 'Failed to get today statistics' });
    }
  });

  /**
   * GET /api/pomodoro/stats/:date
   * Get statistics for specific date (YYYY-MM-DD)
   */
  router.get('/stats/:date', async (req: Request, res: Response) => {
    try {
      const date = req.params.date as string;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const stats = await statsService.getStatsForDate(date);
      if (!stats) {
        return res.status(404).json({ error: 'No statistics found for this date' });
      }

      res.json(stats);
    } catch (error) {
      logger.error('Error getting stats for date:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  });

  /**
   * GET /api/pomodoro/stats/range
   * Get statistics for date range
   * Query params: start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  router.get('/stats/range', async (req: Request, res: Response) => {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ error: 'Both start and end dates are required' });
      }

      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start as string) || !/^\d{4}-\d{2}-\d{2}$/.test(end as string)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const stats = await statsService.getStatsForDateRange(start as string, end as string);
      
      // Calculate totals
      const totalSessions = stats.reduce((sum, day) => sum + day.sessionsCompleted, 0);
      const totalWorkTime = stats.reduce((sum, day) => sum + day.totalWorkTime, 0);

      res.json({
        startDate: start,
        endDate: end,
        totalSessions,
        totalWorkTime,
        dailyStats: stats,
      });
    } catch (error) {
      logger.error('Error getting stats range:', error);
      res.status(500).json({ error: 'Failed to get statistics range' });
    }
  });

  /**
   * GET /api/pomodoro/stats/all
   * Get all statistics
   */
  router.get('/stats/all', async (req: Request, res: Response) => {
    try {
      const allStats = await statsService.getAllStats();
      res.json(allStats);
    } catch (error) {
      logger.error('Error getting all stats:', error);
      res.status(500).json({ error: 'Failed to get all statistics' });
    }
  });

  /**
   * DELETE /api/pomodoro/stats/:date
   * Clear statistics for specific date
   */
  router.delete('/stats/:date', async (req: Request, res: Response) => {
    try {
      const date = req.params.date as string;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      await statsService.clearStatsForDate(date);
      res.json({ message: `Statistics cleared for ${date}` });
    } catch (error) {
      logger.error('Error clearing stats:', error);
      res.status(500).json({ error: 'Failed to clear statistics' });
    }
  });

  return router;
}
