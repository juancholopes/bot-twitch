const taskService = require("../services/taskService");
const logger = require("../utils/logger");

const handleClearDone = async (client, channel, tags) => {
	try {
		const result = taskService.clearCompletedTasks(tags.username);

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
		logger.error("Error en comando cleardone:", error);
		await client.say(
			channel,
			`@${tags.username}, error al limpiar las tareas completadas.`,
		);
	}
};

module.exports = { handleClearDone };
