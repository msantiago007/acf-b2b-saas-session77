# Test SQL Verification Queries

**Purpose:** SQL queries to verify test results in the Supabase database
**Usage:** Run these in Supabase Dashboard → SQL Editor
**Session:** 83

---

## Quick Reference - Test Organization

**Test Organization ID:** `00000000-0000-0000-0000-000000000001`
**Organization Name:** Acme Test Corp (or similar)

---

## 1. Member Role Form Tests (TC1.x)

### TC1.1 - Verify Members List Loaded

```sql
-- Check all members in test organization
SELECT
  u.id,
  u.email,
  om.role,
  om.created_at
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY om.role;
```

**Expected Output:**
- Should see owner@acme-test.com (role: owner)
- Should see admin@acme-test.com (role: admin)
- Should see member@acme-test.com (role: member)

---

### TC1.2/TC1.3 - Verify Role Update

```sql
-- Check specific member's current role
SELECT
  u.email,
  om.role,
  om.updated_at
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001'
  AND u.email = 'member@acme-test.com'; -- Change email as needed
```

**Usage:**
1. Run BEFORE updating role (note current role)
2. Update role through UI
3. Run AFTER updating role (verify role changed)
4. Check `updated_at` timestamp changed

**Example:**
```
Before: { email: 'member@acme-test.com', role: 'member', updated_at: '2025-12-13 10:00:00' }
After:  { email: 'member@acme-test.com', role: 'viewer', updated_at: '2025-12-13 10:05:00' }
```

---

## 2. Member Invite Form Tests (TC2.x)

### TC2.1 - Verify New User Invitation

```sql
-- Check if invited user exists in both tables
SELECT
  'auth.users' AS source,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'newinvite@example.com' -- Replace with actual test email

UNION ALL

SELECT
  'public.users' AS source,
  id,
  email,
  created_at
FROM users
WHERE email = 'newinvite@example.com'

UNION ALL

SELECT
  'organization_members' AS source,
  om.user_id AS id,
  u.email,
  om.created_at
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE u.email = 'newinvite@example.com'
  AND om.organization_id = '00000000-0000-0000-0000-000000000001';
```

**Expected Output:**
- 3 rows (one from each table)
- All should have same email
- All IDs should match

---

### TC2.4 - Check for Duplicate Email

```sql
-- Verify user already exists before testing duplicate
SELECT
  u.email,
  om.role,
  om.organization_id
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE u.email = 'owner@acme-test.com'; -- Use existing member email
```

**Expected:** Should return 1 row (user exists)
**Test:** Try to invite this email again
**Expected Result:** Should get 409 Conflict or 400 Bad Request

---

### TC2.5 - Verify New User Creation

```sql
-- Comprehensive check for brand new user
WITH new_user AS (
  SELECT id, email FROM users WHERE email = 'brandnew@example.com'
)
SELECT
  'User exists in public.users' AS check_name,
  CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status,
  COUNT(*) AS count
FROM new_user

UNION ALL

SELECT
  'User is org member' AS check_name,
  CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status,
  COUNT(*) AS count
FROM organization_members om
WHERE om.user_id IN (SELECT id FROM new_user)
  AND om.organization_id = '00000000-0000-0000-0000-000000000001'

UNION ALL

SELECT
  'User in auth.users' AS check_name,
  CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status,
  COUNT(*) AS count
FROM auth.users au
WHERE au.email = 'brandnew@example.com';
```

**Expected Output:** All checks should show ✅ PASS

---

## 3. Organization Settings Form Tests (TC3.x)

### TC3.1 - Verify Organization Data Loaded

```sql
-- Get current organization settings
SELECT
  id,
  name,
  plan,
  settings,
  created_at,
  updated_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected:** Should return organization with name, plan, and settings JSON

---

### TC3.2 - Verify Organization Name Update

```sql
-- Check organization name before/after
SELECT
  name,
  updated_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Usage:**
1. Run BEFORE update (note current name)
2. Update name through UI
3. Run AFTER update (verify name changed)
4. Verify `updated_at` timestamp changed

---

### TC3.3/TC3.4 - Verify Plan Update

```sql
-- Check current plan
SELECT
  plan,
  updated_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Valid Plans:** free, pro, enterprise

**Usage:**
1. Note current plan
2. Update plan through UI
3. Verify plan changed

---

### TC3.5 - Verify Settings JSON Update

```sql
-- View settings JSON with formatting
SELECT
  id,
  name,
  settings,
  jsonb_pretty(settings) AS formatted_settings,
  updated_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Test Example:**
- Add: `{"feature_flags": {"dark_mode": true}}`
- Verify JSON stored correctly
- Check formatting is valid

---

## 4. Team Creation Form Tests (TC4.x)

### TC4.1 - Verify Teams List

```sql
-- List all teams for test organization
SELECT
  id,
  organization_id,
  name,
  created_at,
  updated_at
FROM teams
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;
```

---

### TC4.2/TC4.3 - Verify New Team Created

```sql
-- Check if specific team exists
SELECT
  id,
  name,
  organization_id,
  created_at
FROM teams
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND name = 'Marketing'; -- Replace with test team name
```

**Expected:** Should return 1 row with team details

---

## 5. Permission Matrix Verification

### Verify Test User Roles

```sql
-- Comprehensive user role check
SELECT
  u.email,
  om.role,
  om.organization_id,
  CASE om.role
    WHEN 'owner' THEN '✅ Highest privileges (manage_org)'
    WHEN 'admin' THEN '✅ Can manage members (manage_members)'
    WHEN 'member' THEN '⚠️ Basic access only'
    WHEN 'viewer' THEN '⚠️ Read-only access'
  END AS permissions_summary
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY
  CASE om.role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'member' THEN 3
    WHEN 'viewer' THEN 4
  END;
```

**Expected Users:**
- owner@acme-test.com (role: owner)
- admin@acme-test.com (role: admin)
- member@acme-test.com (role: member)
- viewer@acme-test.com (role: viewer)

**If viewer missing, create with:**
```sql
-- ONLY RUN IF viewer user doesn't exist
-- First create user in auth/users, then run member invite form
```

---

## 6. Data Integrity Checks

### Check All Foreign Key Constraints

```sql
-- Verify all foreign keys exist and are configured correctly
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Expected Output:**
- organization_members → organizations (CASCADE)
- organization_members → users (CASCADE)
- teams → organizations (CASCADE)

---

### Check for Orphaned Records

```sql
-- Find organization_members without valid users
SELECT
  om.id AS member_id,
  om.user_id,
  'ORPHANED - No user record' AS issue
FROM organization_members om
LEFT JOIN users u ON u.id = om.user_id
WHERE u.id IS NULL;
```

**Expected:** 0 rows (no orphaned records)

```sql
-- Find organization_members without valid organizations
SELECT
  om.id AS member_id,
  om.organization_id,
  'ORPHANED - No organization record' AS issue
FROM organization_members om
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE o.id IS NULL;
```

**Expected:** 0 rows (no orphaned records)

---

## 7. Audit Trail Queries

### View Recent Database Changes

```sql
-- Recent organization updates
SELECT
  id,
  name,
  plan,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) AS seconds_ago
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001'
ORDER BY updated_at DESC;
```

---

### Recent Member Changes

```sql
-- Recent member role changes
SELECT
  u.email,
  om.role,
  om.updated_at,
  EXTRACT(EPOCH FROM (NOW() - om.updated_at)) AS seconds_ago
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY om.updated_at DESC;
```

---

## 8. Performance Monitoring

### Count Active Sessions

```sql
-- View current database sessions
SELECT
  datname,
  usename,
  application_name,
  state,
  query_start,
  NOW() - query_start AS query_duration
FROM pg_stat_activity
WHERE datname = current_database()
  AND state = 'active'
ORDER BY query_start;
```

---

### Check Table Sizes

```sql
-- View table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 9. Quick Cleanup (Use with Caution)

### Delete Test Invitations

```sql
-- CAUTION: Only use to clean up test data
-- Delete a specific test invitation
DELETE FROM organization_members
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'newinvite@example.com'
)
AND organization_id = '00000000-0000-0000-0000-000000000001';

-- Then delete the user
DELETE FROM users WHERE email = 'newinvite@example.com';

-- If needed, delete from auth.users (requires special permissions)
-- DELETE FROM auth.users WHERE email = 'newinvite@example.com';
```

**WARNING:** Only use this to clean up test data between test runs.

---

### Reset Member Role

```sql
-- Reset a member's role back to original
UPDATE organization_members
SET role = 'member', -- Change to desired role
    updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'member@acme-test.com'
)
AND organization_id = '00000000-0000-0000-0000-000000000001';
```

---

## 10. Troubleshooting Queries

### Find User by Email

```sql
-- Find user across all tables
SELECT 'auth.users' AS source, id, email
FROM auth.users
WHERE email ILIKE '%acme-test%'

UNION ALL

SELECT 'public.users' AS source, id, email
FROM users
WHERE email ILIKE '%acme-test%';
```

---

### Check User's Organizations

```sql
-- See which organizations a user belongs to
SELECT
  o.id AS org_id,
  o.name AS org_name,
  om.role,
  u.email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN users u ON u.id = om.user_id
WHERE u.email = 'owner@acme-test.com' -- Replace with user email
ORDER BY o.name;
```

---

## Usage Tips

1. **Copy-paste queries into Supabase SQL Editor**
2. **Replace placeholder values:**
   - `00000000-0000-0000-0000-000000000001` → Your test org ID
   - `newinvite@example.com` → Your test email
   - `Marketing` → Your test team name

3. **Run queries before AND after each test** to verify changes

4. **Save results** - Copy query output to paste into TEST_RESULTS_SESSION81.md

5. **Use Table Editor** as visual verification alongside SQL queries

6. **Check timestamps** - `updated_at` should change when records update

---

**Created:** Session 83
**Last Updated:** 2025-12-13
