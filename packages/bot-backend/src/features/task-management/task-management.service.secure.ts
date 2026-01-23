import { supabase, type Database } from '@infrastructure/database';
import logger from '@infrastructure/logging/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerIdentifier, parseSupabaseError } from '@bot-twitch/shared';
import type { TaskEventEmitter } from './models';

type TaskRow = {
  id: string;
  username: string;
  task_text: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * TaskManagementService - Secure Implementation
 *
 * Uses Supabase secure wrapper functions with:
 * - Rate limiting protection
 * - Input validation and sanitization
 * - SQL injection prevention
 * - XSS attack prevention
 *
 * Scope Rule: Local a feature task-management
 *
 * CAMBIOS vs versión anterior:
 * - Usa secure_add_task en lugar de insert directo
 * - Usa secure_update_task_status en lugar de update directo
 * - Usa secure_delete_task en lugar de delete directo
 * - Incluye manejo de errores de rate limiting
 */
class TaskManagementServiceSecure {
  private readonly db: SupabaseClient<Database> = supabase;
  private emitter: TaskEventEmitter | null = null;

  setEmitter(emitter: TaskEventEmitter): void {
    this.emitter = emitter;
  }

  private emitTasksUpdated(): void {
    if (this.emitter) {
      this.emitter('tasksUpdated');
    }
  }

  /**
   * Read all tasks from Supabase using public view (no rate limit)
   * Convierte de formato DB a formato legacy UserTask[]
   */
  async readTasks(): Promise<Array<{ user: string; task: string[]; completed: string[] }>> {
    try {
      const { data, error } = await this.db
        .from('tasks_public')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error reading tasks from Supabase:', error);
        return [];
      }

      // Agrupar por usuario (mantener compatibilidad con formato anterior)
      const userTasksMap = new Map<string, { task: string[]; completed: string[] }>();
      const rows = (data || []) as TaskRow[];

      for (const row of rows) {
        if (!userTasksMap.has(row.username)) {
          userTasksMap.set(row.username, { task: [], completed: [] });
        }

        const userTasks = userTasksMap.get(row.username)!;
        if (row.completed) {
          userTasks.completed.push(row.task_text);
        } else {
          userTasks.task.push(row.task_text);
        }
      }

      return Array.from(userTasksMap.entries()).map(([user, { task, completed }]) => ({
        user,
        task,
        completed,
      }));
    } catch (error) {
      logger.error('Unexpected error reading tasks:', error);
      return [];
    }
  }

  /**
   * Trigger events and log (mantiene compatibilidad)
   */
  private async afterWrite(): Promise<boolean> {
    this.emitTasksUpdated();
    return true;
  }

  /**
   * Find user tasks
   */
  async findUser(username: string): Promise<{ user: string; task: string[]; completed: string[] } | undefined> {
    const users = await this.readTasks();
    return users.find((user) => user.user === username);
  }

  /**
   * Get total task count for a user (pending + completed)
   * Uses secure function (no direct rate limit on this query)
   */
  async getUserTaskCount(username: string): Promise<number> {
    try {
      const { data, error } = await (this.db.rpc as any)('get_user_task_count', {
        p_username: username,
      }) as { data: Array<{ pending_count: number; completed_count: number; total_count: number }> | null; error: any };

      if (error) {
        logger.error('Error getting user task count:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      return data[0].total_count || 0;
    } catch (error) {
      logger.error('Unexpected error getting task count:', error);
      return 0;
    }
  }

  /**
   * Add tasks for a user using secure function
   * Includes rate limiting, validation, and sanitization
   */
  async addTasks(
    username: string,
    tasks: string[],
    context?: { ip?: string }
  ): Promise<{
    success: boolean;
    message?: string;
    addedTasks?: string[];
  }> {
    try {
      const identifier = getServerIdentifier(username, context?.ip);
      const addedTasks: string[] = [];
      const errors: string[] = [];

      // Add tasks one by one (could be optimized with batch function if needed)
      for (const taskText of tasks) {
        try {
          const { data: taskId, error } = await (this.db.rpc as any)('secure_add_task', {
            p_username: username,
            p_task_text: taskText,
            p_identifier: identifier,
          }) as { data: string | null; error: any };

          if (error) {
            const parsed = parseSupabaseError(error);
            logger.warn(`Failed to add task for ${username}: ${parsed.message}`);
            errors.push(parsed.userMessage);

            // Si es rate limit, no intentar más
            if (parsed.type === 'rate_limit') {
              break;
            }
          } else {
            addedTasks.push(taskText);
          }
        } catch (err) {
          logger.error('Error adding single task:', err);
          errors.push('Error inesperado al agregar tarea');
        }
      }

      if (addedTasks.length > 0) {
        await this.afterWrite();
      }

      if (addedTasks.length === tasks.length) {
        return { success: true, addedTasks };
      } else if (addedTasks.length > 0) {
        return {
          success: true,
          message: `Se agregaron ${addedTasks.length} de ${tasks.length} tareas. ${errors[0] || ''}`,
          addedTasks,
        };
      } else {
        return {
          success: false,
          message: errors[0] || 'No se pudieron agregar las tareas',
        };
      }
    } catch (error) {
      logger.error('Unexpected error adding tasks:', error);
      return {
        success: false,
        message: 'Error inesperado al agregar tareas',
      };
    }
  }

  /**
   * Complete tasks by their position (1-indexed)
   * Mantiene la interfaz original de completar por número
   *
   * Nota: Como no hay función segura para esto (es operación compleja),
   * seguimos usando la lógica original pero con mejor manejo de errores
   */
  async completeTasks(
    username: string,
    taskNumbers: number[],
    context?: { ip?: string }
  ): Promise<{
    success: boolean;
    message?: string;
    completedTasks?: string[];
  }> {
    try {
      const identifier = getServerIdentifier(username, context?.ip);

      // 1. Obtener tareas pendientes del usuario (ordenadas por created_at)
      const { data: pendingTasks, error: fetchError } = await this.db
        .from('tasks')
        .select('*')
        .eq('username', username)
        .eq('completed', false)
        .order('created_at', { ascending: true });

      if (fetchError) {
        logger.error('Error fetching pending tasks:', fetchError);
        return { success: false, message: 'Error al obtener tareas' };
      }

      const pendingRows = (pendingTasks || []) as TaskRow[];
      if (pendingRows.length === 0) {
        return { success: false, message: 'Usuario no encontrado o sin tareas pendientes' };
      }

      // 2. Validar y actualizar tareas una por una usando secure function
      const sortedNumbers = [...new Set(taskNumbers)].sort((a, b) => b - a);
      const completedTasks: string[] = [];
      const errors: string[] = [];

      for (const taskNumber of sortedNumbers) {
        const taskIndex = taskNumber - 1;
        if (taskIndex >= 0 && taskIndex < pendingRows.length) {
          const task = pendingRows[taskIndex];

          try {
            const { data: success, error } = await (this.db.rpc as any)('secure_update_task_status', {
              p_task_id: task.id,
              p_completed: true,
              p_identifier: identifier,
            }) as { data: boolean | null; error: any };

            if (error) {
              const parsed = parseSupabaseError(error);
              logger.warn(`Failed to complete task ${task.id}: ${parsed.message}`);
              errors.push(parsed.userMessage);

              // Si es rate limit, detener
              if (parsed.type === 'rate_limit') {
                break;
              }
            } else if (success) {
              completedTasks.push(task.task_text);
            }
          } catch (err) {
            logger.error('Error completing task:', err);
            errors.push('Error inesperado');
          }
        }
      }

      if (completedTasks.length > 0) {
        await this.afterWrite();
        return { success: true, completedTasks };
      } else {
        return {
          success: false,
          message: errors[0] || 'No se pudieron completar las tareas',
        };
      }
    } catch (error) {
      logger.error('Unexpected error completing tasks:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }

  /**
   * Clear all completed tasks for a user
   * Uses secure function with rate limiting
   */
  async clearCompletedTasks(
    username: string,
    context?: { ip?: string }
  ): Promise<{ success: boolean; message?: string; clearedCount?: number }> {
    try {
      const identifier = getServerIdentifier(username, context?.ip);

      const { data: clearedCount, error } = await (this.db.rpc as any)('clear_completed_tasks', {
        p_username: username,
      }) as { data: number | null; error: any };

      if (error) {
        const parsed = parseSupabaseError(error);
        logger.error('Error clearing completed tasks:', parsed.message);
        return { success: false, message: parsed.userMessage };
      }

      await this.afterWrite();
      return { success: true, clearedCount: clearedCount || 0 };
    } catch (error) {
      logger.error('Unexpected error clearing tasks:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }

  /**
   * Delete a specific task by ID
   * Uses secure function with rate limiting
   */
  async deleteTask(
    taskId: string,
    context?: { username?: string; ip?: string }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const identifier = getServerIdentifier(context?.username, context?.ip);

      const { data: success, error } = await (this.db.rpc as any)('secure_delete_task', {
        p_task_id: taskId,
        p_identifier: identifier,
      }) as { data: boolean | null; error: any };

      if (error) {
        const parsed = parseSupabaseError(error);
        logger.error('Error deleting task:', parsed.message);
        return { success: false, message: parsed.userMessage };
      }

      if (!success) {
        return { success: false, message: 'Tarea no encontrada' };
      }

      await this.afterWrite();
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error deleting task:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }

  /**
   * Delete ALL tasks (admin function)
   * WARNING: Uses direct deletion, not rate limited
   */
  async deleteAllTasks(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        logger.error('Error deleting all tasks:', error);
        return false;
      }

      return await this.afterWrite();
    } catch (error) {
      logger.error('Unexpected error deleting all tasks:', error);
      return false;
    }
  }
}

export default new TaskManagementServiceSecure();
