-- =============================================
-- Bot Twitch - Fix Security Definer Views
-- Migration 005: Remove SECURITY DEFINER from Views
-- =============================================

-- =============================================
-- 1. DROP EXISTING VIEWS COMPLETELY
-- =============================================

-- Drop views completely to remove any security properties
DROP VIEW IF EXISTS tasks_public CASCADE;
DROP VIEW IF EXISTS pomodoro_stats_public CASCADE;

-- =============================================
-- 2. CREATE VIEWS WITHOUT SECURITY DEFINER
-- =============================================

-- Create tasks_public WITHOUT any security properties
CREATE VIEW tasks_public
WITH (security_invoker = true)
AS
SELECT
  id,
  username,
  task_text,
  completed,
  created_at
FROM tasks
ORDER BY created_at DESC;

-- Create pomodoro_stats_public WITHOUT any security properties
CREATE VIEW pomodoro_stats_public
WITH (security_invoker = true)
AS
SELECT
  date,
  sessions_completed,
  short_breaks_taken,
  long_breaks_taken,
  total_work_time,
  jsonb_array_length(sessions) as session_count
FROM pomodoro_stats
ORDER BY date DESC;

-- =============================================
-- 3. ENABLE RLS ON rate_limit_tracking
-- =============================================

-- Enable RLS on rate_limit_tracking table
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read for monitoring
CREATE POLICY "rate_limit_read_authenticated" ON rate_limit_tracking
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow anon to read only recent records (needed for rate limiting to work)
CREATE POLICY "rate_limit_read_recent_anon" ON rate_limit_tracking
    FOR SELECT
    TO anon
    USING (created_at > NOW() - INTERVAL '1 hour');

-- Policy: Allow insert/update/delete only from SECURITY DEFINER functions
-- (The check_rate_limit function already handles this correctly)

-- =============================================
-- 4. RE-GRANT PERMISSIONS ON VIEWS
-- =============================================

-- Grant permissions on recreated views
GRANT SELECT ON tasks_public TO anon;
GRANT SELECT ON tasks_public TO authenticated;

GRANT SELECT ON pomodoro_stats_public TO anon;
GRANT SELECT ON pomodoro_stats_public TO authenticated;

-- =============================================
-- 5. VERIFY FIXES
-- =============================================

-- Check that views don't have SECURITY DEFINER
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check if any views still have security_definer
    SELECT COUNT(*)
    INTO v_count
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('tasks_public', 'pomodoro_stats_public')
    AND definition LIKE '%SECURITY DEFINER%';

    IF v_count = 0 THEN
        RAISE NOTICE '✅ Views successfully created without SECURITY DEFINER';
    ELSE
        RAISE WARNING '⚠️ Some views may still have SECURITY DEFINER';
    END IF;
END $$;

-- Check that RLS is enabled on rate_limit_tracking
DO $$
DECLARE
    v_rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity
    INTO v_rls_enabled
    FROM pg_class
    WHERE relname = 'rate_limit_tracking' AND relnamespace = 'public'::regnamespace;

    IF v_rls_enabled THEN
        RAISE NOTICE '✅ RLS successfully enabled on rate_limit_tracking';
    ELSE
        RAISE WARNING '⚠️ RLS not enabled on rate_limit_tracking';
    END IF;
END $$;

-- =============================================
-- 6. COMMENTS
-- =============================================

COMMENT ON VIEW tasks_public IS 'Public read-only view of tasks (security_invoker=true)';
COMMENT ON VIEW pomodoro_stats_public IS 'Public read-only view of pomodoro statistics (security_invoker=true)';

COMMENT ON POLICY "rate_limit_read_authenticated" ON rate_limit_tracking
IS 'Allows authenticated users to read rate limit records for monitoring';

COMMENT ON POLICY "rate_limit_read_recent_anon" ON rate_limit_tracking
IS 'Allows anonymous users to read recent rate limit records (needed for rate limiting functionality)';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- This migration should resolve the remaining warnings:
-- 1. security_definer_view for tasks_public
-- 2. security_definer_view for pomodoro_stats_public
-- 3. rls_disabled_in_public for rate_limit_tracking
-- =============================================
