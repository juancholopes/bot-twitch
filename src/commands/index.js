const { handleMyTasks } = require("./mytasks");
const { handleAddTask, handleTaskHelp } = require("./task");
const { handleDoneTask } = require("./done");
const { handleClearDone } = require("./cleardone");
const { handleDeleteAll } = require("./delete");
const { handleHello } = require("./hello");
const { handleHelp } = require("./help");

const commandHandlers = {
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

module.exports = commandHandlers;
