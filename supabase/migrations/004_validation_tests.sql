-- =============================================
-- Bot Twitch - Validation Tests
-- Migration 004: Verify Security & Performance
-- =============================================

-- =============================================
-- 1. VALIDATION HELPER FUNCTIONS
-- =============================================

-- Function to run all validation tests
CREATE OR REPLACE FUNCTION run_validation_tests()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test 1: Check RLS is enabled on all tables
  RETURN QUERY
  SELECT
    'RLS_Enabled_Check'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'PASS'
      ELSE 'FAIL'
    END,
    COALESCE(
      'Tables without RLS: ' || string_agg(tablename, ', '),
      'All tables have RLS enabled'
    )
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('tasks', 'pomodoro_stats', 'pomodoro_config', 'audit_logs', 'rate_limit_tracking')
    AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = pg_tables.tablename
        AND c.relrowsecurity = true
    );

  -- Test 2: Check required indexes exist
  RETURN QUERY
  SELECT
    'Required_Indexes_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 8 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' required indexes (expected: 8+)'
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_tasks_username',
      'idx_tasks_completed',
      'idx_tasks_username_completed',
      'idx_tasks_created_at',
      'idx_pomodoro_stats_date',
      'idx_pomodoro_stats_sessions_gin',
      'idx_tasks_username_created',
      'idx_rate_limit_identifier_endpoint'
    );

  -- Test 3: Check secure functions exist
  RETURN QUERY
  SELECT
    'Secure_Functions_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 5 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' secure functions (expected: 5+)'
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'secure_add_task',
      'secure_update_task_status',
      'secure_delete_task',
      'secure_update_pomodoro_stats',
      'secure_update_pomodoro_config'
    );

  -- Test 4: Check validation functions exist
  RETURN QUERY
  SELECT
    'Validation_Functions_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' validation functions (expected: 3+)'
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'validate_username',
      'sanitize_task_text',
      'check_rate_limit'
    );

  -- Test 5: Check RLS policies exist
  RETURN QUERY
  SELECT
    'RLS_Policies_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 10 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' RLS policies (expected: 10+)'
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Test 6: Check triggers exist
  RETURN QUERY
  SELECT
    'Triggers_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 4 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' triggers (expected: 4+)'
  FROM pg_trigger
  WHERE NOT tgisinternal
    AND tgname IN (
      'tasks_updated_at',
      'pomodoro_stats_updated_at',
      'pomodoro_config_updated_at',
      'tasks_normalize_username'
    );

  -- Test 7: Check materialized view exists
  RETURN QUERY
  SELECT
    'Materialized_View_Check'::TEXT,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_matviews
        WHERE schemaname = 'public'
          AND matviewname = 'user_task_statistics'
      ) THEN 'PASS'
      ELSE 'FAIL'
    END,
    'User statistics materialized view';

  -- Test 8: Check public views exist
  RETURN QUERY
  SELECT
    'Public_Views_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 2 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' public views (expected: 2+)'
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('tasks_public', 'pomodoro_stats_public');

  -- Test 9: Check autovacuum settings
  RETURN QUERY
  SELECT
    'Autovacuum_Config_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 1 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Tables with custom autovacuum settings: ' || COUNT(*)::TEXT
  FROM pg_class c
  WHERE c.relname IN ('tasks', 'pomodoro_stats')
    AND c.reloptions IS NOT NULL;

  -- Test 10: Check constraints
  RETURN QUERY
  SELECT
    'Constraints_Check'::TEXT,
    CASE
      WHEN COUNT(*) >= 8 THEN 'PASS'
      ELSE 'FAIL'
    END,
    'Found ' || COUNT(*)::TEXT || ' constraints (expected: 8+)'
  FROM pg_constraint
  WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND conname LIKE '%_check';

END;
$$;

-- =============================================
-- 2. FUNCTIONAL TESTS
-- =============================================

-- Test username validation
CREATE OR REPLACE FUNCTION test_username_validation()
RETURNS TABLE (
  test_case TEXT,
  expected BOOLEAN,
  actual BOOLEAN,
  result TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Valid username
  RETURN QUERY
  SELECT
    'Valid username (testuser123)'::TEXT,
    true,
    validate_username('testuser123'),
    CASE WHEN validate_username('testuser123') = true THEN 'PASS' ELSE 'FAIL' END;

  -- Too short
  RETURN QUERY
  SELECT
    'Too short (ab)'::TEXT,
    false,
    validate_username('ab'),
    CASE WHEN validate_username('ab') = false THEN 'PASS' ELSE 'FAIL' END;

  -- Too long
  RETURN QUERY
  SELECT
    'Too long (abcdefghijklmnopqrstuvwxyz)'::TEXT,
    false,
    validate_username('abcdefghijklmnopqrstuvwxyz'),
    CASE WHEN validate_username('abcdefghijklmnopqrstuvwxyz') = false THEN 'PASS' ELSE 'FAIL' END;

  -- Invalid characters
  RETURN QUERY
  SELECT
    'Invalid chars (test@user)'::TEXT,
    false,
    validate_username('test@user'),
    CASE WHEN validate_username('test@user') = false THEN 'PASS' ELSE 'FAIL' END;

  -- With underscore (valid)
  RETURN QUERY
  SELECT
    'With underscore (test_user)'::TEXT,
    true,
    validate_username('test_user'),
    CASE WHEN validate_username('test_user') = true THEN 'PASS' ELSE 'FAIL' END;
END;
$$;

-- Test text sanitization
CREATE OR REPLACE FUNCTION test_text_sanitization()
RETURNS TABLE (
  test_case TEXT,
  input TEXT,
  output TEXT,
  result TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_output TEXT;
BEGIN
  -- XSS attempt
  v_output := sanitize_task_text('<script>alert("xss")</script>');
  RETURN QUERY
  SELECT
    'XSS attempt'::TEXT,
    '<script>alert("xss")</script>'::TEXT,
    v_output,
    CASE WHEN v_output NOT LIKE '%<%' AND v_output NOT LIKE '%>%' THEN 'PASS' ELSE 'FAIL' END;

  -- SQL injection attempt
  v_output := sanitize_task_text('Test; DROP TABLE tasks;');
  RETURN QUERY
  SELECT
    'SQL injection attempt'::TEXT,
    'Test; DROP TABLE tasks;'::TEXT,
    v_output,
    CASE WHEN v_output NOT LIKE '%;%' THEN 'PASS' ELSE 'FAIL' END;

  -- Normal text
  v_output := sanitize_task_text('This is a normal task');
  RETURN QUERY
  SELECT
    'Normal text'::TEXT,
    'This is a normal task'::TEXT,
    v_output,
    CASE WHEN v_output = 'This is a normal task' THEN 'PASS' ELSE 'FAIL' END;

  -- Text with spaces (should trim)
  v_output := sanitize_task_text('  Spaced text  ');
  RETURN QUERY
  SELECT
    'Text with spaces'::TEXT,
    '  Spaced text  '::TEXT,
    v_output,
    CASE WHEN v_output = 'Spaced text' THEN 'PASS' ELSE 'FAIL' END;
END;
$$;

-- =============================================
-- 3. PERFORMANCE TESTS
-- =============================================

-- Test index usage
CREATE OR REPLACE FUNCTION test_index_usage()
RETURNS TABLE (
  query_type TEXT,
  uses_index BOOLEAN,
  index_name TEXT,
  result TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test 1: Username lookup should use index
  RETURN QUERY
  SELECT
    'Username lookup'::TEXT,
    EXISTS (
      SELECT 1 FROM pg_stat_statements
      WHERE query LIKE '%idx_tasks_username%'
    ),
    'idx_tasks_username'::TEXT,
    'Check query plan manually'::TEXT;

  -- Note: Actual index usage needs to be checked via EXPLAIN
  -- This is a placeholder for manual verification
  RETURN QUERY
  SELECT
    'Manual verification required'::TEXT,
    true,
    'Run EXPLAIN ANALYZE on queries'::TEXT,
    'INFO'::TEXT;
END;
$$;

-- =============================================
-- 4. SECURITY TESTS
-- =============================================

-- Test RLS policies (must be run as different roles)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  test_name TEXT,
  details TEXT,
  result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check that anon can read
  RETURN QUERY
  SELECT
    'Anon can read tasks'::TEXT,
    'Policy: Allow public read access'::TEXT,
    'Run as anon role to verify'::TEXT;

  -- Check that anon cannot directly insert (after phase 3)
  RETURN QUERY
  SELECT
    'Anon cannot directly insert'::TEXT,
    'Should use secure_add_task function'::TEXT,
    'Run as anon role to verify'::TEXT;

  -- Check that authenticated can use secure functions
  RETURN QUERY
  SELECT
    'Authenticated can use secure functions'::TEXT,
    'All secure_* functions should be accessible'::TEXT,
    'Run as authenticated role to verify'::TEXT;
END;
$$;

-- =============================================
-- 5. DATA INTEGRITY TESTS
-- =============================================

-- Test constraints are enforced
CREATE OR REPLACE FUNCTION test_constraints()
RETURNS TABLE (
  test_name TEXT,
  should_fail BOOLEAN,
  result TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_error TEXT;
BEGIN
  -- Test 1: Empty username should fail
  BEGIN
    INSERT INTO tasks (username, task_text) VALUES ('', 'Test task');
    RETURN QUERY SELECT 'Empty username'::TEXT, true, 'FAIL - Should have been rejected'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Empty username'::TEXT, true, 'PASS - Correctly rejected'::TEXT;
  END;

  -- Test 2: Empty task text should fail
  BEGIN
    INSERT INTO tasks (username, task_text) VALUES ('testuser', '');
    RETURN QUERY SELECT 'Empty task text'::TEXT, true, 'FAIL - Should have been rejected'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Empty task text'::TEXT, true, 'PASS - Correctly rejected'::TEXT;
  END;

  -- Test 3: Negative stats should fail
  BEGIN
    INSERT INTO pomodoro_stats (date, sessions_completed) VALUES (CURRENT_DATE, -1);
    RETURN QUERY SELECT 'Negative sessions'::TEXT, true, 'FAIL - Should have been rejected'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Negative sessions'::TEXT, true, 'PASS - Correctly rejected'::TEXT;
  END;

  -- Test 4: Singleton config constraint
  BEGIN
    INSERT INTO pomodoro_config (id, work_duration) VALUES (2, 80);
    RETURN QUERY SELECT 'Config singleton'::TEXT, true, 'FAIL - Should have been rejected'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'Config singleton'::TEXT, true, 'PASS - Correctly rejected'::TEXT;
  END;
END;
$$;

-- =============================================
-- 6. RATE LIMITING TESTS
-- =============================================

-- Test rate limiting functionality
CREATE OR REPLACE FUNCTION test_rate_limiting()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_allowed BOOLEAN;
  v_count INTEGER := 0;
BEGIN
  -- Clean up test data
  DELETE FROM rate_limit_tracking WHERE identifier = 'test_user_rate_limit';

  -- Test 1: First call should succeed
  v_allowed := check_rate_limit('test_user_rate_limit', 'test_endpoint', 5, 1);
  RETURN QUERY
  SELECT
    'First call allowed'::TEXT,
    CASE WHEN v_allowed THEN 'PASS' ELSE 'FAIL' END,
    'Expected: true, Got: ' || v_allowed::TEXT;

  -- Test 2: Calls within limit should succeed
  FOR v_count IN 2..5 LOOP
    v_allowed := check_rate_limit('test_user_rate_limit', 'test_endpoint', 5, 1);
    EXIT WHEN NOT v_allowed;
  END LOOP;

  RETURN QUERY
  SELECT
    'Calls within limit'::TEXT,
    CASE WHEN v_allowed THEN 'PASS' ELSE 'FAIL' END,
    'Allowed ' || v_count::TEXT || ' calls';

  -- Test 3: Call exceeding limit should fail
  v_allowed := check_rate_limit('test_user_rate_limit', 'test_endpoint', 5, 1);
  RETURN QUERY
  SELECT
    'Call exceeding limit rejected'::TEXT,
    CASE WHEN NOT v_allowed THEN 'PASS' ELSE 'FAIL' END,
    'Expected: false, Got: ' || v_allowed::TEXT;

  -- Clean up
  DELETE FROM rate_limit_tracking WHERE identifier = 'test_user_rate_limit';
END;
$$;

-- =============================================
-- 7. MASTER TEST RUNNER
-- =============================================

-- Run all tests and provide summary
CREATE OR REPLACE FUNCTION run_all_tests()
RETURNS TABLE (
  category TEXT,
  test_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validation tests
  RETURN QUERY
  SELECT 'VALIDATION'::TEXT, t.test_name, t.status, t.details
  FROM run_validation_tests() t;

  -- Username validation tests
  RETURN QUERY
  SELECT 'USERNAME_VALIDATION'::TEXT, t.test_case,
         CASE WHEN t.result = 'PASS' THEN 'PASS' ELSE 'FAIL' END,
         'Expected: ' || t.expected::TEXT || ', Got: ' || t.actual::TEXT
  FROM test_username_validation() t;

  -- Text sanitization tests
  RETURN QUERY
  SELECT 'TEXT_SANITIZATION'::TEXT, t.test_case,
         CASE WHEN t.result = 'PASS' THEN 'PASS' ELSE 'FAIL' END,
         'Output: ' || t.output
  FROM test_text_sanitization() t;

  -- Constraint tests
  RETURN QUERY
  SELECT 'CONSTRAINTS'::TEXT, t.test_name,
         CASE WHEN t.result LIKE 'PASS%' THEN 'PASS' ELSE 'FAIL' END,
         t.result
  FROM test_constraints() t;

  -- Rate limiting tests
  RETURN QUERY
  SELECT 'RATE_LIMITING'::TEXT, t.test_name,
         CASE WHEN t.result = 'PASS' THEN 'PASS' ELSE 'FAIL' END,
         t.details
  FROM test_rate_limiting() t;

  -- Security tests (informational)
  RETURN QUERY
  SELECT 'SECURITY'::TEXT, t.test_name, 'INFO'::TEXT, t.details
  FROM test_rls_policies() t;
END;
$$;

-- =============================================
-- 8. GENERATE TEST REPORT
-- =============================================

CREATE OR REPLACE FUNCTION generate_test_report()
RETURNS TABLE (
  summary TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_passed INTEGER;
  v_failed INTEGER;
  v_info INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'PASS'),
    COUNT(*) FILTER (WHERE status = 'FAIL'),
    COUNT(*) FILTER (WHERE status = 'INFO')
  INTO v_total, v_passed, v_failed, v_info
  FROM run_all_tests();

  RETURN QUERY SELECT '============================================='::TEXT;
  RETURN QUERY SELECT '     SUPABASE VALIDATION TEST REPORT'::TEXT;
  RETURN QUERY SELECT '============================================='::TEXT;
  RETURN QUERY SELECT ''::TEXT;
  RETURN QUERY SELECT 'Total Tests:  ' || v_total::TEXT;
  RETURN QUERY SELECT 'Passed:       ' || v_passed::TEXT || ' (' || ROUND(v_passed::NUMERIC / v_total * 100, 1)::TEXT || '%)';
  RETURN QUERY SELECT 'Failed:       ' || v_failed::TEXT || ' (' || ROUND(v_failed::NUMERIC / v_total * 100, 1)::TEXT || '%)';
  RETURN QUERY SELECT 'Info:         ' || v_info::TEXT;
  RETURN QUERY SELECT ''::TEXT;
  RETURN QUERY SELECT CASE
    WHEN v_failed = 0 THEN '✓ All validation tests passed!'
    ELSE '✗ ' || v_failed::TEXT || ' test(s) failed. Review details below.'
  END;
  RETURN QUERY SELECT '============================================='::TEXT;
END;
$$;

-- =============================================
-- 9. COMMENTS
-- =============================================

COMMENT ON FUNCTION run_validation_tests() IS 'Validates database structure (indexes, functions, policies)';
COMMENT ON FUNCTION test_username_validation() IS 'Tests username validation logic';
COMMENT ON FUNCTION test_text_sanitization() IS 'Tests text sanitization against XSS/SQL injection';
COMMENT ON FUNCTION test_constraints() IS 'Tests database constraints are enforced';
COMMENT ON FUNCTION test_rate_limiting() IS 'Tests rate limiting functionality';
COMMENT ON FUNCTION run_all_tests() IS 'Runs all validation and functional tests';
COMMENT ON FUNCTION generate_test_report() IS 'Generates summary report of all tests';

-- =============================================
-- RUN TESTS ON MIGRATION
-- =============================================

-- Execute tests and display results
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '   Running Supabase Validation Tests...';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Display test results
SELECT * FROM run_all_tests();

-- Display summary
SELECT * FROM generate_test_report();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
