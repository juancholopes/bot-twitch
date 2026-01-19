import { supabase } from '@infrastructure/database';
import type { PomodoroConfig } from '@bot-twitch/shared';
import logger from '../../utils/logger';

/**
 * PomodoroConfigService - Migrated to Supabase
 * 
 * Mantiene la misma interfaz pública que la versión JSON
 * Scope Rule: Local a pomodoro-timer feature
 * 
 * CAMBIOS PRINCIPALES:
 * - Reemplaza fs operations por queries Supabase
 * - Usa tabla singleton (id = 1 siempre)
 * - Cache en memoria para reducir queries
 */
export class PomodoroConfigService {
  private readonly defaultConfig: PomodoroConfig = {
    workDuration: 80,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    sessionsBeforeLongBreak: 5,
  };

  private configCache: PomodoroConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minuto (config cambia poco)

  /**
   * Cache helper to centralize TTL updates
   */
  private cacheConfig(config: PomodoroConfig): void {
    this.configCache = config;
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return this.configCache !== null && Date.now() < this.cacheExpiry;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.configCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Load configuration from Supabase or return defaults
   */
  async load(): Promise<PomodoroConfig> {
    // Check cache first
    if (this.isCacheValid()) {
      return this.configCache!;
    }

    try {
      // Fetch from DB (singleton with id = 1)
      const { data, error } = await supabase
        .from('pomodoro_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          logger.info('Pomodoro config not found, creating with defaults');
          await this.save(this.defaultConfig);
          this.cacheConfig(this.defaultConfig);
          return this.defaultConfig;
        }
        logger.error('Error loading pomodoro config:', error);
        return this.defaultConfig;
      }

      const config: PomodoroConfig = {
        workDuration: data.work_duration,
        shortBreakDuration: data.short_break_duration,
        longBreakDuration: data.long_break_duration,
        sessionsBeforeLongBreak: data.sessions_before_long_break,
      };

      // Validate and cache
      this.validateConfig(config);
      this.cacheConfig(config);

      logger.info('Pomodoro configuration loaded successfully');
      return config;
    } catch (error) {
      logger.error('Error loading pomodoro config, using defaults:', error);
      this.cacheConfig(this.defaultConfig);
      return this.defaultConfig;
    }
  }

  /**
   * Save configuration to Supabase
   */
  async save(config: PomodoroConfig): Promise<void> {
    try {
      this.validateConfig(config);

      // Upsert (insert or update) with id = 1 (singleton)
      const { error } = await supabase
        .from('pomodoro_config')
        .upsert({
          id: 1,
          work_duration: config.workDuration,
          short_break_duration: config.shortBreakDuration,
          long_break_duration: config.longBreakDuration,
          sessions_before_long_break: config.sessionsBeforeLongBreak,
        }, {
          onConflict: 'id',
        });

      if (error) {
        logger.error('Error saving pomodoro config:', error);
        throw error;
      }

      // Update cache with saved config
      this.cacheConfig(config);

      logger.info('Pomodoro configuration saved successfully');
    } catch (error) {
      logger.error('Error saving pomodoro config:', error);
      throw error;
    }
  }

  /**
   * Get cached configuration (falls back to defaults if not loaded yet)
   */
  getConfig(): PomodoroConfig {
    return this.configCache ?? this.defaultConfig;
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    await this.save(this.defaultConfig);
    logger.info('Pomodoro configuration reset to defaults');
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
  async setWorkDuration(minutes: number): Promise<void> {
    const config = await this.load();
    config.workDuration = minutes;
    await this.save(config);
  }

  /**
   * Update short break duration
   */
  async setShortBreakDuration(minutes: number): Promise<void> {
    const config = await this.load();
    config.shortBreakDuration = minutes;
    await this.save(config);
  }

  /**
   * Update long break duration
   */
  async setLongBreakDuration(minutes: number): Promise<void> {
    const config = await this.load();
    config.longBreakDuration = minutes;
    await this.save(config);
  }

  /**
   * Update sessions before long break
   */
  async setSessionsBeforeLongBreak(sessions: number): Promise<void> {
    const config = await this.load();
    config.sessionsBeforeLongBreak = sessions;
    await this.save(config);
  }

  /**
   * Reset to default configuration
   */
  async reset(): Promise<void> {
    await this.save(this.defaultConfig);
    logger.info('Pomodoro configuration reset to defaults');
  }
}
