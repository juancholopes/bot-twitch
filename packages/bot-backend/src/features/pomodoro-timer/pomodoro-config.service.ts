import * as fs from 'fs';
import * as path from 'path';
import type { PomodoroConfig } from '@bot-twitch/shared';
import logger from '../../utils/logger';

/**
 * PomodoroConfigService
 * Handles loading and saving pomodoro configuration
 * Scope Rule: Local to pomodoro-timer feature (only this feature uses it)
 */
export class PomodoroConfigService {
  private readonly configPath: string;
  private readonly defaultConfig: PomodoroConfig = {
    workDuration: 80,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    sessionsBeforeLongBreak: 5,
  };

  constructor(dataDir = './data') {
    this.configPath = path.join(dataDir, 'pomodoro-config.json');
    this.ensureDataDirectory(dataDir);
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
   * Load configuration from file or return defaults
   */
  load(): PomodoroConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.info('Pomodoro config not found, creating with defaults');
        this.save(this.defaultConfig);
        return this.defaultConfig;
      }

      const data = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(data) as PomodoroConfig;
      
      // Validate configuration
      this.validateConfig(config);
      
      logger.info('Pomodoro configuration loaded successfully');
      return config;
    } catch (error) {
      logger.error('Error loading pomodoro config, using defaults:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Save configuration to file
   */
  save(config: PomodoroConfig): void {
    try {
      this.validateConfig(config);
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info('Pomodoro configuration saved successfully');
    } catch (error) {
      logger.error('Error saving pomodoro config:', error);
      throw error;
    }
  }

  /**
   * Validate configuration values
   */
  private validateConfig(config: PomodoroConfig): void {
    if (config.workDuration <= 0) {
      throw new Error('Work duration must be greater than 0');
    }
    if (config.shortBreakDuration <= 0) {
      throw new Error('Short break duration must be greater than 0');
    }
    if (config.longBreakDuration <= 0) {
      throw new Error('Long break duration must be greater than 0');
    }
    if (config.sessionsBeforeLongBreak <= 0) {
      throw new Error('Sessions before long break must be greater than 0');
    }
  }

  /**
   * Update work duration
   */
  setWorkDuration(minutes: number): void {
    const config = this.load();
    config.workDuration = minutes;
    this.save(config);
  }

  /**
   * Update short break duration
   */
  setShortBreakDuration(minutes: number): void {
    const config = this.load();
    config.shortBreakDuration = minutes;
    this.save(config);
  }

  /**
   * Update long break duration
   */
  setLongBreakDuration(minutes: number): void {
    const config = this.load();
    config.longBreakDuration = minutes;
    this.save(config);
  }

  /**
   * Update sessions before long break
   */
  setSessionsBeforeLongBreak(count: number): void {
    const config = this.load();
    config.sessionsBeforeLongBreak = count;
    this.save(config);
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.save(this.defaultConfig);
    logger.info('Pomodoro configuration reset to defaults');
  }

  /**
   * Get current configuration
   */
  getConfig(): PomodoroConfig {
    return this.load();
  }
}
