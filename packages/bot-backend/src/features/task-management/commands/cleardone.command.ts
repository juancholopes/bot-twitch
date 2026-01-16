import type { ChatUserstate, Client } from 'tmi.js';
import logger from '@infrastructure/logging/logger';
import taskManagementService from '../task-management.service';

export const handleClearDone = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
): Promise<void> => {
	try {
		if (!tags.username) return;

		const result = await taskManagementService.clearCompletedTasks(
			tags.username,
		);

		if (!result.success) {
			await client.say(
				channel,
				`@${tags.username}, no tienes tareas registradas.`,
			);
			return;
		}

		if (result.clearedCount === 0) {
			await client.say(
				channel,
				`@${tags.username}, no tienes tareas completadas para limpiar.`,
			);
			return;
		}

		await client.say(
			channel,
			`@${tags.username}, se limpiaron ${result.clearedCount} tarea(s) completada(s). Ahora puedes agregar más tareas.`,
		);
		logger.info(
			`Usuario ${tags.username} limpió ${result.clearedCount} tareas completadas`,
		);
	} catch (error) {
		logger.error('Error en comando cleardone:', error);
		await client.say(
			channel,
			`@${tags.username}, error al limpiar las tareas completadas.`,
		);
	}
};
