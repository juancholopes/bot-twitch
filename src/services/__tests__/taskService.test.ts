// Mock fs module first
jest.mock('fs', () => {
	return {
		promises: {
			readFile: jest.fn(),
			writeFile: jest.fn(),
			rename: jest.fn(),
			unlink: jest.fn(),
		},
		existsSync: jest.fn().mockReturnValue(true),
		mkdirSync: jest.fn(),
		writeFileSync: jest.fn(),
	};
});

// Mock config
jest.mock('../../config/environment', () => ({
	default: {
		tasks: {
			dataFile: './data/test-tasks.json',
		},
	},
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
	default: {
		error: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
	},
}));

import { promises as fs } from 'fs';
import taskService from '../taskService';

describe('TaskService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('readTasks', () => {
		it('should return empty array if file reading fails', async () => {
			(fs.readFile as jest.Mock).mockRejectedValue(
				new Error('File not found'),
			);
			const tasks = await taskService.readTasks();
			expect(tasks).toEqual([]);
		});

		it('should return parsed tasks', async () => {
			const mockData = [{ user: 'test', task: ['t1'], completed: [] }];
			(fs.readFile as jest.Mock).mockResolvedValue(
				JSON.stringify(mockData),
			);
			const tasks = await taskService.readTasks();
			expect(tasks).toEqual(mockData);
		});
	});

	describe('addTasks', () => {
		it('should add tasks to existing user', async () => {
			const initialData = [
				{ user: 'test', task: ['old'], completed: [] },
			];
			(fs.readFile as jest.Mock).mockResolvedValue(
				JSON.stringify(initialData),
			);
			(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
			(fs.rename as jest.Mock).mockResolvedValue(undefined);

			await taskService.addTasks('test', ['new']);

			expect(fs.writeFile).toHaveBeenCalled();
			const writeArgs = (fs.writeFile as jest.Mock).mock.calls[0];
			const writtenData = JSON.parse(writeArgs[1]);

			expect(writtenData[0].task).toEqual(['old', 'new']);
		});

		it('should create new user if not exists', async () => {
			(fs.readFile as jest.Mock).mockResolvedValue('[]');
			(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
			(fs.rename as jest.Mock).mockResolvedValue(undefined);

			await taskService.addTasks('newuser', ['task1']);

			const writeArgs = (fs.writeFile as jest.Mock).mock.calls[0];
			const writtenData = JSON.parse(writeArgs[1]);

			expect(writtenData[0].user).toEqual('newuser');
			expect(writtenData[0].task).toEqual(['task1']);
		});
	});

	describe('completeTasks', () => {
		it('should fail if user not found', async () => {
			(fs.readFile as jest.Mock).mockResolvedValue('[]');
			const result = await taskService.completeTasks('test', [1]);
			expect(result.success).toBe(false);
		});

		it('should move specified tasks to completed', async () => {
			const initialData = [
				{
					user: 'test',
					task: ['t1', 't2', 't3'],
					completed: [],
				},
			];
			(fs.readFile as jest.Mock).mockResolvedValue(
				JSON.stringify(initialData),
			);
			(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
			(fs.rename as jest.Mock).mockResolvedValue(undefined);

			// Complete task 2 (index 1) which is 't2'
			const result = await taskService.completeTasks('test', [2]);

			expect(result.success).toBeTruthy(); // could be true or promise result depending on implementation return
			expect(result.completedTasks).toEqual(['t2']);

			const writeArgs = (fs.writeFile as jest.Mock).mock.calls[0];
			const writtenData = JSON.parse(writeArgs[1]);
			expect(writtenData[0].task).toEqual(['t1', 't3']);
			expect(writtenData[0].completed).toEqual(['t2']);
		});
	});

	describe('getUserTaskCount', () => {
		it('should return 0 for non-existent user', async () => {
			(fs.readFile as jest.Mock).mockResolvedValue('[]');
			const count = await taskService.getUserTaskCount('nobody');
			expect(count).toBe(0);
		});

		it('should count both pending and completed tasks', async () => {
			const initialData = [
				{
					user: 'test',
					task: ['t1'],
					completed: ['c1', 'c2'],
				},
			];
			(fs.readFile as jest.Mock).mockResolvedValue(
				JSON.stringify(initialData),
			);
			const count = await taskService.getUserTaskCount('test');
			expect(count).toBe(3);
		});
	});
});
