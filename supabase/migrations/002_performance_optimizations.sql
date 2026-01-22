-- =============================================
-- Bot Twitch - Performance & Security Optimizations
-- Migration 002: Addressing Supabase Performance Lints
-- =============================================

-- =============================================
-- 1. PERFORMANCE OPTIMIZATIONS
-- =============================================

-- Add GIN index for JSONB sessions column in pomodoro_stats
-- This improves query performance when searching within the sessions array
CREATE INDEX IF NOT EXISTS idx_pomodoro_stats_sessions_gin
ON pomodoro_stats USING GIN (sessions);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_username_created
ON tasks(username, created_at DESC)
WHERE completed = FALSE;

-- Add partial index for completed tasks (useful for archival queries)
CREATE INDEX IF NOT EXISTS idx_tasks_completed_created
ON tasks(created_at DESC)
WHERE completed = TRUE;

-- =============================================
-- 2. SECURITY ENHANCEMENTS
-- =============================================

-- Drop overly permissive policies and create more specific ones
DROP POLICY IF EXISTS "Allow service role all operations" ON tasks;
DROP POLICY IF EXISTS "Allow service role all operations" ON pomodoro_stats;
DROP POLICY IF EXISTS "Allow service role all operations" ON pomodoro_config;

-- Tasks: Separate policies for better security audit
CREATE POLICY "tasks_insert_authenticated" ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "tasks_update_authenticated" ON tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "tasks_delete_authenticated" ON tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- Pomodoro Stats: Separate policies
CREATE POLICY "pomodoro_stats_insert_authenticated" ON pomodoro_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "pomodoro_stats_update_authenticated" ON pomodoro_stats
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "pomodoro_stats_delete_authenticated" ON pomodoro_stats
    FOR DELETE
    TO authenticated
    USING (true);

-- Pomodoro Config: Restrict to updates only (no delete/insert)
CREATE POLICY "pomodoro_config_update_authenticated" ON pomodoro_config
    FOR UPDATE
    TO authenticated
    USING (id = 1)
    WITH CHECK (id = 1);

-- =============================================
-- 3. ADD MISSING CONSTRAINTS
-- =============================================

-- Ensure username is lowercase and trimmed
CREATE OR REPLACE FUNCTION normalize_username()
RETURNS TRIGGER AS $$
BEGIN
    NEW.username = LOWER(TRIM(NEW.username));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_normalize_username
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION normalize_username();

-- =============================================
-- 4. VACUUM AND ANALYZE CONFIGURATION
-- =============================================

-- Set autovacuum settings for high-frequency tables
ALTER TABLE tasks SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE pomodoro_stats SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- =============================================
-- 5. FUNCTION OPTIMIZATIONS
-- =============================================

-- Optimize get_user_active_tasks with security definer
CREATE OR REPLACE FUNCTION get_user_active_tasks(p_username TEXT)
RETURNS TABLE (
  id UUID,
  task_text TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.task_text, t.created_at
  FROM tasks t
  WHERE t.username = LOWER(TRIM(p_username))
    AND t.completed = FALSE
  ORDER BY t.created_at ASC;
END;
$$;

-- Optimize get_user_task_count
CREATE OR REPLACE FUNCTION get_user_task_count(p_username TEXT)
RETURNS TABLE (
  pending_count BIGINT,
  completed_count BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE completed = FALSE) as pending_count,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed_count,
    COUNT(*) as total_count
  FROM tasks
  WHERE username = LOWER(TRIM(p_username));
END;
$$;

-- Optimize clear_completed_tasks
CREATE OR REPLACE FUNCTION clear_completed_tasks(p_username TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tasks
  WHERE username = LOWER(TRIM(p_username))
    AND completed = TRUE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =============================================
-- 6. ADD MATERIALIZED VIEW FOR ANALYTICS
-- =============================================

-- Materialized view for user statistics (can be refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_task_statistics AS
SELECT
  username,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
  COUNT(*) FILTER (WHERE completed = FALSE) as pending_tasks,
  MAX(created_at) as last_task_date,
  MIN(created_at) as first_task_date
FROM tasks
GROUP BY username;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_username
ON user_task_statistics(username);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_task_statistics;
END;
$$;

-- =============================================
-- 7. ADD LOGGING TABLE FOR AUDIT
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
ON audit_logs(table_name, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id
ON audit_logs(record_id);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, operation, record_id, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, operation, record_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, operation, record_id, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers (optional - uncomment if needed)
-- CREATE TRIGGER tasks_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON tasks
--     FOR EACH ROW
--     EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- 8. RLS FOR AUDIT LOGS
-- =============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_authenticated" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- =============================================
-- 9. ADD HEALTH CHECK FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS index_size
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;

-- =============================================
-- 10. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON INDEX idx_pomodoro_stats_sessions_gin IS 'GIN index for fast JSONB queries on sessions array';
COMMENT ON INDEX idx_tasks_username_created IS 'Composite index for filtering active tasks by username';
COMMENT ON MATERIALIZED VIEW user_task_statistics IS 'Aggregated user statistics - refresh periodically';
COMMENT ON TABLE audit_logs IS 'Audit trail for data changes - optional for compliance';
COMMENT ON FUNCTION refresh_user_statistics() IS 'Call this function to refresh user statistics materialized view';
COMMENT ON FUNCTION database_health_check() IS 'Returns table sizes and row counts for monitoring';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
