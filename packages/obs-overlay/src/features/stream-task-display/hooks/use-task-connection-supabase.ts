import { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, UserTasks } from '@bot-twitch/shared/task';
import { supabase, type Database, type RealtimeChannel } from '../../../infrastructure/database';

/**
 * Task Interface (matches backend structure)
 */
type TaskRow = Database['public']['Tables']['tasks']['Row'];

/**
 * Convertir de formato Supabase a formato Task compartido
 */
function mapSupabaseTaskToTask(supabaseTask: TaskRow): Task {
  return {
    id: supabaseTask.id,
    username: supabaseTask.username,
    text: String(supabaseTask.task_text ?? ''), // Asegurar string para React
    completed: supabaseTask.completed,
    timestamp: new Date(supabaseTask.created_at).getTime(),
  };
}

function groupTasksByUser(tasks: Task[]): UserTasks[] {
  const userMap: Record<string, { pending: string[]; completed: string[] }> = {};

  tasks.forEach((task) => {
    const username = task.username || 'unknown';
    if (!userMap[username]) {
      userMap[username] = { pending: [], completed: [] };
    }

    const normalizedText = typeof task.text === 'string' ? task.text : JSON.stringify(task.text);
    if (!normalizedText) return;

    if (task.completed) {
      userMap[username].completed.push(normalizedText);
    } else {
      userMap[username].pending.push(normalizedText);
    }
  });

  return Object.keys(userMap)
    .sort()
    .map((user) => ({
      user,
      task: userMap[user].pending,
      completed: userMap[user].completed,
    }));
}

/**
 * Hook para conectar a Supabase Realtime y obtener tareas
 * 
 * REEMPLAZA: WebSocket polling anterior
 * USA: Supabase Realtime subscriptions
 * 
 * VENTAJAS:
 * - Actualizaciones en tiempo real sin polling
 * - Menos consumo de ancho de banda
 * - Manejo automático de reconexión
 */
export function useTaskConnectionSupabase() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Fetch initial tasks
   */
  const fetchTasks = async () => {
    try {
      console.log('[useTaskConnection] Fetching from Supabase...');
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('[useTaskConnection] Supabase response:', { data, fetchError });

      if (fetchError) {
        console.error('[useTaskConnection] Error fetching tasks:', fetchError);
        setError(`Error cargando tareas: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      // Mapear de formato Supabase a formato Task
      const mappedTasks = ((data || []) as TaskRow[]).map(mapSupabaseTaskToTask);
      console.log('[useTaskConnection] Mapped tasks:', mappedTasks);
      setTasks(mappedTasks);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[useTaskConnection] Unexpected error:', err);
      setError('Error de conexión');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTasks();

    // Subscribe to realtime changes
    console.log('[useTaskConnection] Setting up Realtime subscription');

    channelRef.current = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('[useTaskConnection] Realtime event:', payload);

          if (payload.eventType === 'INSERT') {
            const newTask = mapSupabaseTaskToTask(payload.new as TaskRow);
            setTasks(prev => [...prev, newTask]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = mapSupabaseTaskToTask(payload.new as TaskRow);
            setTasks(prev =>
              prev.map(task =>
                task.id === updatedTask.id ? updatedTask : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== (payload.old as TaskRow).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useTaskConnection] Subscription status:', status);
        setConnected(status === 'SUBSCRIBED');
      });

    // Cleanup on unmount
    return () => {
      console.log('[useTaskConnection] Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const groupedTasks = useMemo(() => {
    const result = groupTasksByUser(tasks);
    console.log('[useTaskConnection] Raw tasks from DB:', tasks);
    console.log('[useTaskConnection] Grouped tasks for UI:', result);
    return result;
  }, [tasks]);

  return {
    tasks: groupedTasks,
    loading,
    error,
    connected,
  };
}
