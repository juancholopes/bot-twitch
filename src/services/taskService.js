const fs = require("fs");
const path = require("path");
const config = require("../config/environment");

class TaskService {
	constructor() {
		this.dataFile = path.resolve(config.tasks.dataFile);
		this.ensureDataFileExists();
		this.emitter = null;
	}

	ensureDataFileExists() {
		const dataDir = path.dirname(this.dataFile);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}
		if (!fs.existsSync(this.dataFile)) {
			fs.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
		}
	}

	setEmitter(emitter) {
		this.emitter = emitter;
	}

	readTasks() {
		try {
			const data = fs.readFileSync(this.dataFile, "utf8");
			return JSON.parse(data);
		} catch (error) {
			console.error("Error reading tasks file:", error);
			return [];
		}
	}

	writeTasks(users) {
		try {
			fs.writeFileSync(this.dataFile, JSON.stringify(users, null, 2));
			if (this.emitter) {
				this.emitter('tasksUpdated');
			}
			return true;
		} catch (error) {
			console.error("Error writing tasks file:", error);
			return false;
		}
	}

	findUser(username) {
		const users = this.readTasks();
		return users.find((user) => user.user === username);
	}

	findUserIndex(username) {
		const users = this.readTasks();
		return users.findIndex((user) => user.user === username);
	}

	getUserTaskCount(username) {
		const user = this.findUser(username);
		if (!user) return 0;

		const pendingTasks = user.task ? user.task.length : 0;
		const completedTasks = user.completed ? user.completed.length : 0;
		return pendingTasks + completedTasks;
	}

	addTasks(username, tasks) {
		const users = this.readTasks();
		const userIndex = this.findUserIndex(username);

		if (userIndex !== -1) {
			users[userIndex].task.push(...tasks);
		} else {
			users.push({
				user: username,
				task: tasks,
				completed: [],
			});
		}

		return this.writeTasks(users);
	}

	completeTasks(username, taskNumbers) {
		const users = this.readTasks();
		const userIndex = this.findUserIndex(username);

		if (userIndex === -1)
			return { success: false, message: "Usuario no encontrado" };

		const user = users[userIndex];
		if (!user.completed) user.completed = [];

		// Ordenar números de mayor a menor para evitar problemas de índices
		const sortedNumbers = [...new Set(taskNumbers)].sort((a, b) => b - a);
		const completedTasks = [];

		for (const taskNumber of sortedNumbers) {
			const taskIndex = taskNumber - 1;
			if (taskIndex >= 0 && taskIndex < user.task.length) {
				const completedTask = user.task.splice(taskIndex, 1)[0];
				user.completed.push(completedTask);
				completedTasks.push(completedTask);
			}
		}

		const success = this.writeTasks(users);
		return { success, completedTasks };
	}

	clearCompletedTasks(username) {
		const users = this.readTasks();
		const userIndex = this.findUserIndex(username);

		if (userIndex === -1)
			return { success: false, message: "Usuario no encontrado" };

		const user = users[userIndex];
		const clearedCount = user.completed ? user.completed.length : 0;
		user.completed = [];

		const success = this.writeTasks(users);
		return { success, clearedCount };
	}

	deleteAllTasks() {
		return this.writeTasks([]);
	}
}

module.exports = new TaskService();
