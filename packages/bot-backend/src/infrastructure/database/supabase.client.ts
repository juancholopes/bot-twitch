import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SessionRecord } from "@bot-twitch/shared";
import config from "../../config/environment";
import logger from "../logging/logger";

/**
 * Supabase Client (Backend)
 *
 * Ubicación: infrastructure/database (cross-cutting concern)
 * Scope Rule: Usado por múltiples features (task-management, pomodoro-timer)
 *
 * IMPORTANTE:
 * - Usa SERVICE_ROLE_KEY que bypasea Row Level Security
 * - NUNCA exponer este cliente en el frontend
 * - Singleton pattern para evitar múltiples conexiones
 */

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client instance (singleton)
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = config.supabase.url;
  const supabaseKey = config.supabase.serviceRoleKey;

  if (!supabaseUrl || !supabaseKey) {
    logger.error("Missing Supabase configuration");
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables",
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-application-name": "bot-twitch-backend",
      },
    },
  });

  logger.info("Supabase client initialized successfully");
  supabaseInstance = supabaseInstance as SupabaseClient<Database>;
  return supabaseInstance;
}

/**
 * Database type definitions
 * Extend these as you add more tables
 */
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          username: string;
          task_text: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          task_text: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          task_text?: string;
          completed?: boolean;
          updated_at?: string;
        };
        Relationships: never[];
      };
      pomodoro_stats: {
        Row: {
          id: string;
          date: string;
          sessions_completed: number;
          short_breaks_taken: number;
          long_breaks_taken: number;
          total_work_time: number;
          sessions: SessionRecord[]; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          sessions_completed?: number;
          short_breaks_taken?: number;
          long_breaks_taken?: number;
          total_work_time?: number;
          sessions?: SessionRecord[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date?: string;
          sessions_completed?: number;
          short_breaks_taken?: number;
          long_breaks_taken?: number;
          total_work_time?: number;
          sessions?: SessionRecord[];
          updated_at?: string;
        };
        Relationships: never[];
      };
      pomodoro_config: {
        Row: {
          id: number;
          work_duration: number;
          short_break_duration: number;
          long_break_duration: number;
          sessions_before_long_break: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          work_duration?: number;
          short_break_duration?: number;
          long_break_duration?: number;
          sessions_before_long_break?: number;
          updated_at?: string;
        };
        Update: {
          work_duration?: number;
          short_break_duration?: number;
          long_break_duration?: number;
          sessions_before_long_break?: number;
          updated_at?: string;
        };
        Relationships: never[];
      };
    };
    Views: {
      tasks_public: {
        Row: {
          id: string;
          username: string;
          task_text: string;
          completed: boolean;
          created_at: string;
        };
      };
      pomodoro_stats_public: {
        Row: {
          date: string;
          sessions_completed: number;
          short_breaks_taken: number;
          long_breaks_taken: number;
          total_work_time: number;
          session_count: number;
        };
      };
    };
    Functions: {
      secure_add_task: {
        Args: {
          p_username: string;
          p_task_text: string;
          p_identifier?: string;
        };
        Returns: string;
      };
      secure_update_task_status: {
        Args: {
          p_task_id: string;
          p_completed: boolean;
          p_identifier?: string;
        };
        Returns: boolean;
      };
      secure_delete_task: {
        Args: {
          p_task_id: string;
          p_identifier?: string;
        };
        Returns: boolean;
      };
      secure_update_pomodoro_stats: {
        Args: {
          p_date: string;
          p_sessions_completed: number;
          p_short_breaks: number;
          p_long_breaks: number;
          p_total_work_time: number;
          p_sessions: any;
          p_identifier?: string;
        };
        Returns: boolean;
      };
      secure_update_pomodoro_config: {
        Args: {
          p_work_duration: number;
          p_short_break: number;
          p_long_break: number;
          p_sessions_before_long: number;
          p_identifier?: string;
        };
        Returns: boolean;
      };
      get_user_task_count: {
        Args: {
          p_username: string;
        };
        Returns: {
          pending_count: number;
          completed_count: number;
          total_count: number;
        }[];
      };
      clear_completed_tasks: {
        Args: {
          p_username: string;
        };
        Returns: number;
      };
      check_rate_limit: {
        Args: {
          p_identifier: string;
          p_endpoint: string;
          p_max_calls: number;
          p_window_minutes: number;
        };
        Returns: boolean;
      };
      validate_username: {
        Args: {
          p_username: string;
        };
        Returns: boolean;
      };
      sanitize_task_text: {
        Args: {
          p_text: string;
        };
        Returns: string;
      };
      database_health_check: {
        Args: Record<string, never>;
        Returns: {
          table_name: string;
          row_count: number;
          table_size: string;
          index_size: string;
        }[];
      };
      get_rate_limit_violations: {
        Args: {
          p_hours_back: number;
        };
        Returns: {
          identifier: string;
          endpoint: string;
          total_calls: number;
          first_call: string;
          last_call: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: never;
  };
}

// Export typed client
export const supabase = getSupabaseClient() as SupabaseClient<Database>;
