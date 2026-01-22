-- =============================================
-- Bot Twitch - Advanced Security Configuration
-- Migration 003: Rate Limiting & Security Hardening
-- =============================================

-- =============================================
-- 1. RATE LIMITING INFRASTRUCTURE
-- =============================================

-- Table to track API call rates per user/IP
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,        -- username or IP address
  endpoint TEXT NOT NULL,           -- function or table name
  call_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT rate_limit_identifier_check CHECK (char_length(identifier) > 0)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_endpoint
ON rate_limit_tracking(identifier, endpoint, window_start DESC);

-- Simple index for cleanup queries (without time-based predicate)
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at
ON rate_limit_tracking(created_at DESC);

-- =============================================
-- 2. RATE LIMITING FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_calls INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_call_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Clean up old records first
  DELETE FROM rate_limit_tracking
  WHERE created_at < NOW() - INTERVAL '1 hour';

  -- Get current window
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count calls in current window
  SELECT COALESCE(SUM(call_count), 0)
  INTO v_call_count
  FROM rate_limit_tracking
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;

  -- Check if limit exceeded
  IF v_call_count >= p_max_calls THEN
    RETURN FALSE;
  END IF;

  -- Record this call
  INSERT INTO rate_limit_tracking (identifier, endpoint, call_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, NOW())
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;

-- =============================================
-- 3. INPUT VALIDATION FUNCTIONS
-- =============================================

-- Validate username (alphanumeric, underscore, 3-25 chars)
CREATE OR REPLACE FUNCTION validate_username(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_username ~ '^[a-zA-Z0-9_]{3,25}$';
END;
$$;

-- Validate task text (prevent XSS, SQL injection attempts)
CREATE OR REPLACE FUNCTION sanitize_task_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove potentially dangerous characters
  RETURN REGEXP_REPLACE(
    TRIM(p_text),
    '[<>{}$;\\]',
    '',
    'g'
  );
END;
$$;

-- =============================================
-- 4. SECURE WRAPPER FUNCTIONS
-- =============================================

-- Secure function to add task with validation and rate limiting
CREATE OR REPLACE FUNCTION secure_add_task(
  p_username TEXT,
  p_task_text TEXT,
  p_identifier TEXT DEFAULT 'anonymous'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id UUID;
  v_sanitized_text TEXT;
BEGIN
  -- Rate limit check (100 calls per minute per identifier)
  IF NOT check_rate_limit(p_identifier, 'add_task', 100, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Validate username
  IF NOT validate_username(p_username) THEN
    RAISE EXCEPTION 'Invalid username format. Use 3-25 alphanumeric characters.';
  END IF;

  -- Sanitize task text
  v_sanitized_text := sanitize_task_text(p_task_text);

  IF char_length(v_sanitized_text) = 0 THEN
    RAISE EXCEPTION 'Task text cannot be empty.';
  END IF;

  IF char_length(v_sanitized_text) > 500 THEN
    RAISE EXCEPTION 'Task text too long. Maximum 500 characters.';
  END IF;

  -- Insert task
  INSERT INTO tasks (username, task_text)
  VALUES (LOWER(TRIM(p_username)), v_sanitized_text)
  RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$;

-- Secure function to update task status
CREATE OR REPLACE FUNCTION secure_update_task_status(
  p_task_id UUID,
  p_completed BOOLEAN,
  p_identifier TEXT DEFAULT 'anonymous'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit check
  IF NOT check_rate_limit(p_identifier, 'update_task', 200, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Update task
  UPDATE tasks
  SET completed = p_completed
  WHERE id = p_task_id;

  RETURN FOUND;
END;
$$;

-- Secure function to delete task
CREATE OR REPLACE FUNCTION secure_delete_task(
  p_task_id UUID,
  p_identifier TEXT DEFAULT 'anonymous'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit check
  IF NOT check_rate_limit(p_identifier, 'delete_task', 100, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Delete task
  DELETE FROM tasks
  WHERE id = p_task_id;

  RETURN FOUND;
END;
$$;

-- =============================================
-- 5. POMODORO SECURE FUNCTIONS
-- =============================================

-- Secure function to update pomodoro stats
CREATE OR REPLACE FUNCTION secure_update_pomodoro_stats(
  p_date DATE,
  p_sessions_completed INTEGER,
  p_short_breaks INTEGER,
  p_long_breaks INTEGER,
  p_total_work_time INTEGER,
  p_sessions JSONB,
  p_identifier TEXT DEFAULT 'anonymous'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit check
  IF NOT check_rate_limit(p_identifier, 'update_pomodoro_stats', 60, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Validate inputs
  IF p_sessions_completed < 0 OR p_short_breaks < 0 OR p_long_breaks < 0 OR p_total_work_time < 0 THEN
    RAISE EXCEPTION 'Statistics values must be non-negative.';
  END IF;

  -- Upsert stats
  INSERT INTO pomodoro_stats (
    date,
    sessions_completed,
    short_breaks_taken,
    long_breaks_taken,
    total_work_time,
    sessions
  )
  VALUES (
    p_date,
    p_sessions_completed,
    p_short_breaks,
    p_long_breaks,
    p_total_work_time,
    p_sessions
  )
  ON CONFLICT (date)
  DO UPDATE SET
    sessions_completed = EXCLUDED.sessions_completed,
    short_breaks_taken = EXCLUDED.short_breaks_taken,
    long_breaks_taken = EXCLUDED.long_breaks_taken,
    total_work_time = EXCLUDED.total_work_time,
    sessions = EXCLUDED.sessions;

  RETURN TRUE;
END;
$$;

-- Secure function to update pomodoro config
CREATE OR REPLACE FUNCTION secure_update_pomodoro_config(
  p_work_duration INTEGER,
  p_short_break INTEGER,
  p_long_break INTEGER,
  p_sessions_before_long INTEGER,
  p_identifier TEXT DEFAULT 'anonymous'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit check (stricter for config changes)
  IF NOT check_rate_limit(p_identifier, 'update_pomodoro_config', 10, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Config changes are limited to 10 per 5 minutes.';
  END IF;

  -- Validate inputs
  IF p_work_duration <= 0 OR p_short_break <= 0 OR p_long_break <= 0 OR p_sessions_before_long <= 0 THEN
    RAISE EXCEPTION 'All duration values must be positive.';
  END IF;

  IF p_work_duration > 240 THEN
    RAISE EXCEPTION 'Work duration cannot exceed 240 minutes.';
  END IF;

  -- Update config
  UPDATE pomodoro_config
  SET
    work_duration = p_work_duration,
    short_break_duration = p_short_break,
    long_break_duration = p_long_break,
    sessions_before_long_break = p_sessions_before_long
  WHERE id = 1;

  RETURN TRUE;
END;
$$;

-- =============================================
-- 6. SECURITY VIEWS (Read-Only Access)
-- =============================================

-- Safe view for tasks (excludes internal IDs from public queries)
CREATE OR REPLACE VIEW tasks_public AS
SELECT
  id,
  username,
  task_text,
  completed,
  created_at
FROM tasks
ORDER BY created_at DESC;

-- Safe view for pomodoro stats
CREATE OR REPLACE VIEW pomodoro_stats_public AS
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
-- 7. RLS POLICIES FOR VIEWS
-- =============================================

-- Note: Views inherit RLS from base tables
-- Grant public access to views
GRANT SELECT ON tasks_public TO anon;
GRANT SELECT ON tasks_public TO authenticated;

GRANT SELECT ON pomodoro_stats_public TO anon;
GRANT SELECT ON pomodoro_stats_public TO authenticated;

-- =============================================
-- 8. GRANT EXECUTE PERMISSIONS
-- =============================================

-- Grant execute on secure wrapper functions
GRANT EXECUTE ON FUNCTION secure_add_task(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION secure_add_task(TEXT, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION secure_update_task_status(UUID, BOOLEAN, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION secure_update_task_status(UUID, BOOLEAN, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION secure_delete_task(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION secure_delete_task(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION secure_update_pomodoro_stats(DATE, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION secure_update_pomodoro_config(INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;

-- =============================================
-- 9. REVOKE DIRECT TABLE ACCESS FROM ANON
-- =============================================

-- Revoke direct insert/update/delete from anon users
-- They must use secure wrapper functions
REVOKE INSERT, UPDATE, DELETE ON tasks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON pomodoro_stats FROM anon;
REVOKE ALL ON pomodoro_config FROM anon;

-- =============================================
-- 10. MONITORING AND ALERTS
-- =============================================

-- Function to get rate limit violations
CREATE OR REPLACE FUNCTION get_rate_limit_violations(
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  identifier TEXT,
  endpoint TEXT,
  total_calls BIGINT,
  first_call TIMESTAMPTZ,
  last_call TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.identifier,
    rl.endpoint,
    SUM(rl.call_count)::BIGINT as total_calls,
    MIN(rl.window_start) as first_call,
    MAX(rl.window_start) as last_call
  FROM rate_limit_tracking rl
  WHERE rl.created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  GROUP BY rl.identifier, rl.endpoint
  HAVING SUM(rl.call_count) > 1000
  ORDER BY total_calls DESC;
END;
$$;

-- =============================================
-- 11. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE rate_limit_tracking IS 'Tracks API calls for rate limiting - auto-cleanup after 1 hour';
COMMENT ON FUNCTION check_rate_limit IS 'Rate limiting function - returns false if limit exceeded';
COMMENT ON FUNCTION validate_username IS 'Validates Twitch username format (3-25 alphanumeric + underscore)';
COMMENT ON FUNCTION sanitize_task_text IS 'Removes potentially dangerous characters from task text';
COMMENT ON FUNCTION secure_add_task IS 'Secure wrapper for adding tasks with validation and rate limiting';
COMMENT ON FUNCTION secure_update_task_status IS 'Secure wrapper for updating task completion status';
COMMENT ON FUNCTION secure_delete_task IS 'Secure wrapper for deleting tasks';
COMMENT ON FUNCTION secure_update_pomodoro_stats IS 'Secure wrapper for updating pomodoro statistics';
COMMENT ON FUNCTION secure_update_pomodoro_config IS 'Secure wrapper for updating pomodoro configuration';
COMMENT ON VIEW tasks_public IS 'Public read-only view of tasks';
COMMENT ON VIEW pomodoro_stats_public IS 'Public read-only view of pomodoro statistics';
COMMENT ON FUNCTION get_rate_limit_violations IS 'Returns identifiers with excessive API calls';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
