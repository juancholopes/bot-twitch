const taskService = require("../services/taskService");
const logger = require("../utils/logger");
const { formatTaskList } = require("../utils/helpers");

const handleMyTasks = async (client, channel, tags) => {
	try {
		const user = taskService.findUser(tags.username);

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
		logger.error("Error en comando mytasks:", error);
		await client.say(
			channel,
			`@${tags.username}, error al consultar las tareas.`,
		);
	}
};

module.exports = { handleMyTasks };
