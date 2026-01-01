/**
 * Restore Foreign Key Constraints
 * Created: Session 80
 *
 * Restores the organization_members → users foreign key constraint
 * that was temporarily dropped during Session 79 testing.
 *
 * Context:
 * - Session 79 discovered that organization_members had FK to users table
 * - users table didn't exist initially
 * - Created users table and populated it with auth users
 * - Now restoring FK to maintain referential integrity
 *
 * Run this AFTER creating and populating users table.
 */

-- =====================================================
-- Step 1: Verify users table exists and is populated
-- =====================================================

-- Check users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'users table does not exist. Create it first using sql/01_users.sql';
  END IF;
END $$;

-- Verify users table has data
SELECT
  COUNT(*) AS user_count,
  CASE
    WHEN COUNT(*) = 0 THEN '⚠️  WARNING: users table is empty'
    ELSE '✅ users table populated'
  END AS status
FROM users;

-- =====================================================
-- Step 2: Check for orphaned organization_members
-- =====================================================

-- Find organization_members referencing non-existent users
SELECT
  om.id AS member_id,
  om.user_id,
  om.organization_id,
  om.role,
  '❌ ORPHANED - User does not exist in users table' AS status
FROM organization_members om
LEFT JOIN users u ON u.id = om.user_id
WHERE u.id IS NULL;

-- If any orphaned members found, you must either:
-- 1. Insert missing users into users table, OR
-- 2. Delete orphaned organization_members

-- =====================================================
-- Step 3: Drop existing foreign key (if exists)
-- =====================================================

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

-- =====================================================
-- Step 4: Add foreign key constraint
-- =====================================================

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;  -- Deleting user removes all their org memberships

COMMENT ON CONSTRAINT organization_members_user_id_fkey ON organization_members IS
  'Ensures all organization members reference valid users. Cascade deletes when user is deleted.';

-- =====================================================
-- Step 5: Verify foreign key constraint
-- =====================================================

-- Check constraint exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'organization_members'
  AND tc.constraint_name = 'organization_members_user_id_fkey';

-- Expected result:
-- constraint_name: organization_members_user_id_fkey
-- table_name: organization_members
-- column_name: user_id
-- foreign_table_name: users
-- foreign_column_name: id
-- delete_rule: CASCADE

-- =====================================================
-- Step 6: Test foreign key constraint
-- =====================================================

-- Test 1: Try to insert organization_member with non-existent user
-- This should FAIL with foreign key violation

/*
INSERT INTO organization_members (
  organization_id,
  user_id,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),  -- Non-existent user
  'member'
);
-- Expected error: ERROR:  insert or update on table "organization_members" violates foreign key constraint "organization_members_user_id_fkey"
*/

-- Test 2: Verify CASCADE DELETE works
-- Create test user, add to org, delete user, verify membership deleted

/*
-- Create test user
INSERT INTO users (id, email)
VALUES (gen_random_uuid(), 'fk-test@example.com')
RETURNING id;

-- Add to organization (use returned ID from above)
INSERT INTO organization_members (
  organization_id,
  user_id,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM users WHERE email = 'fk-test@example.com'),
  'member'
);

-- Verify membership exists
SELECT * FROM organization_members
WHERE user_id = (SELECT id FROM users WHERE email = 'fk-test@example.com');

-- Delete user
DELETE FROM users WHERE email = 'fk-test@example.com';

-- Verify membership was CASCADE deleted
SELECT COUNT(*) AS should_be_zero
FROM organization_members
WHERE user_id = (SELECT id FROM users WHERE email = 'fk-test@example.com');
-- Expected result: 0 (membership auto-deleted)
*/

-- =====================================================
-- Step 7: Summary of all foreign keys
-- =====================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  CASE
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ Safe (CASCADE)'
    WHEN rc.delete_rule = 'SET NULL' THEN '⚠️  Review (SET NULL)'
    WHEN rc.delete_rule = 'RESTRICT' THEN '⚠️  Review (RESTRICT)'
    ELSE '❌ Unknown delete rule'
  END AS delete_rule_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('organization_members', 'teams')
ORDER BY tc.table_name, tc.constraint_name;

-- Expected foreign keys:
-- ✅ organization_members.organization_id → organizations.id (CASCADE)
-- ✅ organization_members.user_id → users.id (CASCADE)
-- ✅ teams.organization_id → organizations.id (CASCADE)

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

/*
-- To remove the foreign key constraint:

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

-- Note: This allows orphaned organization_members (members without users)
-- Only use if you're restructuring the schema
*/

-- =====================================================
-- Notes and Best Practices
-- =====================================================

/**
 * CASCADE DELETE BEHAVIOR:
 *
 * When a user is deleted from users table:
 * 1. All their organization_members records are automatically deleted
 * 2. They are removed from all organizations they belonged to
 * 3. No orphaned membership records remain
 *
 * MIGRATION CONSIDERATIONS:
 *
 * If migrating from Supabase Auth to another system:
 * 1. Create new users in users table (don't rely on auth.users)
 * 2. Update user_id references in organization_members
 * 3. Foreign key ensures data integrity during migration
 *
 * PERFORMANCE:
 *
 * - Foreign key checks add minimal overhead (<1ms per operation)
 * - Prevents data corruption worth the small performance cost
 * - Indexed foreign keys (user_id) ensure fast lookups
 *
 * MAINTENANCE:
 *
 * - Monitor for orphaned records during development
 * - Run verification query periodically in production
 * - Update this script if schema changes in future sessions
 */
