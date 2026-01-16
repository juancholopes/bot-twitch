/**
 * Task domain models - Shared between bot-backend and obs-overlay
 */

export interface Task {
  id: string;
  text: string;
  username: string;
  completed: boolean;
  timestamp: number;
}

export interface UserTasks {
  user: string;
  task?: string[];
  completed?: string[];
}
