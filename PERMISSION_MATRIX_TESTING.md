# Permission Matrix Testing Guide

**Purpose:** Systematic RBAC (Role-Based Access Control) testing
**Session:** 83
**Status:** Ready for execution

---

## Overview

This document guides you through testing all permission combinations to verify that:
- Users with correct roles CAN perform authorized operations
- Users without correct roles CANNOT perform unauthorized operations
- Error messages are appropriate for unauthorized attempts

---

## Test Users Setup

### Verify All Test Users Exist

**Run this SQL first:**
```sql
SELECT
  u.email,
  om.role,
  CASE om.role
    WHEN 'owner' THEN '✅ manage_org + manage_members'
    WHEN 'admin' THEN '✅ manage_members only'
    WHEN 'member' THEN '⚠️ read-only'
    WHEN 'viewer' THEN '⚠️ read-only'
  END AS permissions
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

**Expected Output:**
```
email                  | role   | permissions
-----------------------|--------|---------------------------
owner@acme-test.com    | owner  | ✅ manage_org + manage_members
admin@acme-test.com    | admin  | ✅ manage_members only
member@acme-test.com   | member | ⚠️ read-only
viewer@acme-test.com   | viewer | ⚠️ read-only
```

**If viewer is missing:**
1. Login as owner@acme-test.com
2. Go to /test/member-invite
3. Invite viewer@acme-test.com with role "viewer"

---

## Testing Setup

### Multi-User Testing Approach

**Recommended: 4 Browser Profiles**
1. Create 4 browser profiles (see TEST_USER_CREDENTIALS.md)
2. Login each profile as different user
3. Keep all 4 windows open side-by-side
4. Test same operation across all users

**Alternative: Sequential Testing**
- Test all operations for Owner
- Logout, login as Admin
- Test all operations for Admin
- Repeat for Member and Viewer

---

## Permission Matrix Test Grid

### Legend
- ✅ **PASS** = Expected status code received
- ❌ **FAIL** = Wrong status code or error
- ⏸️ **PENDING** = Not tested yet

---

## 1. Member Management Operations

### 1.1: List Members (GET /api/orgs/:orgId/members)

**Expected:** All roles can read (200 OK)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 200 OK | ⏸️ PENDING | ⏸️ | |
| Member | 200 OK | ⏸️ PENDING | ⏸️ | |
| Viewer | 200 OK | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/member-role
3. Click "Load Members"
4. Open DevTools Network tab
5. Check response status
6. Record actual status in table above

**Success Criteria:**
- All 4 users receive 200 OK
- All 4 users see the same member list

---

### 1.2: Invite Member (POST /api/orgs/:orgId/members)

**Expected:** Owner and Admin succeed (201), Member and Viewer fail (403)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 201 Created | ⏸️ PENDING | ⏸️ | |
| Admin | 201 Created | ⏸️ PENDING | ⏸️ | |
| Member | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Viewer | 403 Forbidden | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/member-invite
3. Invite test-{role}@example.com (e.g., test-owner@example.com)
4. Open DevTools Network tab
5. Check response status
6. For 403 errors, verify error message mentions "permission"

**Success Criteria:**
- Owner and Admin: 201 Created, user appears in database
- Member and Viewer: 403 Forbidden with permission error message

**Cleanup Between Tests:**
```sql
-- Delete test invitations
DELETE FROM organization_members
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test-%@example.com'
)
AND organization_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM users WHERE email LIKE 'test-%@example.com';
```

---

### 1.3: Update Member Role (PUT /api/orgs/:orgId/members/:userId)

**Expected:** Owner and Admin succeed (200), Member and Viewer fail (403)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 200 OK | ⏸️ PENDING | ⏸️ | |
| Member | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Viewer | 403 Forbidden | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/member-role
3. Load members
4. Change member@acme-test.com role to "viewer"
5. Submit
6. Check DevTools Network tab
7. Record status

**Success Criteria:**
- Owner and Admin: 200 OK, role updates in database
- Member and Viewer: 403 Forbidden

**Reset Role After Testing:**
```sql
UPDATE organization_members
SET role = 'member', updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'member@acme-test.com'
)
AND organization_id = '00000000-0000-0000-0000-000000000001';
```

---

### 1.4: Remove Member (DELETE /api/orgs/:orgId/members/:userId)

**Expected:** Owner and Admin succeed (200), Member and Viewer fail (403)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 200 OK | ⏸️ PENDING | ⏸️ | |
| Member | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Viewer | 403 Forbidden | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. First, create a temporary test member:
   - Login as owner
   - Invite temp-member@example.com
2. Login as each role
3. Use DELETE endpoint (may need to use browser console or Postman):
   ```javascript
   fetch('/api/orgs/00000000-0000-0000-0000-000000000001/members/{userId}', {
     method: 'DELETE',
     headers: { 'Content-Type': 'application/json' }
   }).then(r => console.log(r.status))
   ```
4. Record status

**Success Criteria:**
- Owner and Admin: 200 OK, member removed from database
- Member and Viewer: 403 Forbidden

**Note:** May need to create test UI for DELETE or use browser console

---

## 2. Organization Settings Operations

### 2.1: Get Organization Settings (GET /api/orgs/:orgId)

**Expected:** All roles can read (200 OK)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 200 OK | ⏸️ PENDING | ⏸️ | |
| Member | 200 OK | ⏸️ PENDING | ⏸️ | |
| Viewer | 200 OK | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/org-settings
3. Click "Load Current Data"
4. Check DevTools Network tab
5. Verify 200 OK for all users

**Success Criteria:**
- All 4 users receive 200 OK
- All 4 users see the same organization data

---

### 2.2: Update Organization Settings (PUT /api/orgs/:orgId)

**Expected:** ONLY Owner succeeds (200), all others fail (403)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Member | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Viewer | 403 Forbidden | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/org-settings
3. Load current data
4. Change organization name to "Test Org ({role})"
   - e.g., "Test Org (owner)"
5. Submit
6. Check DevTools Network tab
7. Record status

**Success Criteria:**
- Owner ONLY: 200 OK, name updates in database
- Admin, Member, Viewer: ALL 403 Forbidden with permission error

**Reset Org Name After Testing:**
```sql
UPDATE organizations
SET name = 'Acme Test Corp', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## 3. Team Management Operations

### 3.1: List Teams (GET /api/orgs/:orgId/teams)

**Expected:** All roles can read (200 OK)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 200 OK | ⏸️ PENDING | ⏸️ | |
| Admin | 200 OK | ⏸️ PENDING | ⏸️ | |
| Member | 200 OK | ⏸️ PENDING | ⏸️ | |
| Viewer | 200 OK | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/team-create
3. Load teams list
4. Check DevTools Network tab
5. Verify 200 OK for all

---

### 3.2: Create Team (POST /api/orgs/:orgId/teams)

**Expected:** Owner and Admin succeed (201), Member and Viewer fail (403)

| Role | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| Owner | 201 Created | ⏸️ PENDING | ⏸️ | |
| Admin | 201 Created | ⏸️ PENDING | ⏸️ | |
| Member | 403 Forbidden | ⏸️ PENDING | ⏸️ | |
| Viewer | 403 Forbidden | ⏸️ PENDING | ⏸️ | |

**Test Steps:**
1. Login as each user
2. Go to /test/team-create
3. Create team "{Role} Test Team" (e.g., "Owner Test Team")
4. Check DevTools Network tab
5. Record status

**Success Criteria:**
- Owner and Admin: 201 Created, team appears in database
- Member and Viewer: 403 Forbidden

**Cleanup Test Teams:**
```sql
DELETE FROM teams
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND name LIKE '%Test Team';
```

---

## Summary Matrix

### Expected Results Grid

| Operation | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| **Read Operations** |
| GET /members | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| GET /orgs/:id | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| GET /teams | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| **Member Management (manage_members)** |
| POST /members | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |
| PUT /members/:id | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| DELETE /members/:id | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| **Org Management (manage_org - owner only)** |
| PUT /orgs/:id | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 403 |
| **Team Management** |
| POST /teams | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |

**Total Tests:** 24 (6 operations × 4 roles)

---

## Testing Workflow

### Phase 1: Setup (10 min)
1. ✅ Verify all 4 test users exist (SQL query)
2. ✅ Create 4 browser profiles OR plan sequential testing
3. ✅ Login each profile as different user
4. ✅ Have this document open for reference

### Phase 2: Read Operations (5 min)
1. ✅ Test GET /members (all 4 users)
2. ✅ Test GET /orgs/:id (all 4 users)
3. ✅ Test GET /teams (all 4 users)

**Expected:** All tests show 200 OK

### Phase 3: Write Operations - manage_members (15 min)
1. ✅ Test POST /members (all 4 users)
2. ✅ Test PUT /members/:id (all 4 users)
3. ✅ Test DELETE /members/:id (all 4 users)

**Expected:** Owner/Admin succeed, Member/Viewer get 403

### Phase 4: Write Operations - manage_org (5 min)
1. ✅ Test PUT /orgs/:id (all 4 users)

**Expected:** ONLY Owner succeeds, all others get 403

### Phase 5: Team Operations (5 min)
1. ✅ Test POST /teams (all 4 users)

**Expected:** Owner/Admin succeed, Member/Viewer get 403

### Phase 6: Documentation (5 min)
1. ✅ Calculate success rate
2. ✅ Document any failures
3. ✅ Update TEST_RESULTS_SESSION81.md

**Total Time:** ~45 minutes

---

## Verification Checklist

After completing all tests, verify:

- [ ] All 24 test combinations completed
- [ ] All expected ✅ results received correct status codes
- [ ] All expected ❌ results received 403 Forbidden
- [ ] 403 errors include permission-related error messages
- [ ] No unexpected errors (400, 500, etc.)
- [ ] Matrix fully documented in TEST_RESULTS_SESSION81.md

---

## Common Issues & Solutions

### Issue: All users getting 401 Unauthorized
**Cause:** Not logged in or session expired
**Solution:** Re-login, verify auth token in DevTools

### Issue: All users getting 403 (even Owner)
**Cause:** Organization membership issue or RBAC logic error
**Solution:**
1. Verify user is member of org (SQL query)
2. Check role is set correctly
3. Check browser console for errors
4. Document as critical bug

### Issue: Member/Viewer getting 200 instead of 403
**Cause:** Permission check not implemented or bypassed
**Solution:** Document as CRITICAL SECURITY BUG

### Issue: Owner getting 403 on manage_org operation
**Cause:** Incorrect permission check (should be manage_org, not manage_members)
**Solution:** Document as bug

---

## Error Message Verification

When users receive 403 Forbidden, verify error message quality:

**Good Error Messages:**
```json
{
  "error": "Forbidden",
  "message": "User does not have manage_members permission"
}
```

**Bad Error Messages:**
```json
{
  "error": "Forbidden"
}
```

**Document error message quality** in test results.

---

## Success Criteria

Permission matrix testing is successful when:

1. ✅ All 24 tests completed
2. ✅ 100% of expected results match actual results
3. ✅ All 403 errors include helpful error messages
4. ✅ No security bypasses found (Member/Viewer performing restricted actions)
5. ✅ Results documented in TEST_RESULTS_SESSION81.md

---

**Created:** Session 83
**Last Updated:** 2025-12-13

**Quick Reference:**
```
┌──────────────────────────────────────────────────┐
│         PERMISSION TESTING CHECKLIST             │
├──────────────────────────────────────────────────┤
│ □ Read ops: All users → 200                      │
│ □ Member ops: Owner/Admin → 200, Member/Viewer → 403 │
│ □ Org ops: Owner → 200, All others → 403         │
│ □ Team ops: Owner/Admin → 201, Member/Viewer → 403 │
├──────────────────────────────────────────────────┤
│ Total: 24 tests (6 operations × 4 roles)         │
└──────────────────────────────────────────────────┘
```
