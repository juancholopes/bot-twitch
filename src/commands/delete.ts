import type { ChatUserstate, Client } from 'tmi.js';
import config from '../config/environment';
import taskService from '../services/taskService';
import logger from '../utils/logger';

export const handleDeleteAll = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
): Promise<void> => {
	try {
		if (!tags.username) return;
		
		// Verificar si es el streamer
		if (
			tags.username.toLowerCase() !==
			config.twitch.username.toLowerCase()
		) {
			await client.say(
				channel,
				`@${tags.username}, no tienes permisos para ejecutar este comando.`,
			);
			return;
		}

		const success = await taskService.deleteAllTasks();

		if (!success) {
			await client.say(
				channel,
				`@${tags.username}, error al eliminar las tareas.`,
			);
			return;
		}

		await client.say(
			channel,
			`@${tags.username}, se eliminaron todas las tareas de todos los usuarios.`,
		);
		logger.info(`${tags.username} eliminó todas las tareas del sistema.`);
	} catch (error) {
		logger.error('Error en comando delete:', error);
		await client.say(
			channel,
			`@${tags.username}, error al eliminar las tareas.`,
		);
	}
};
