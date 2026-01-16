import type { ChatUserstate, Client } from 'tmi.js';
import taskService from '../services/taskService';
import {
	formatCompletedTasks,
	parseTaskNumbers,
	validateTaskNumbers,
} from '../utils/helpers';
import logger from '../utils/logger';

export const handleDoneTask = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
	taskNumbersInput: string,
): Promise<void> => {
	try {
		if (!tags.username) return;

		if (!taskNumbersInput) {
			await client.say(
				channel,
				`@${tags.username}, debes especificar el número de la tarea. Ejemplo: "!done 1" o "!done 1, 2, 3"`,
			);
			return;
		}

		const taskNumbers = parseTaskNumbers(taskNumbersInput);

		if (taskNumbers.length === 0) {
			await client.say(
				channel,
				`@${tags.username}, debes especificar números válidos. Ejemplo: "!done 1" o "!done 1, 2, 3"`,
			);
			return;
		}

		const user = await taskService.findUser(tags.username);
		if (!user) {
			await client.say(
				channel,
				`@${tags.username}, no tienes tareas registradas.`,
			);
			return;
		}

		const validNumbers = validateTaskNumbers(taskNumbers, user.task.length);
		const invalidNumbers = taskNumbers.filter(
			(num) => !validNumbers.includes(num),
		);

		if (invalidNumbers.length > 0) {
			await client.say(
				channel,
				`@${tags.username}, números de tarea no válidos: ${invalidNumbers.join(', ')}. Tienes ${user.task.length} tarea(s).`,
			);
			return;
		}

		const result = await taskService.completeTasks(
			tags.username,
			validNumbers,
		);

		if (!result.success) {
			await client.say(
				channel,
				`@${tags.username}, error al marcar las tareas como completadas.`,
			);
			return;
		}

		const taskList = formatCompletedTasks(result.completedTasks || []);
		await client.say(
			channel,
			`@${tags.username}, marcaste como completada(s): ${taskList}. ¡Felicidades!`,
		);

		logger.info(
			`Usuario ${tags.username} completó ${result.completedTasks?.length || 0} tareas`,
			result.completedTasks,
		);
	} catch (error) {
		logger.error('Error en comando done:', error);
		await client.say(
			channel,
			`@${tags.username}, error al procesar las tareas completadas.`,
		);
	}
};
