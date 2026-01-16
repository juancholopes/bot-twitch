export interface UserTask {
	user: string;
	task: string[];
	completed: string[];
}

export type TaskEventEmitter = (event: string) => void;
