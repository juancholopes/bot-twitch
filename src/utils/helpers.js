const parseTaskNumbers = (input) => {
	return input
		.split(',')
		.map((num) => parseInt(num.trim()))
		.filter((num) => !Number.isNaN(num) && num > 0);
};

const validateTaskNumbers = (numbers, maxTasks) => {
	return numbers.filter((num) => num >= 1 && num <= maxTasks);
};

const formatTaskList = (tasks) => {
	return tasks
		.map((task, index) => `${index + 1}. ${task.toLowerCase()}`)
		.join(', ');
};

const formatCompletedTasks = (tasks) => {
	return tasks.map((task) => task.toLowerCase()).join(', ');
};

module.exports = {
	parseTaskNumbers,
	validateTaskNumbers,
	formatTaskList,
	formatCompletedTasks,
};
