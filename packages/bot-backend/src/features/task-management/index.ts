/**
 * Task Management Feature
 * Exports all task management functionality
 */

export * from "./commands";
// Old service (JSON-based, then Supabase direct)
// export { default as taskManagementService } from './task-management.service.supabase';

// New secure service (with rate limiting and validation)
export { default as taskManagementService } from "./task-management.service.secure";
export * from "./models";
