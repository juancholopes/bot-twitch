import { supabase, type Database } from "@infrastructure/database";
import type { PomodoroConfig } from "@bot-twitch/shared";
import { getServerIdentifier, parseSupabaseError } from "@bot-twitch/shared";
import logger from "@infrastructure/logging/logger";

type ConfigRow = Database["public"]["Tables"]["pomodoro_config"]["Row"];

/**
 * PomodoroConfigService - Secure Implementation
 *
 * Uses Supabase secure wrapper functions with:
 * - Rate limiting protection (10 calls per 5 minutes)
 * - Input validation
 * - SQL injection prevention
 *
 * Scope Rule: Local a pomodoro-timer feature
 *
 * CAMBIOS vs versión anterior:
 * - Usa secure_update_pomodoro_config en lugar de update directo
 * - Incluye manejo de errores de rate limiting
 * - Validación de rangos de valores
 */
export class PomodoroConfigServiceSecure {
  private configCache: PomodoroConfig | null = null;
  private cacheExpiry: number | null = null;
  private readonly CACHE_TTL_MS = 60000; // 1 minuto (config no cambia frecuentemente)

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cacheExpiry) return false;
    return Date.now() < this.cacheExpiry;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.configCache = null;
    this.cacheExpiry = null;
  }

  /**
   * Get configuration
   * READ operation - no rate limit
   */
  async getConfig(): Promise<PomodoroConfig> {
    // Check cache first
    if (this.isCacheValid() && this.configCache) {
      return this.configCache;
    }

    try {
      const { data, error } = await supabase
        .from("pomodoro_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        logger.error("Error fetching pomodoro config:", error);
        // Return default config as fallback
        return this.getDefaultConfig();
      }

      const row = data as ConfigRow;
      const config: PomodoroConfig = {
        id: row.id,
        workDuration: row.work_duration,
        shortBreakDuration: row.short_break_duration,
        longBreakDuration: row.long_break_duration,
        sessionsBeforeLongBreak: row.sessions_before_long_break,
      };

      // Cache it
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

      return config;
    } catch (error) {
      logger.error("Unexpected error getting config:", error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Update configuration
   * Uses secure function with strict rate limiting (10 calls per 5 minutes)
   */
  async updateConfig(
    config: Omit<PomodoroConfig, "id">,
    context?: { identifier?: string },
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Validate input ranges before sending to DB
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const identifier = context?.identifier || getServerIdentifier();

      const { data: success, error } = await supabase.rpc(
        "secure_update_pomodoro_config",
        {
          p_work_duration: config.workDuration,
          p_short_break: config.shortBreakDuration,
          p_long_break: config.longBreakDuration,
          p_sessions_before_long: config.sessionsBeforeLongBreak,
          p_identifier: identifier,
        },
      );

      if (error) {
        const parsed = parseSupabaseError(error);
        logger.error("Error updating pomodoro config:", parsed.message);
        return { success: false, message: parsed.userMessage };
      }

      if (!success) {
        return {
          success: false,
          message: "No se pudo actualizar la configuración",
        };
      }

      // Invalidate cache
      this.invalidateCache();

      logger.info("Pomodoro config updated successfully:", config);
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error updating config:", error);
      return {
        success: false,
        message: "Error inesperado al actualizar configuración",
      };
    }
  }

  /**
   * Validate configuration values
   */
  private validateConfig(config: Omit<PomodoroConfig, "id">): {
    valid: boolean;
    message?: string;
  } {
    // Check positive values
    if (
      config.workDuration <= 0 ||
      config.shortBreakDuration <= 0 ||
      config.longBreakDuration <= 0 ||
      config.sessionsBeforeLongBreak <= 0
    ) {
      return {
        valid: false,
        message: "Todos los valores deben ser positivos",
      };
    }

    // Check maximum work duration (240 minutes = 4 hours)
    if (config.workDuration > 240) {
      return {
        valid: false,
        message:
          "La duración de trabajo no puede exceder 240 minutos (4 horas)",
      };
    }

    // Check reasonable break durations (max 60 minutes)
    if (config.shortBreakDuration > 60) {
      return {
        valid: false,
        message: "El descanso corto no puede exceder 60 minutos",
      };
    }

    if (config.longBreakDuration > 120) {
      return {
        valid: false,
        message: "El descanso largo no puede exceder 120 minutos",
      };
    }

    // Check reasonable sessions count (1-10)
    if (
      config.sessionsBeforeLongBreak < 1 ||
      config.sessionsBeforeLongBreak > 10
    ) {
      return {
        valid: false,
        message:
          "Las sesiones antes del descanso largo deben estar entre 1 y 10",
      };
    }

    return { valid: true };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PomodoroConfig {
    return {
      id: 1,
      workDuration: 80,
      shortBreakDuration: 10,
      longBreakDuration: 20,
      sessionsBeforeLongBreak: 5,
    };
  }

  /**
   * Reset configuration to defaults
   * Uses secure function
   */
  async resetToDefaults(context?: {
    identifier?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const defaultConfig = this.getDefaultConfig();
    return await this.updateConfig(
      {
        workDuration: defaultConfig.workDuration,
        shortBreakDuration: defaultConfig.shortBreakDuration,
        longBreakDuration: defaultConfig.longBreakDuration,
        sessionsBeforeLongBreak: defaultConfig.sessionsBeforeLongBreak,
      },
      context,
    );
  }

  /**
   * Get work duration (convenience method)
   */
  async getWorkDuration(): Promise<number> {
    const config = await this.getConfig();
    return config.workDuration;
  }

  /**
   * Get short break duration (convenience method)
   */
  async getShortBreakDuration(): Promise<number> {
    const config = await this.getConfig();
    return config.shortBreakDuration;
  }

  /**
   * Get long break duration (convenience method)
   */
  async getLongBreakDuration(): Promise<number> {
    const config = await this.getConfig();
    return config.longBreakDuration;
  }

  /**
   * Get sessions before long break (convenience method)
   */
  async getSessionsBeforeLongBreak(): Promise<number> {
    const config = await this.getConfig();
    return config.sessionsBeforeLongBreak;
  }

  /**
   * Update single value (convenience method)
   * Still goes through validation and rate limiting
   */
  async updateWorkDuration(
    duration: number,
    context?: { identifier?: string },
  ): Promise<{ success: boolean; message?: string }> {
    const currentConfig = await this.getConfig();
    return await this.updateConfig(
      {
        workDuration: duration,
        shortBreakDuration: currentConfig.shortBreakDuration,
        longBreakDuration: currentConfig.longBreakDuration,
        sessionsBeforeLongBreak: currentConfig.sessionsBeforeLongBreak,
      },
      context,
    );
  }

  /**
   * Load configuration (backwards compatibility alias for getConfig)
   */
  async load(): Promise<PomodoroConfig> {
    return await this.getConfig();
  }

  /**
   * Save configuration (backwards compatibility alias for updateConfig)
   */
  async save(
    config: PomodoroConfig,
    context?: { identifier?: string },
  ): Promise<void> {
    const result = await this.updateConfig(
      {
        workDuration: config.workDuration,
        shortBreakDuration: config.shortBreakDuration,
        longBreakDuration: config.longBreakDuration,
        sessionsBeforeLongBreak: config.sessionsBeforeLongBreak,
      },
      context,
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to save configuration");
    }
  }
}
