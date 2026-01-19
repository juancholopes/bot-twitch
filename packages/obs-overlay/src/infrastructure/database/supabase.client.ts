import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { SessionRecord } from '@bot-twitch/shared';

/**
 * Supabase Client (Frontend - OBS Overlay)
 * 
 * Ubicación: infrastructure/database
 * Scope Rule: Usado por múltiples features (stream-task-display, pomodoro-display)
 * 
 * IMPORTANTE:
 * - Usa ANON_KEY (segura para exponer en cliente)
 * - Las operaciones están limitadas por Row Level Security (RLS)
 * - Configurado para Realtime subscriptions
 */

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client instance (singleton)
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    throw new Error(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Throttle updates to prevent rate limits
      },
    },
    global: {
      headers: {
        'x-application-name': 'bot-twitch-overlay',
      },
    },
  });

  console.info('[Supabase] Client initialized successfully');
  supabaseInstance = supabaseInstance as SupabaseClient<Database>;
  return supabaseInstance;
}

/**
 * Database type definitions
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
          created_at?: string;
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
          sessions: SessionRecord[];
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
          id?: string;
          date?: string;
          sessions_completed?: number;
          short_breaks_taken?: number;
          long_breaks_taken?: number;
          total_work_time?: number;
          sessions?: SessionRecord[];
          created_at?: string;
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
          work_duration: number;
          short_break_duration: number;
          long_break_duration: number;
          sessions_before_long_break: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
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

// Export types for Realtime
export type { RealtimeChannel };
