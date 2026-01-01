/**
 * Users Table Auto-Sync Trigger
 * Created: Session 80
 *
 * Automatically synchronizes auth.users to public.users table
 * when users are created or updated in Supabase Auth.
 *
 * Benefits:
 * - Automatic user record creation in public.users
 * - Email cached for fast lookups (no cross-schema JOINs)
 * - Maintains referential integrity with organization_members
 *
 * Security:
 * - SECURITY DEFINER allows public schema function to access auth schema
 * - Only Supabase Auth can trigger this function (via auth.users changes)
 */

-- =====================================================
-- Step 1: Create trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_auth_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Required to access auth schema from public schema
SET search_path = public  -- Explicitly set search path for security
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update user in public.users table
  INSERT INTO public.users (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    -- Note: created_at is immutable, don't update
    updated_at = NOW();  -- If you have an updated_at column

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_auth_user() IS
  'Automatically syncs auth.users to public.users table on INSERT/UPDATE';

-- =====================================================
-- Step 2: Create trigger on auth.users
-- =====================================================

-- Note: This requires superuser privileges or supabase_admin role
-- Run this in Supabase SQL Editor (which runs as postgres user)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Automatically syncs new/updated auth users to public.users table';

-- =====================================================
-- Step 3: Backfill existing auth.users
-- =====================================================

-- Sync all existing auth.users to public.users
-- This ensures users created before the trigger was added are also synced

INSERT INTO public.users (id, email, created_at)
SELECT
  id,
  email,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email;

-- =====================================================
-- Step 4: Verify synchronization
-- =====================================================

-- Check that all auth.users have corresponding public.users records
SELECT
  COUNT(*) AS auth_users_count,
  (SELECT COUNT(*) FROM public.users) AS public_users_count,
  COUNT(*) - (SELECT COUNT(*) FROM public.users) AS missing_users
FROM auth.users;

-- Expected result: missing_users = 0

-- =====================================================
-- Step 5: Test the trigger
-- =====================================================

-- Test by creating a new user (run in Supabase Auth API or SQL Editor)
-- This is for manual testing only - don't run in production

/*
-- Create test user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'trigger-test@example.com',
  crypt('test-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Verify user was auto-created in public.users
SELECT * FROM public.users
WHERE email = 'trigger-test@example.com';

-- Cleanup test user
DELETE FROM auth.users WHERE email = 'trigger-test@example.com';
DELETE FROM public.users WHERE email = 'trigger-test@example.com';
*/

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

/*
-- To remove the trigger and function:

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.sync_auth_user();

-- Note: This does NOT delete records from public.users
-- Manual cleanup required if you want to remove synced users
*/

-- =====================================================
-- Notes and Caveats
-- =====================================================

/**
 * SECURITY CONSIDERATIONS:
 *
 * 1. SECURITY DEFINER: This function runs with the privileges of the user
 *    who created it (usually postgres/supabase_admin). This is necessary
 *    to allow a trigger on auth.users (auth schema) to insert into
 *    public.users (public schema).
 *
 * 2. SET search_path: Explicitly sets search path to prevent malicious
 *    functions from being injected by users creating tables/functions
 *    with conflicting names.
 *
 * 3. Trigger is AFTER INSERT/UPDATE: Ensures auth.users record is committed
 *    before syncing to public.users, maintaining consistency.
 *
 * LIMITATIONS:
 *
 * 1. DELETE not synced: This trigger does not handle user deletion.
 *    If you want to sync deletions, add ON DELETE CASCADE to the
 *    organization_members foreign key instead.
 *
 * 2. Schema changes: If auth.users schema changes (Supabase update),
 *    this trigger may need updates to match new columns.
 *
 * 3. Superuser required: Creating triggers on auth.users requires
 *    elevated privileges. Run this script in Supabase SQL Editor.
 *
 * MAINTENANCE:
 *
 * - Review this trigger after Supabase Auth updates
 * - Monitor sync performance if auth.users table grows very large
 * - Consider adding error logging to catch sync failures
 */
