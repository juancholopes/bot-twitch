import type { ChatUserstate, Client } from 'tmi.js';
import config from '@infrastructure/config/environment';
import logger from '@infrastructure/logging/logger';

export const handleHelp = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
	params?: string,
): Promise<void> => {
	try {
		if (!params) {
			// Mostrar lista de comandos disponibles
			await client.say(
				channel,
				`@${tags.username}, comandos disponibles: !list, !task, !done, !cleardone, !delete, !hello. Usa "!help <comando>" para detalles.`,
			);
		} else {
			// Mostrar detalles específicos del comando
			const command = params.trim().toLowerCase();
			let detailMessage = '';

			switch (command) {
				case 'list':
				case 'mytasks':
					detailMessage =
						'Comando !list o !mytasks: Muestra tus tareas actuales con numeración. Uso: !list';
					break;
				case 'task':
					detailMessage = `Comando !task: Agrega nuevas tareas. Máximo ${config.tasks.maxTasksPerCommand} por comando y ${config.tasks.maxTasksPerUser} total por usuario (incluyendo completadas). Uso: !task tarea1, tarea2`;
					break;
				case 'done':
					detailMessage =
						'Comando !done: Marca tareas como completadas usando sus números. Uso: !done 1 o !done 1, 2, 3';
					break;
				case 'cleardone':
					detailMessage =
						'Comando !cleardone: Limpia todas las tareas completadas para liberar espacio. Uso: !cleardone';
					break;
				case 'delete':
					detailMessage =
						'Comando !delete: Elimina todas las tareas de todos los usuarios. Solo disponible para el streamer. Uso: !delete';
					break;
				case 'hello':
					detailMessage =
						'Comando !hello: Saludo del bot. Uso: !hello';
					break;
				default:
					detailMessage = `No hay información disponible para el comando "${command}". Comandos disponibles: list, task, done, cleardone, delete, hello`;
			}

			await client.say(channel, `@${tags.username}, ${detailMessage}`);
		}

		logger.info(
			`Usuario ${tags.username} ejecutó comando help${params ? ` con parámetro: ${params}` : ''}`,
		);
	} catch (error) {
		logger.error('Error en comando !help:', error);
		await client.say(
			channel,
			`@${tags.username}, error al mostrar la ayuda.`,
		);
	}
};
