# Master Testing Guide - Session 83

**Purpose:** Complete testing roadmap for B2B SaaS application
**Status:** Ready for execution
**Estimated Time:** 2 hours
**Created:** Session 83

---

## Quick Start

### What You Need
1. ✅ Access to https://acf-b2b-saas-session77.vercel.app
2. ✅ Access to Supabase Dashboard
3. ✅ Test user credentials (from Supabase)
4. ✅ Browser with DevTools (Chrome, Edge, or Firefox)
5. ✅ These documents (all in `generated/b2b_saas/` folder)

### The 7 Essential Documents

1. **MASTER_TESTING_GUIDE.md** ← You are here
2. **TEST_RESULTS_SESSION81.md** - Main results document (fill this out)
3. **TEST_SQL_VERIFICATION_QUERIES.md** - Database verification queries
4. **TEST_USER_CREDENTIALS.md** - Test user setup and credentials
5. **DEVTOOLS_QUICK_REFERENCE.md** - Browser DevTools guide
6. **PERMISSION_MATRIX_TESTING.md** - RBAC testing guide
7. **PERFORMANCE_BENCHMARKING.md** - Performance testing guide

---

## Testing Overview

### What We're Testing

**Critical Tests (Must Pass):**
- ✅ Member Role Form - Load Members (was blocked in Session 79)
- ✅ Organization Settings - Load Current Data (was blocked in Session 79)

**Full Test Suite:**
- ✅ All 4 test forms (member-role, member-invite, org-settings, team-create)
- ✅ Permission matrix (24 test combinations)
- ✅ Performance benchmarks (8 endpoints)
- ✅ Database integrity verification

**Total Test Cases:** 40+

---

## Pre-Testing Setup (15 minutes)

### Step 1: Get Test User Credentials

**Open Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Find these emails and note their passwords:
   - owner@acme-test.com
   - admin@acme-test.com
   - member@acme-test.com
   - viewer@acme-test.com (create if missing)

**Refer to:** `TEST_USER_CREDENTIALS.md` for detailed instructions

---

### Step 2: Verify Test Data Exists

**Run in Supabase SQL Editor:**
```sql
-- Verify test users exist
SELECT
  u.email,
  om.role,
  om.organization_id
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY om.role;
```

**Expected:** Should see owner, admin, member (and viewer if created)

**Refer to:** `TEST_SQL_VERIFICATION_QUERIES.md` for more queries

---

### Step 3: Setup Browser(s)

**Recommended: Multi-Browser Profiles**
1. Create 4 browser profiles (Owner, Admin, Member, Viewer)
2. Login each profile as different user
3. Keep all 4 windows open side-by-side

**Alternative: Single Browser Sequential**
- Test all operations as Owner
- Logout, login as Admin, test again
- Repeat for Member and Viewer

**Refer to:** `TEST_USER_CREDENTIALS.md` → Multi-User Testing Setup

---

### Step 4: Open Documentation

**Have these files ready:**
1. **TEST_RESULTS_SESSION81.md** - Document results here as you test
2. **DEVTOOLS_QUICK_REFERENCE.md** - Reference for using DevTools
3. **This guide** - Follow the testing sequence

---

## Phase 1: Critical Regression Tests (15 min) ⚡ START HERE

**These tests were BLOCKED in Session 79. Session 80/81 should have fixed them.**

### Test 1.1: Member Role Form - Load Members

**URL:** https://acf-b2b-saas-session77.vercel.app/test/member-role

1. ✅ Login as **owner@acme-test.com**
2. ✅ Open browser to URL
3. ✅ Open DevTools (F12) → Network tab
4. ✅ Click **"Load Members"** button
5. ✅ Check Network tab for `/api/orgs/.../members` request
6. ✅ Verify status: **200 OK** ✅ or error ❌

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Members list displays (owner, admin, member)
- ✅ No errors in Console
- ✅ X-Request-ID header present

**Document in:** TEST_RESULTS_SESSION81.md → TC1.1

**If FAILED:** ❌ STOP and investigate before proceeding

---

### Test 1.2: Organization Settings - Load Current Data

**URL:** https://acf-b2b-saas-session77.vercel.app/test/org-settings

1. ✅ Login as **owner@acme-test.com**
2. ✅ Open browser to URL
3. ✅ Open DevTools (F12) → Network tab
4. ✅ Click **"Load Current Data"** button
5. ✅ Check Network tab for `/api/orgs/...` request
6. ✅ Verify status: **200 OK** ✅ or error ❌

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Form populates with org name, plan, settings
- ✅ No errors in Console

**Document in:** TEST_RESULTS_SESSION81.md → TC3.1

**If FAILED:** ❌ STOP and investigate before proceeding

---

### ⚠️ DECISION POINT

**If BOTH critical tests PASS:** ✅ Continue to Phase 2
**If EITHER critical test FAILS:** ❌ STOP, investigate, document

---

## Phase 2: Full Form Testing (50 min)

### 2.1: Member Role Form - Complete Tests (15 min)

**URL:** /test/member-role

**Test Cases:**
- ✅ TC1.1: Load Members (already done in Phase 1)
- ✅ TC1.2: Update member role to "viewer"
- ✅ TC1.3: Update member role to "admin"
- ✅ TC1.7: Invalid role validation (try "superadmin")

**For each test:**
1. Perform action
2. Check DevTools Network tab for status code
3. Verify in database using SQL queries
4. Document in TEST_RESULTS_SESSION81.md

**Refer to:** TEST_RESULTS_SESSION81.md for detailed test cases

**SQL Verification:**
```sql
-- Check role changes
SELECT u.email, om.role, om.updated_at
FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE u.email = 'member@acme-test.com';
```

---

### 2.2: Member Invite Form - Complete Tests (15 min)

**URL:** /test/member-invite

**Test Cases:**
- ✅ TC2.1: Invite newinvite@example.com
- ✅ TC2.2: Invalid email validation (try "notanemail")
- ✅ TC2.3: Invalid role validation (try "superadmin")
- ✅ TC2.4: Duplicate email (invite owner@acme-test.com)
- ✅ TC2.5: Invite brandnew@example.com

**SQL Verification:**
```sql
-- Verify new invitation
SELECT * FROM users WHERE email = 'newinvite@example.com';
SELECT * FROM organization_members om
JOIN users u ON u.id = om.user_id
WHERE u.email = 'newinvite@example.com';
```

---

### 2.3: Organization Settings Form - Complete Tests (15 min)

**URL:** /test/org-settings

**Test Cases:**
- ✅ TC3.1: Load Current Data (already done in Phase 1)
- ✅ TC3.2: Update org name
- ✅ TC3.3: Update plan (free → pro)
- ✅ TC3.4: Update plan (pro → enterprise)
- ✅ TC3.5: Update settings JSON
- ✅ TC3.6: Empty name validation
- ✅ TC3.7: Invalid plan validation
- ✅ TC3.8: Invalid JSON validation

**SQL Verification:**
```sql
-- Check org updates
SELECT name, plan, settings, updated_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

### 2.4: Team Creation Form - Regression Tests (5 min)

**URL:** /test/team-create

**Test Cases:**
- ✅ TC4.1: Load teams list
- ✅ TC4.2: Create new team "Marketing"
- ✅ TC4.3: Verify team in database

**SQL Verification:**
```sql
-- Check teams
SELECT * FROM teams
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;
```

---

## Phase 3: Permission Matrix Testing (30 min)

**Goal:** Verify RBAC works correctly across all 4 user roles

**Refer to:** `PERMISSION_MATRIX_TESTING.md` for complete guide

### Setup
1. ✅ Setup 4 browser profiles (or plan sequential testing)
2. ✅ Login each as different user (owner, admin, member, viewer)

### Test Grid (24 total tests)

**Quick Summary:**
- **Read operations:** All users should get 200 OK
- **Member management:** Owner/Admin get 200/201, Member/Viewer get 403
- **Org management:** ONLY Owner gets 200, all others get 403
- **Team management:** Owner/Admin get 201, Member/Viewer get 403

### Testing Workflow

**For each operation:**
1. Attempt as Owner → Record status
2. Attempt as Admin → Record status
3. Attempt as Member → Record status (expect 403)
4. Attempt as Viewer → Record status (expect 403)

**Operations to test:**
- GET /members (all should pass)
- POST /members (owner/admin pass, member/viewer fail)
- PUT /members/:id (owner/admin pass, member/viewer fail)
- GET /orgs/:id (all should pass)
- PUT /orgs/:id (ONLY owner passes)
- POST /teams (owner/admin pass, member/viewer fail)

**Document in:** TEST_RESULTS_SESSION81.md → Cross-Role Permission Matrix

**Key Verification:**
- ✅ All expected passes receive correct status code
- ✅ All expected failures receive 403 Forbidden
- ✅ 403 errors include permission-related error messages

---

## Phase 4: Performance Benchmarking (20 min)

**Goal:** Measure API response times and verify they meet targets

**Refer to:** `PERFORMANCE_BENCHMARKING.md` for complete guide

### Targets
- **Read (GET):** < 50ms
- **Write (POST/PUT):** < 100ms

### Endpoints to Benchmark (8 total)

1. GET /api/orgs/:orgId/members
2. POST /api/orgs/:orgId/members
3. PUT /api/orgs/:orgId/members/:userId
4. DELETE /api/orgs/:orgId/members/:userId (if implemented)
5. GET /api/orgs/:orgId
6. PUT /api/orgs/:orgId
7. GET /api/orgs/:orgId/teams
8. POST /api/orgs/:orgId/teams

### For Each Endpoint

1. ✅ Open DevTools → Network tab
2. ✅ Clear network log, disable cache
3. ✅ Perform action
4. ✅ Click API request → Timing tab
5. ✅ Record "Waiting (TTFB)" time
6. ✅ Repeat 3 times
7. ✅ Calculate average
8. ✅ Compare to target

**Document in:** TEST_RESULTS_SESSION81.md → Performance Testing

---

## Phase 5: Documentation & Wrap-up (15 min)

### 5.1: Complete TEST_RESULTS_SESSION81.md

**Review document for completeness:**
- [ ] All test cases have status (✅/❌/⚠️)
- [ ] All test cases have results documented
- [ ] Permission matrix fully filled out
- [ ] Performance benchmarks complete
- [ ] Any failures documented with screenshots

---

### 5.2: Calculate Test Summary Statistics

**Count your results:**
```markdown
## Test Summary Statistics

**Total Test Cases:** [count all tests]
**Passed:** [count ✅]
**Failed:** [count ❌]
**Skipped:** [count ⚠️]
**Success Rate:** [passed / total × 100]%
```

**Update in:** TEST_RESULTS_SESSION81.md → Test Summary Statistics

---

### 5.3: Document Issues Found

**If any tests failed:**

For each failure, document:
```markdown
### Issue: [Brief Title]
- **Severity:** Critical/Major/Minor
- **Test Case:** TC#.#
- **Expected:** [What should have happened]
- **Actual:** [What actually happened]
- **Screenshot:** [filename or link]
- **Reproduction Steps:** [How to reproduce]
- **Impact:** [How this affects users]
```

**Update in:** TEST_RESULTS_SESSION81.md → Issues Found

---

### 5.4: Production Readiness Assessment

**Review checklist:**
- [ ] All critical tests passing (TC1.1, TC3.1)
- [ ] Success rate > 80%
- [ ] No critical security issues (permission bypasses)
- [ ] Performance targets met (> 80% of endpoints)
- [ ] All issues documented

**Make decision:**
- ✅ **PRODUCTION READY** - All tests pass, no blockers
- ⚠️ **READY WITH ISSUES** - Minor issues exist, document for follow-up
- ❌ **NOT READY** - Critical issues found, requires fixes

**Document in:** TEST_RESULTS_SESSION81.md → Conclusion

---

## Helpful Tips

### General Testing Tips

1. **Document as you go** - Don't wait until end
2. **Take screenshots of failures** - Easier debugging later
3. **Verify in database** - Don't trust UI alone
4. **Use DevTools Network tab** - See exact API responses
5. **Test with different roles** - RBAC bugs are subtle

---

### Using DevTools Effectively

**Essential keyboard shortcuts:**
- `F12` - Open DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+L` - Clear console
- `Ctrl+R` - Refresh page
- `Ctrl+Shift+R` - Hard refresh (clear cache)

**What to check:**
- **Console tab:** JavaScript errors
- **Network tab:** API status codes, timing
- **Application tab:** Cookies, localStorage

**Refer to:** `DEVTOOLS_QUICK_REFERENCE.md` for detailed guide

---

### Common Issues & Quick Fixes

**Issue: "Not seeing API request in Network tab"**
- ✅ Make sure Fetch/XHR filter is selected
- ✅ Check "Preserve log" is enabled
- ✅ Clear log and try again

**Issue: "401 Unauthorized"**
- ✅ Re-login (session expired)
- ✅ Check cookies in Application tab

**Issue: "403 Forbidden" (unexpected)**
- ✅ Verify user role in database
- ✅ Check user is member of organization
- ✅ May be a permission bug - document it!

**Issue: "429 Rate Limited"**
- ✅ Wait 60 seconds
- ✅ This actually validates rate limiting works!

---

## Testing Checklist

### Pre-Testing ✅
- [ ] Supabase access verified
- [ ] Test user credentials retrieved
- [ ] Test data verified in database
- [ ] Browser profiles setup (or sequential plan ready)
- [ ] All documentation files open

### Phase 1: Critical Tests ✅
- [ ] TC1.1: Member Role - Load Members
- [ ] TC3.1: Org Settings - Load Current Data
- [ ] Both critical tests passing before continuing

### Phase 2: Full Form Testing ✅
- [ ] Member Role Form (7 test cases)
- [ ] Member Invite Form (6 test cases)
- [ ] Organization Settings Form (10 test cases)
- [ ] Team Creation Form (3 test cases)

### Phase 3: Permission Matrix ✅
- [ ] 4 test users setup and accessible
- [ ] Read operations (3 endpoints × 4 users = 12 tests)
- [ ] Write operations (3 endpoints × 4 users = 12 tests)
- [ ] All 24 combinations documented

### Phase 4: Performance ✅
- [ ] 8 endpoints benchmarked
- [ ] 3 runs per endpoint (24 total measurements)
- [ ] Averages calculated
- [ ] Compared to targets

### Phase 5: Documentation ✅
- [ ] All test results documented
- [ ] Test summary statistics calculated
- [ ] Issues documented (if any)
- [ ] Production readiness assessment made
- [ ] Session 83 summary written (optional)

---

## Time Estimates

**Optimistic (Experienced Tester):** 1.5 hours
**Realistic (First Time):** 2-2.5 hours
**With Issues/Debugging:** 3+ hours

**Breakdown:**
- Pre-testing setup: 15 min
- Phase 1 (Critical): 15 min
- Phase 2 (Forms): 50 min
- Phase 3 (Permissions): 30 min
- Phase 4 (Performance): 20 min
- Phase 5 (Documentation): 15 min
- **Total:** ~2 hours 25 min

**If time constrained, prioritize:**
1. Phase 1 (Critical tests) - Must do
2. Phase 2 (Full form testing) - High priority
3. Phase 3 (Permission matrix) - High priority
4. Phase 5 (Documentation) - Must do
5. Phase 4 (Performance) - Can defer if needed

---

## Success Criteria

Session 83 testing is complete when:

1. ✅ Both critical tests passing (TC1.1, TC3.1)
2. ✅ All 40+ test cases executed
3. ✅ Permission matrix completed (24 tests)
4. ✅ Performance benchmarks completed (8 endpoints)
5. ✅ TEST_RESULTS_SESSION81.md 100% complete
6. ✅ Test summary statistics calculated
7. ✅ Production readiness decision made
8. ✅ All issues documented (if any)

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Mark Session 83 complete
2. Application is production-ready
3. Can proceed with production deployment
4. Write Session 83 summary

### If Tests Fail ❌
1. Document all failures in detail
2. Prioritize issues (critical vs minor)
3. Create Session 84 plan to fix issues
4. DO NOT deploy to production until fixed

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│          SESSION 83 TESTING QUICK REF               │
├─────────────────────────────────────────────────────┤
│ App URL: https://acf-b2b-saas-session77.vercel.app  │
│ Org ID:  00000000-0000-0000-0000-000000000001       │
│                                                     │
│ Test Users:                                         │
│  • owner@acme-test.com  (all permissions)           │
│  • admin@acme-test.com  (manage_members)            │
│  • member@acme-test.com (read-only)                 │
│  • viewer@acme-test.com (read-only)                 │
│                                                     │
│ Test Forms:                                         │
│  • /test/member-role                                │
│  • /test/member-invite                              │
│  • /test/org-settings                               │
│  • /test/team-create                                │
│                                                     │
│ DevTools: F12 → Network tab → Check status codes   │
│ SQL: TEST_SQL_VERIFICATION_QUERIES.md               │
│ Results: TEST_RESULTS_SESSION81.md                  │
├─────────────────────────────────────────────────────┤
│ PHASE 1: Critical Tests (15 min) ⚡ START HERE      │
│ PHASE 2: Full Forms (50 min)                        │
│ PHASE 3: Permissions (30 min)                       │
│ PHASE 4: Performance (20 min)                       │
│ PHASE 5: Documentation (15 min)                     │
│ TOTAL: ~2 hours                                     │
└─────────────────────────────────────────────────────┘
```

---

**Created:** Session 83
**Last Updated:** 2025-12-13

**Ready to start testing? Begin with Phase 1: Critical Regression Tests** ⚡

Good luck! 🎯
