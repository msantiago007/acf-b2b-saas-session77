-- Validation Script: Run after all migrations to verify setup
-- Purpose: Ensure all tables, RLS policies, and triggers are correctly configured

-- ============================================================
-- PART 1: Check Tables Exist
-- ============================================================

SELECT 'Checking tables...' AS status;

SELECT
  table_name,
  CASE
    WHEN table_name IN ('organizations', 'teams', 'organization_members') THEN '✓ Found'
    ELSE '✗ Unexpected table'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'teams', 'organization_members')
ORDER BY table_name;

-- Expected: 3 rows (organizations, teams, organization_members)

-- ============================================================
-- PART 2: Check RLS Status
-- ============================================================

SELECT 'Checking RLS policies...' AS status;

SELECT
  tablename,
  rowsecurity AS rls_enabled,
  CASE
    WHEN tablename = 'organizations' AND rowsecurity = TRUE THEN '✓ RLS ON (correct)'
    WHEN tablename = 'teams' AND rowsecurity = FALSE THEN '✓ RLS OFF (correct)'
    WHEN tablename = 'organization_members' AND rowsecurity = TRUE THEN '✓ RLS ON (correct)'
    ELSE '✗ RLS misconfigured'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members')
ORDER BY tablename;

-- Expected:
-- organizations: TRUE
-- teams: FALSE
-- organization_members: TRUE

-- ============================================================
-- PART 3: Check RLS Policies Exist
-- ============================================================

SELECT 'Checking RLS policy details...' AS status;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members')
ORDER BY tablename, policyname;

-- Expected: At least 4 policies total
-- - organizations_tenant_isolation
-- - organizations_service_role
-- - organization_members_tenant_isolation
-- - organization_members_service_role

-- ============================================================
-- PART 4: Check Triggers Exist
-- ============================================================

SELECT 'Checking triggers...' AS status;

SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('organizations', 'teams', 'organization_members')
ORDER BY event_object_table, trigger_name;

-- Expected: 3 triggers (one per table)
-- - organizations_updated_at
-- - teams_updated_at
-- - organization_members_updated_at

-- ============================================================
-- PART 5: Check Indexes Exist
-- ============================================================

SELECT 'Checking indexes...' AS status;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members')
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary key indexes
ORDER BY tablename, indexname;

-- Expected: At least these indexes:
-- - idx_organizations_slug
-- - idx_teams_organization_id
-- - idx_organization_members_organization_id
-- - idx_organization_members_user_id

-- ============================================================
-- PART 6: Check Constraints
-- ============================================================

SELECT 'Checking constraints...' AS status;

SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid::regclass::text IN ('organizations', 'teams', 'organization_members')
  AND contype IN ('c', 'u', 'f')  -- CHECK, UNIQUE, FOREIGN KEY
ORDER BY table_name, constraint_type, constraint_name;

-- Expected constraints:
-- - chk_organizations_plan (CHECK for enum)
-- - teams.organization_id FOREIGN KEY
-- - organization_members.organization_id FOREIGN KEY
-- - organization_members.user_id reference

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT 'Setup validation complete!' AS status;
SELECT 'If all checks passed, your database is ready for deployment.' AS next_step;
