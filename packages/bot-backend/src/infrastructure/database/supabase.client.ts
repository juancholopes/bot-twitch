import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SessionRecord } from '@bot-twitch/shared';
import config from '../../config/environment';
import logger from '../logging/logger';

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
    logger.error('Missing Supabase configuration');
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'bot-twitch-backend',
      },
    },
  });

  logger.info('Supabase client initialized successfully');
  supabaseInstance = supabaseInstance as SupabaseClient<Database>;
  return supabaseInstance;
}

/**
 * Database type definitions
 * Extend these as you add more tables
 */
export interface Database {
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: never;
  };
}

// Export typed client
export const supabase = getSupabaseClient() as SupabaseClient<Database>;
