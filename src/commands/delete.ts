import taskService from '../services/taskService';
import config from '../config/environment';
import logger from '../utils/logger';
import type { Client, ChatUserstate } from 'tmi.js';

export const handleDeleteAll = async (client: Client, channel: string, tags: ChatUserstate): Promise<void> => {
	try {
		// Verificar si es el streamer
		if (tags.username!.toLowerCase() !== config.twitch.username.toLowerCase()) {
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
		logger.error("Error en comando delete:", error);
		await client.say(
			channel,
			`@${tags.username}, error al eliminar las tareas.`,
		);
	}
};
