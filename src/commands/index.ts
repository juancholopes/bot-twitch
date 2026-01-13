import type { ChatUserstate, Client } from 'tmi.js';
import { handleClearDone } from './cleardone';
import { handleDeleteAll } from './delete';
import { handleDoneTask } from './done';
import { handleHello } from './hello';
import { handleHelp } from './help';
import { handleMyTasks } from './mytasks';
import { handleAddTask, handleTaskHelp } from './task';

type CommandHandler = (
	client: Client,
	channel: string,
	tags: ChatUserstate,
	...args: any[]
) => Promise<void>;

interface CommandHandlers {
	[key: string]: CommandHandler;
}

const commandHandlers: CommandHandlers = {
	mytasks: handleMyTasks,
	list: handleMyTasks, // Alias para mytasks
	task: handleAddTask,
	task_help: handleTaskHelp,
	done: handleDoneTask,
	cleardone: handleClearDone,
	delete: handleDeleteAll,
	hello: handleHello,
	help: handleHelp,
};

export default commandHandlers;
