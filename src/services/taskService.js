const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const config = require("../config/environment");
const logger = require("../utils/logger");

class TaskService {
	constructor() {
		this.dataFile = path.resolve(config.tasks.dataFile);
		this.ensureDataFileExists();
		this.emitter = null;
		this.writeQueue = Promise.resolve();
	}

	ensureDataFileExists() {
		const dataDir = path.dirname(this.dataFile);
		if (!fsSync.existsSync(dataDir)) {
			fsSync.mkdirSync(dataDir, { recursive: true });
		}
		if (!fsSync.existsSync(this.dataFile)) {
			fsSync.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
		}
	}

	setEmitter(emitter) {
		this.emitter = emitter;
	}

	async readTasks() {
		try {
			const data = await fs.readFile(this.dataFile, "utf8");
			return JSON.parse(data);
		} catch (error) {
			logger.error("Error reading tasks file:", error);
			return [];
		}
	}

	async writeTasks(users) {
		const writeOp = this.writeQueue.then(async () => {
			const tempFile = `${this.dataFile}.tmp`;
			try {
				await fs.writeFile(tempFile, JSON.stringify(users, null, 2));
				await fs.rename(tempFile, this.dataFile);
				if (this.emitter) {
					this.emitter('tasksUpdated');
				}
				return true;
			} catch (error) {
				logger.error("Error writing tasks file:", error);
				try { await fs.unlink(tempFile); } catch (e) { }
				return false;
			}
		});

		this.writeQueue = writeOp.catch(() => { });
		return writeOp;
	}

	async findUser(username) {
		const users = await this.readTasks();
		return users.find((user) => user.user === username);
	}

	async getUserTaskCount(username) {
		const user = await this.findUser(username);
		if (!user) return 0;

		const pendingTasks = user.task ? user.task.length : 0;
		const completedTasks = user.completed ? user.completed.length : 0;
		return pendingTasks + completedTasks;
	}

	async addTasks(username, tasks) {
		const users = await this.readTasks();
		const userIndex = users.findIndex((user) => user.user === username);

		if (userIndex !== -1) {
			users[userIndex].task.push(...tasks);
		} else {
			users.push({
				user: username,
				task: tasks,
				completed: [],
			});
		}

		return await this.writeTasks(users);
	}

	async completeTasks(username, taskNumbers) {
		const users = await this.readTasks();
		const userIndex = users.findIndex((user) => user.user === username);

		if (userIndex === -1)
			return { success: false, message: "Usuario no encontrado" };

		const user = users[userIndex];
		if (!user.completed) user.completed = [];

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

		const success = await this.writeTasks(users);
		return { success, completedTasks };
	}

	async clearCompletedTasks(username) {
		const users = await this.readTasks();
		const userIndex = users.findIndex((user) => user.user === username);

		if (userIndex === -1)
			return { success: false, message: "Usuario no encontrado" };

		const user = users[userIndex];
		const clearedCount = user.completed ? user.completed.length : 0;
		user.completed = [];

		const success = await this.writeTasks(users);
		return { success, clearedCount };
	}

	async deleteAllTasks() {
		return await this.writeTasks([]);
	}
}

module.exports = new TaskService();
