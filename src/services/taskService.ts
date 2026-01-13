import * as fsSync from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import config from '../config/environment';
import logger from '../utils/logger';

interface UserTask {
	user: string;
	task: string[];
	completed: string[];
}

type EventEmitter = (event: string) => void;

class TaskService {
	private dataFile: string;
	private emitter: EventEmitter | null = null;
	private writeQueue: Promise<boolean>;

	constructor() {
		this.dataFile = path.resolve(config.tasks.dataFile);
		this.ensureDataFileExists();
		this.writeQueue = Promise.resolve(true);
	}

	private ensureDataFileExists(): void {
		const dataDir = path.dirname(this.dataFile);
		if (!fsSync.existsSync(dataDir)) {
			fsSync.mkdirSync(dataDir, { recursive: true });
		}
		if (!fsSync.existsSync(this.dataFile)) {
			fsSync.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
		}
	}

	setEmitter(emitter: EventEmitter): void {
		this.emitter = emitter;
	}

	async readTasks(): Promise<UserTask[]> {
		try {
			const data = await fs.readFile(this.dataFile, 'utf8');
			return JSON.parse(data);
		} catch (error) {
			logger.error('Error reading tasks file:', error);
			return [];
		}
	}

	async writeTasks(users: UserTask[]): Promise<boolean> {
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
				logger.error('Error writing tasks file:', error);
				try {
					await fs.unlink(tempFile);
				} catch (e) {}
				return false;
			}
		});

		this.writeQueue = writeOp.catch(() => false);
		return writeOp;
	}

	async findUser(username: string): Promise<UserTask | undefined> {
		const users = await this.readTasks();
		return users.find((user) => user.user === username);
	}

	async getUserTaskCount(username: string): Promise<number> {
		const user = await this.findUser(username);
		if (!user) return 0;

		const pendingTasks = user.task ? user.task.length : 0;
		const completedTasks = user.completed ? user.completed.length : 0;
		return pendingTasks + completedTasks;
	}

	async addTasks(username: string, tasks: string[]): Promise<boolean> {
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

	async completeTasks(
		username: string,
		taskNumbers: number[],
	): Promise<{
		success: boolean;
		message?: string;
		completedTasks?: string[];
	}> {
		const users = await this.readTasks();
		const userIndex = users.findIndex((user) => user.user === username);

		if (userIndex === -1)
			return { success: false, message: 'Usuario no encontrado' };

		const user = users[userIndex];
		if (!user.completed) user.completed = [];

		const sortedNumbers = [...new Set(taskNumbers)].sort((a, b) => b - a);
		const completedTasks: string[] = [];

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

	async clearCompletedTasks(
		username: string,
	): Promise<{ success: boolean; message?: string; clearedCount?: number }> {
		const users = await this.readTasks();
		const userIndex = users.findIndex((user) => user.user === username);

		if (userIndex === -1)
			return { success: false, message: 'Usuario no encontrado' };

		const user = users[userIndex];
		const clearedCount = user.completed ? user.completed.length : 0;
		user.completed = [];

		const success = await this.writeTasks(users);
		return { success, clearedCount };
	}

	async deleteAllTasks(): Promise<boolean> {
		return await this.writeTasks([]);
	}
}

export default new TaskService();
