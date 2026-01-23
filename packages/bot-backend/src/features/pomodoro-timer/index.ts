/**
 * Pomodoro Timer Feature
 * Public exports for the feature
 */

// Old services (JSON-based, then Supabase direct)
// export { PomodoroConfigService } from './pomodoro-config.service.supabase';
// export { PomodoroStatsService } from './pomodoro-stats.service.supabase';

// New secure services (with rate limiting and validation)
export { PomodoroConfigServiceSecure as PomodoroConfigService } from "./pomodoro-config.service.secure";
export { PomodoroStatsServiceSecure as PomodoroStatsService } from "./pomodoro-stats.service.secure";
export { PomodoroTimerService } from "./pomodoro-timer.service";
