-- ============================================================
-- RLS Policy Testing Script (CORRECTED)
-- ============================================================
-- Purpose: Validate Row Level Security policies and tenant isolation
-- Run in: Supabase SQL Editor
-- Date: 2025-12-13
-- ============================================================

-- ============================================================
-- SETUP: Create second organization for isolation testing
-- ============================================================

-- Create Org 2 (Beta Industries)
INSERT INTO organizations (id, name, slug, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Beta Industries',
  'beta-industries',
  'free',
  '{"features": {"analytics": false}}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create teams for Org 2 (CORRECTED - no description column)
INSERT INTO teams (organization_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Beta Team 1'),
  ('00000000-0000-0000-0000-000000000002', 'Beta Team 2')
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Setup complete - 2 organizations created' AS status;

-- ============================================================
-- TEST 1: Verify RLS is enabled
-- ============================================================

SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members')
ORDER BY tablename;

-- Expected:
-- organizations: TRUE (RLS enabled)
-- organization_members: TRUE (RLS enabled)
-- teams: FALSE (no RLS by design)

-- ============================================================
-- TEST 2: List all RLS policies
-- ============================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members')
ORDER BY tablename, policyname;

-- Expected: Multiple policies for organizations and organization_members

-- ============================================================
-- TEST 3: Tenant isolation (SET app.current_organization_id)
-- ============================================================

-- Set to Org 1 (Acme Corporation)
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

-- Query organizations (should only see Org 1)
SELECT id, name, slug, plan
FROM organizations;
-- Expected: Only "Acme Corporation"

-- Explicitly try to access Org 2 (should be blocked by RLS)
SELECT id, name, slug, plan
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000002';
-- Expected: Empty result (RLS policy blocks)

-- ============================================================
-- TEST 4: Switch to Org 2
-- ============================================================

-- Set to Org 2 (Beta Industries)
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000002';

-- Query organizations (should only see Org 2)
SELECT id, name, slug, plan
FROM organizations;
-- Expected: Only "Beta Industries"

-- Try to access Org 1 (should be blocked)
SELECT id, name, slug, plan
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
-- Expected: Empty result (RLS policy blocks)

-- ============================================================
-- TEST 5: Teams table (no RLS - should see all)
-- ============================================================

-- Teams has no RLS, so should see ALL teams regardless of org
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

SELECT organization_id, name
FROM teams
ORDER BY organization_id, name;
-- Expected: Teams from BOTH organizations (no RLS filtering)

-- ============================================================
-- TEST 6: organization_members with RLS
-- ============================================================

-- Note: This test requires actual users to be linked to organizations
-- If no members exist, this will return empty results

-- Set to Org 1
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

SELECT organization_id, user_id, role
FROM organization_members;
-- Expected: Only members of Org 1

-- Try to query Org 2 members explicitly
SELECT organization_id, user_id, role
FROM organization_members
WHERE organization_id = '00000000-0000-0000-0000-000000000002';
-- Expected: Empty result (RLS blocks)

-- ============================================================
-- TEST 7: UPDATE with RLS
-- ============================================================

-- Set to Org 1
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

-- Try to update Org 2 (should be blocked)
UPDATE organizations
SET name = 'Hacked Name'
WHERE id = '00000000-0000-0000-0000-000000000002';
-- Expected: 0 rows updated (RLS blocks)

-- Verify Org 2 name unchanged
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000002';
SELECT name FROM organizations WHERE id = '00000000-0000-0000-0000-000000000002';
-- Expected: "Beta Industries" (unchanged)

-- ============================================================
-- TEST 8: DELETE with RLS
-- ============================================================

-- Set to Org 1
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

-- Try to delete Org 2 (should be blocked)
DELETE FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000002';
-- Expected: 0 rows deleted (RLS blocks)

-- ============================================================
-- TEST 9: Service Role Bypass
-- ============================================================

-- Note: In Supabase SQL Editor, this runs as postgres role which bypasses RLS

-- Reset organization filter
RESET app.current_organization_id;

-- Query all organizations (service role sees all)
SELECT id, name, slug
FROM organizations
ORDER BY name;
-- Expected: Both Acme Corporation AND Beta Industries

-- Query all teams
SELECT organization_id, name
FROM teams
ORDER BY organization_id, name;
-- Expected: All teams from all organizations

-- Query all members
SELECT organization_id, user_id, role
FROM organization_members
ORDER BY organization_id;
-- Expected: All members from all organizations

-- ============================================================
-- TEST SUMMARY
-- ============================================================

SELECT
  'RLS Testing Complete' AS status,
  'Review results above to verify:' AS instructions;

SELECT
  '✓ RLS enabled on organizations table' AS check_1,
  '✓ RLS enabled on organization_members table' AS check_2,
  '✓ Tenant isolation working (cannot see other orgs)' AS check_3,
  '✓ Service role bypasses RLS' AS check_4,
  '✓ UPDATE/DELETE blocked across tenants' AS check_5;

-- ============================================================
-- CLEANUP (Optional)
-- ============================================================

-- Uncomment to remove test data

-- DELETE FROM teams WHERE organization_id = '00000000-0000-0000-0000-000000000002';
-- DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000002';

-- SELECT 'Cleanup complete' AS status;
