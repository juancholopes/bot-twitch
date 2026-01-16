export const parseTaskNumbers = (input: string): number[] => {
	return input
		.split(',')
		.map((num) => parseInt(num.trim(), 10))
		.filter((num) => !Number.isNaN(num) && num > 0);
};

export const validateTaskNumbers = (
	numbers: number[],
	maxTasks: number,
): number[] => {
	return numbers.filter((num) => num >= 1 && num <= maxTasks);
};

export const formatTaskList = (tasks: string[]): string => {
	return tasks
		.map((task, index) => `${index + 1}. ${task.toLowerCase()}`)
		.join(', ');
};

export const formatCompletedTasks = (tasks: string[]): string => {
	return tasks.map((task) => task.toLowerCase()).join(', ');
};
