import { supabase, type Database } from '@infrastructure/database';
import logger from '@infrastructure/logging/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
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
 * TaskManagementService - Migrated to Supabase
 * 
 * Mantiene la misma interfaz pública que la versión JSON
 * Scope Rule: Local a feature task-management
 * 
 * CAMBIOS PRINCIPALES:
 * - Reemplaza fs.readFile/writeFile por queries Supabase
 * - Mantiene compatibilidad con estructura UserTask (user, task[], completed[])
 * - EventEmitter se mantiene para compatibilidad
 */
class TaskManagementService {
	private readonly db: SupabaseClient<Database> = supabase as SupabaseClient<Database>;
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
	 * Read all tasks from Supabase
	 * Convierte de formato DB a formato legacy UserTask[]
	 */
	async readTasks(): Promise<Array<{ user: string; task: string[]; completed: string[] }>> {
		try {
			const { data, error } = await this.db
				.from('tasks')
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
	 */
	async getUserTaskCount(username: string): Promise<number> {
		try {
			const { count, error } = await this.db
				.from('tasks')
				.select('*', { count: 'exact', head: true })
				.eq('username', username);

			if (error) {
				logger.error('Error getting user task count:', error);
				return 0;
			}

			return count || 0;
		} catch (error) {
			logger.error('Unexpected error getting task count:', error);
			return 0;
		}
	}

	/**
	 * Add tasks for a user
	 */
	async addTasks(username: string, tasks: string[]): Promise<boolean> {
		try {
			const taskInserts = tasks.map(task_text => ({
				username,
				task_text,
				completed: false,
			}));

			const { error } = await this.db
				.from('tasks')
				.insert(taskInserts as TaskRow[]);

			if (error) {
				logger.error('Error adding tasks:', error);
				return false;
			}

			return await this.afterWrite();
		} catch (error) {
			logger.error('Unexpected error adding tasks:', error);
			return false;
		}
	}

	/**
	 * Complete tasks by their position (1-indexed)
	 * Mantiene la interfaz original de completar por número
	 */
	async completeTasks(
		username: string,
		taskNumbers: number[],
	): Promise<{
		success: boolean;
		message?: string;
		completedTasks?: string[];
	}> {
		try {
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

			// 2. Validar y mapear números a IDs
			const sortedNumbers = [...new Set(taskNumbers)].sort((a, b) => b - a);
			const completedTasks: string[] = [];
			const idsToUpdate: string[] = [];

			for (const taskNumber of sortedNumbers) {
				const taskIndex = taskNumber - 1;
				if (taskIndex >= 0 && taskIndex < pendingRows.length) {
					const task = pendingRows[taskIndex];
					idsToUpdate.push(task.id);
					completedTasks.push(task.task_text);
				}
			}

			if (idsToUpdate.length === 0) {
				return { success: false, message: 'Números de tarea inválidos' };
			}

			// 3. Actualizar tareas a completed = true
			const { error: updateError } = await this.db
				.from('tasks')
				.update({ completed: true })
				.in('id', idsToUpdate);

			if (updateError) {
				logger.error('Error completing tasks:', updateError);
				return { success: false, message: 'Error al completar tareas' };
			}

			await this.afterWrite();
			return { success: true, completedTasks };
		} catch (error) {
			logger.error('Unexpected error completing tasks:', error);
			return { success: false, message: 'Error inesperado' };
		}
	}

	/**
	 * Clear all completed tasks for a user
	 */
	async clearCompletedTasks(
		username: string,
	): Promise<{ success: boolean; message?: string; clearedCount?: number }> {
		try {
			// Contar tareas completadas antes de borrar
			const { count, error: countError } = await supabase
				.from('tasks')
				.select('*', { count: 'exact', head: true })
				.eq('username', username)
				.eq('completed', true);

			if (countError) {
				logger.error('Error counting completed tasks:', countError);
				return { success: false, message: 'Error al contar tareas completadas' };
			}

			const clearedCount = count || 0;

			if (clearedCount === 0) {
				return { success: true, clearedCount: 0 };
			}

			// Eliminar tareas completadas
			const { error: deleteError } = await supabase
				.from('tasks')
				.delete()
				.eq('username', username)
				.eq('completed', true);

			if (deleteError) {
				logger.error('Error clearing completed tasks:', deleteError);
				return { success: false, message: 'Error al limpiar tareas' };
			}

			await this.afterWrite();
			return { success: true, clearedCount };
		} catch (error) {
			logger.error('Unexpected error clearing tasks:', error);
			return { success: false, message: 'Error inesperado' };
		}
	}

	/**
	 * Delete ALL tasks (admin function)
	 */
	async deleteAllTasks(): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('tasks')
				.delete()
				.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround for delete all)

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

export default new TaskManagementService();
