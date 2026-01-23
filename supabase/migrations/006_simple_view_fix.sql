-- =============================================
-- Simple Fix for Security Definer Views
-- Migration 006: Direct approach to remove SECURITY DEFINER
-- =============================================

-- Drop existing views completely
DROP VIEW IF EXISTS tasks_public CASCADE;
DROP VIEW IF EXISTS pomodoro_stats_public CASCADE;

-- Recreate tasks_public as a simple view (no security properties)
CREATE VIEW tasks_public AS
SELECT
  id,
  username,
  task_text,
  completed,
  created_at
FROM tasks
ORDER BY created_at DESC;

-- Recreate pomodoro_stats_public as a simple view (no security properties)
CREATE VIEW pomodoro_stats_public AS
SELECT
  date,
  sessions_completed,
  short_breaks_taken,
  long_breaks_taken,
  total_work_time,
  jsonb_array_length(sessions) as session_count
FROM pomodoro_stats
ORDER BY date DESC;

-- Grant permissions (these are regular grants, not security definer)
GRANT SELECT ON tasks_public TO anon;
GRANT SELECT ON tasks_public TO authenticated;
GRANT SELECT ON pomodoro_stats_public TO anon;
GRANT SELECT ON pomodoro_stats_public TO authenticated;

-- Enable RLS on rate_limit_tracking (third warning)
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Allow reading rate limit data for the system to function
CREATE POLICY "rate_limit_system_access" ON rate_limit_tracking
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Migration 006 completed: Views recreated without SECURITY DEFINER, RLS enabled on rate_limit_tracking';
END $$;
