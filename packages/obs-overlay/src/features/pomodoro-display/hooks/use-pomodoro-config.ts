import { useState, useEffect, useRef } from 'react';
import { supabase, type Database, type RealtimeChannel } from '../../../infrastructure/database';
import type { PomodoroConfig } from '@bot-twitch/shared';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook para cargar y suscribirse a cambios de configuración Pomodoro
 * 
 * REEMPLAZA: Polling HTTP anterior
 * USA: Supabase Realtime subscriptions
 */
export function usePomodoroConfig() {
  const [config, setConfig] = useState<PomodoroConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Fetch initial config
   */
  const fetchConfig = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pomodoro_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError) {
        console.error('[usePomodoroConfig] Error fetching config:', fetchError);
        setError(`Error cargando configuración: ${fetchError.message}`);
        return;
      }

      if (data && 'work_duration' in data) {
        const config = data as Database['public']['Tables']['pomodoro_config']['Row'];
        setConfig({
          workDuration: config.work_duration,
          shortBreakDuration: config.short_break_duration,
          longBreakDuration: config.long_break_duration,
          sessionsBeforeLongBreak: config.sessions_before_long_break,
        });
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[usePomodoroConfig] Unexpected error:', err);
      setError('Error de conexión');
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchConfig();

    // Subscribe to realtime changes
    console.log('[usePomodoroConfig] Setting up Realtime subscription');

    channelRef.current = supabase
      .channel('pomodoro-config-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pomodoro_config',
          filter: 'id=eq.1',
        },
        (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['pomodoro_config']['Row']>) => {
          console.log('[usePomodoroConfig] Config updated:', payload);
          
          if (payload.new && 'work_duration' in payload.new) {
            const newConfig = payload.new as Database['public']['Tables']['pomodoro_config']['Row'];
            setConfig({
              workDuration: newConfig.work_duration,
              shortBreakDuration: newConfig.short_break_duration,
              longBreakDuration: newConfig.long_break_duration,
              sessionsBeforeLongBreak: newConfig.sessions_before_long_break,
            });
          }
        }
      )
      .subscribe((status: string) => {
        console.log('[usePomodoroConfig] Subscription status:', status);
      });

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    config,
    loading,
    error,
  };
}
