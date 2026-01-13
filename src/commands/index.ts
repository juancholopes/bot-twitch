import { handleMyTasks } from "./mytasks";
import { handleAddTask, handleTaskHelp } from "./task";
import { handleDoneTask } from "./done";
import { handleClearDone } from "./cleardone";
import { handleDeleteAll } from "./delete";
import { handleHello } from "./hello";
import { handleHelp } from "./help";
import type { Client, ChatUserstate } from 'tmi.js';

type CommandHandler = (client: Client, channel: string, tags: ChatUserstate, ...args: any[]) => Promise<void>;

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
