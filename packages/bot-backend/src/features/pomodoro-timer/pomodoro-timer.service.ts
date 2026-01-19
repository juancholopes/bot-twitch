import { EventEmitter } from 'events';
import type { PomodoroConfig, PomodoroState, TimerPhase, SessionRecord } from '@bot-twitch/shared';
import logger from '../../utils/logger';
import { PomodoroConfigService } from './pomodoro-config.service';
import { PomodoroStatsService } from './pomodoro-stats.service';

/**
 * PomodoroTimerService
 * Core timer logic with automatic transitions and session management
 * Scope Rule: Local to pomodoro-timer feature (only this feature uses it)
 * 
 * Events:
 * - 'tick': Emitted every second with current state
 * - 'phaseChanged': Emitted when transitioning between phases
 * - 'sessionCompleted': Emitted when a session is completed
 * - 'paused': Emitted when timer is paused
 * - 'resumed': Emitted when timer is resumed
 * - 'reset': Emitted when timer is reset
 */
export class PomodoroTimerService extends EventEmitter {
  private config: PomodoroConfig;
  private state: PomodoroState;
  private intervalId: NodeJS.Timeout | null = null;
  private currentSessionStartTime: Date | null = null;
  private initPromise: Promise<void>;

  constructor(
    private configService: PomodoroConfigService,
    private statsService: PomodoroStatsService
  ) {
    super();
    // Set temporary default config
    this.config = {
      workDuration: 80,
      shortBreakDuration: 10,
      longBreakDuration: 20,
      sessionsBeforeLongBreak: 5,
    };
    this.state = this.initializeState();
    
    // Initialize asynchronously
    this.initPromise = this.initialize();
  }

  /**
   * Async initialization - loads config and auto-starts
   */
  private async initialize(): Promise<void> {
    try {
      // Load config from Supabase
      this.config = await this.configService.load();
      
      // Load total sessions today from stats
      const totalSessionsToday = await this.statsService.getTotalSessionsToday();
      
      // Update state with loaded config and stats
      this.state.remainingSeconds = this.config.workDuration * 60;
      this.state.totalSessionsToday = totalSessionsToday;
      
      // Auto-start as per requirements
      logger.info('Pomodoro Timer: Auto-starting with loaded configuration');
      this.start();
    } catch (error) {
      logger.error('Failed to initialize Pomodoro Timer:', error);
      // Fallback to defaults and start anyway
      this.start();
    }
  }

  /**
   * Initialize state with default values
   */
  private initializeState(): PomodoroState {
    return {
      phase: 'work',
      remainingSeconds: this.config.workDuration * 60,
      isRunning: false,
      sessionCount: 0,
      totalSessionsToday: 0, // Will be loaded async
    };
  }

  /**
   * Start the timer
   */
  start(): void {
    if (this.state.isRunning) {
      logger.warn('Timer is already running');
      return;
    }

    this.state.isRunning = true;
    this.currentSessionStartTime = new Date();
    this.state.currentSessionStartTime = this.currentSessionStartTime.toISOString();

    // Start interval (tick every second)
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    logger.info(`Timer started: phase=${this.state.phase}, duration=${this.state.remainingSeconds}s`);
    this.emit('resumed', this.state);
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (!this.state.isRunning) {
      logger.warn('Timer is not running');
      return;
    }

    this.state.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Record incomplete session
    if (this.currentSessionStartTime) {
      this.recordSession(false);
    }

    logger.info('Timer paused');
    this.emit('paused', this.state);
  }

  /**
   * Reset the timer to initial work phase
   */
  async reset(): Promise<void> {
    const wasRunning = this.state.isRunning;

    // Stop timer if running
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Record incomplete session if was running
    if (wasRunning && this.currentSessionStartTime) {
      this.recordSession(false);
    }

    // Reset to work phase
    const totalSessionsToday = await this.statsService.getTotalSessionsToday();
    this.state = {
      phase: 'work',
      remainingSeconds: this.config.workDuration * 60,
      isRunning: false,
      sessionCount: 0,
      totalSessionsToday,
    };

    this.currentSessionStartTime = null;

    logger.info('Timer reset to work phase');
    this.emit('reset', this.state);
  }

  /**
   * Skip to next phase
   */
  async skip(): Promise<void> {
    const wasRunning = this.state.isRunning;

    // Record incomplete session
    if (this.currentSessionStartTime) {
      this.recordSession(false);
    }

    // Transition to next phase
    await this.transitionToNextPhase();

    // Resume if was running
    if (wasRunning) {
      this.start();
    }

    logger.info(`Skipped to next phase: ${this.state.phase}`);
  }

  /**
   * Tick function called every second
   */
  private async tick(): Promise<void> {
    if (!this.state.isRunning) {
      return;
    }

    this.state.remainingSeconds--;

    // Check if phase is complete
    if (this.state.remainingSeconds <= 0) {
      this.completeCurrentPhase();
      await this.transitionToNextPhase();
    }

    // Emit tick event for WebSocket updates
    this.emit('tick', this.state);
  }

  /**
   * Complete current phase and record session
   */
  private completeCurrentPhase(): void {
    if (this.currentSessionStartTime) {
      this.recordSession(true);
      this.emit('sessionCompleted', {
        phase: this.state.phase,
        sessionCount: this.state.sessionCount,
      });
    }
  }

  /**
   * Record session to statistics
   */
  private recordSession(completed: boolean): void {
    if (!this.currentSessionStartTime) {
      return;
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - this.currentSessionStartTime.getTime()) / 60000);

    const session: SessionRecord = {
      startTime: this.currentSessionStartTime.toISOString(),
      endTime: endTime.toISOString(),
      type: this.state.phase,
      durationMinutes,
      completed,
    };

    // No bloquear el loop principal; loguear errores de Supabase
    void this.statsService.recordSession(session).catch((error) => {
      logger.error('Error recording session statistics:', error);
    });
    this.currentSessionStartTime = null;
  }

  /**
   * Transition to next phase based on current phase and session count
   */
  private async transitionToNextPhase(): Promise<void> {
    const { phase, sessionCount } = this.state;
    const previousPhase = phase;

    if (phase === 'work') {
      // Increment session count after completing work
      this.state.sessionCount++;
      const totalSessionsToday = await this.statsService.getTotalSessionsToday();
      this.state.totalSessionsToday = totalSessionsToday;

      // Decide if it's short break or long break
      if (this.state.sessionCount % this.config.sessionsBeforeLongBreak === 0) {
        this.state.phase = 'longBreak';
        this.state.remainingSeconds = this.config.longBreakDuration * 60;
      } else {
        this.state.phase = 'shortBreak';
        this.state.remainingSeconds = this.config.shortBreakDuration * 60;
      }
    } else {
      // From any break, return to work
      this.state.phase = 'work';
      this.state.remainingSeconds = this.config.workDuration * 60;

      // Reset cycle after long break
      if (previousPhase === 'longBreak') {
        this.state.sessionCount = 0;
      }
    }

    // Reset session start time for new phase
    this.currentSessionStartTime = new Date();
    this.state.currentSessionStartTime = this.currentSessionStartTime.toISOString();

    logger.info(`Phase transition: ${previousPhase} → ${this.state.phase}`);
    this.emit('phaseChanged', this.state);
  }

  /**
   * Get current timer state
   */
  getState(): PomodoroState {
    return { ...this.state };
  }

  /**
   * Update configuration and reload
   */
  async updateConfig(newConfig: Partial<PomodoroConfig>): Promise<void> {
    const currentConfig = await this.configService.load();
    const updatedConfig = { ...currentConfig, ...newConfig };
    await this.configService.save(updatedConfig);
    this.config = updatedConfig;
    this.applyConfigToState(updatedConfig);
    logger.info('Pomodoro configuration updated');
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<void> {
    const freshConfig = await this.configService.load();
    this.config = freshConfig;
    this.applyConfigToState(freshConfig);
    logger.info('Pomodoro configuration reloaded');
  }

  /**
   * Apply configuration durations to current phase
   */
  private applyConfigToState(config: PomodoroConfig): void {
    if (this.state.phase === 'work') {
      this.state.remainingSeconds = config.workDuration * 60;
    } else if (this.state.phase === 'shortBreak') {
      this.state.remainingSeconds = config.shortBreakDuration * 60;
    } else {
      this.state.remainingSeconds = config.longBreakDuration * 60;
    }
  }

  /**
   * Clean up on service destruction
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.state.isRunning && this.currentSessionStartTime) {
      this.recordSession(false);
    }

    this.removeAllListeners();
    logger.info('Pomodoro Timer Service destroyed');
  }
}
