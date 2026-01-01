-- =====================================================
-- Manual Users Backfill (No Trigger Required)
-- =====================================================
-- This script syncs existing auth.users to public.users
-- Run this periodically or after creating new users manually

-- Step 1: Backfill existing auth.users to public.users
INSERT INTO public.users (id, email, created_at)
SELECT
  id,
  email,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email;

-- Step 2: Verify synchronization
SELECT
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.users) AS public_users_count,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) AS missing_users;

-- Expected: missing_users should be 0

-- Step 3: Check for any orphaned organization_members
SELECT
  om.id AS member_id,
  om.user_id,
  u.email AS user_email,
  CASE
    WHEN u.id IS NULL THEN '❌ ORPHANED'
    ELSE '✅ OK'
  END AS status
FROM organization_members om
LEFT JOIN users u ON u.id = om.user_id
ORDER BY status DESC;

-- All records should show ✅ OK
