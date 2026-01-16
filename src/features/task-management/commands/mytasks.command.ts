import type { ChatUserstate, Client } from 'tmi.js';
import logger from '@infrastructure/logging/logger';
import taskManagementService from '../task-management.service';
import { formatTaskList } from '../utils';

export const handleMyTasks = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
): Promise<void> => {
	try {
		if (!tags.username) return;

		const user = await taskManagementService.findUser(tags.username);

		if (user && user.task.length > 0) {
			const taskList = formatTaskList(user.task);
			const completedCount = user.completed ? user.completed.length : 0;
			const totalTasks = user.task.length + completedCount;

			await client.say(
				channel,
				`@${tags.username}, tus tareas son: ${taskList} (${totalTasks}/5 total, ${completedCount} completadas)`,
			);
		} else {
			await client.say(
				channel,
				`@${tags.username}, no tienes tareas registradas. Usa "!task tarea1, tarea2" para agregar tareas.`,
			);
		}

		logger.info(`Usuario ${tags.username} consultó sus tareas`);
	} catch (error) {
		logger.error('Error en comando mytasks:', error);
		await client.say(
			channel,
			`@${tags.username}, error al consultar las tareas.`,
		);
	}
};
