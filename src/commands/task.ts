import type { ChatUserstate, Client } from 'tmi.js';
import config from '../config/environment';
import taskService from '../services/taskService';
import logger from '../utils/logger';
import Validators from '../utils/validators';

export const handleAddTask = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
	taskInput: string,
): Promise<void> => {
	try {
		const validTasks = taskInput
			.split(',')
			.map((task) => Validators.sanitizeTask(task))
			.filter((task) => task.length > 0);

		if (validTasks.length > config.tasks.maxTasksPerCommand) {
			await client.say(
				channel,
				`@${tags.username}, solo puedes agregar un máximo de ${config.tasks.maxTasksPerCommand} tareas a la vez.`,
			);
			return;
		}

		// Normalize to uppercase for storage
		const taskList = validTasks.map((task) => task.toUpperCase());

		const currentTaskCount = await taskService.getUserTaskCount(
			tags.username!,
		);
		const availableSlots = config.tasks.maxTasksPerUser - currentTaskCount;

		if (availableSlots <= 0) {
			await client.say(
				channel,
				`@${tags.username}, ya tienes el máximo de ${config.tasks.maxTasksPerUser} tareas (incluyendo completadas). Usa "!cleardone" para limpiar las completadas.`,
			);
			return;
		}

		const tasksToAdd = taskList.slice(0, availableSlots);
		const tasksRejected = taskList.length - tasksToAdd.length;

		const success = await taskService.addTasks(tags.username!, tasksToAdd);

		if (!success) {
			await client.say(
				channel,
				`@${tags.username}, error al guardar las tareas.`,
			);
			return;
		}

		let confirmationMessage = `@${tags.username}, agregaste ${tasksToAdd.length} tarea(s): ${tasksToAdd.map((t) => t.toLowerCase()).join(', ')}`;

		if (tasksRejected > 0) {
			confirmationMessage += `. Se rechazaron ${tasksRejected} tarea(s) porque excederían el límite de ${config.tasks.maxTasksPerUser} tareas por usuario.`;
		}

		await client.say(channel, confirmationMessage);
		logger.info(
			`Usuario ${tags.username} agregó ${tasksToAdd.length} tareas`,
			tasksToAdd,
		);
	} catch (error) {
		logger.error('Error en comando task:', error);
		await client.say(
			channel,
			`@${tags.username}, error al procesar las tareas.`,
		);
	}
};

export const handleTaskHelp = async (
	client: Client,
	channel: string,
	tags: ChatUserstate,
): Promise<void> => {
	await client.say(
		channel,
		`Debes incluir al menos una tarea ${tags.username}, por ejemplo "!task tarea1, tarea2, tarea3, maximo 5 tareas."`,
	);
};
