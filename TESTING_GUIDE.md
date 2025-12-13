# Testing Guide - Session 78

**Purpose:** Comprehensive end-to-end testing of ML-generated B2B SaaS application
**Production URL:** https://acf-b2b-saas-session77.vercel.app
**Date:** 2025-12-12

---

## Quick Start

### Prerequisites Checklist
- [ ] Supabase project configured (from Session 77)
- [ ] Vercel deployment live
- [ ] Environment variables set
- [ ] Local development environment ready

### Testing Order
1. Part 1: Supabase Auth Setup (30 min)
2. Part 2: Form Testing (60 min)
3. Part 3: RBAC Testing (30 min)
4. Part 4: RLS Policy Testing (20 min)
5. Part 5: Performance Benchmarks (40 min)

---

## Part 1: Supabase Auth Setup

### Step 1: Enable Email Authentication

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `acf-b2b-saas-session77`
3. Navigate to **Authentication** > **Providers**
4. Enable **Email** provider
5. Configure settings:
   - **Enable email confirmation:** OFF (for faster testing)
   - **Enable auto-confirm users:** ON
   - **Mailer:** Use default Supabase mailer

### Step 2: Create Test Users

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Create these users:

| Email | Password | Role (to assign later) |
|-------|----------|------------------------|
| owner@acme-test.com | TestPass123! | owner |
| admin@acme-test.com | TestPass123! | admin |
| member@acme-test.com | TestPass123! | member |

**Option B: Via SQL**

```sql
-- Note: This requires service_role access
-- Run in Supabase SQL Editor with service role

-- You'll need to use Supabase's auth API instead
-- See: https://supabase.com/docs/guides/auth/server-side/creating-a-user
```

### Step 3: Link Users to Organization

After creating users, get their UUIDs and run this SQL:

```sql
-- First, check the created users
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 3;

-- Copy the UUIDs and use them below
-- Replace [owner-uuid], [admin-uuid], [member-uuid] with actual values

INSERT INTO organization_members (organization_id, user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', '[owner-uuid]', 'owner'),
  ('00000000-0000-0000-0000-000000000001', '[admin-uuid]', 'admin'),
  ('00000000-0000-0000-0000-000000000001', '[member-uuid]', 'member');

-- Verify the inserts
SELECT om.*, au.email
FROM organization_members om
JOIN auth.users au ON au.id = om.user_id
WHERE om.organization_id = '00000000-0000-0000-0000-000000000001';
```

### Step 4: Verify Auth Works

**Test login:**

1. Open browser DevTools (F12)
2. Go to production URL: https://acf-b2b-saas-session77.vercel.app
3. Create simple login test page (see below)

**Quick Login Test Page** (optional):

Create `app/test/auth-check/page.tsx`:

```tsx
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export default function AuthCheck() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else {
      setUser(data.user)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>

      <button
        onClick={() => handleLogin('owner@acme-test.com', 'TestPass123!')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login as Owner
      </button>

      {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  )
}
```

---

## Part 2: Form Testing

### Test Page URLs

All test pages are available at `/test/[form-name]`:

1. **Organization Settings** (HIGH RISK - Zod):
   https://acf-b2b-saas-session77.vercel.app/test/org-settings

2. **Team Creation** (MEDIUM RISK - HTML5):
   https://acf-b2b-saas-session77.vercel.app/test/team-create

3. **Member Role** (MEDIUM RISK - HTML5):
   https://acf-b2b-saas-session77.vercel.app/test/member-role

4. **Member Invite** (HIGH RISK - Zod):
   https://acf-b2b-saas-session77.vercel.app/test/member-invite

### Testing Checklist

#### Test 1: OrganizationSettingsForm

**Valid Submission:**
- [ ] Update name to "Acme Corporation (Updated)"
- [ ] Change plan from "pro" to "enterprise"
- [ ] Click "Load Current Data" to see database state
- [ ] Submit form
- [ ] Verify success message
- [ ] Check Supabase dashboard for updated values

**Validation Tests:**
- [ ] Empty name → Should show "Organization Name is required"
- [ ] Select blank plan → Zod should reject
- [ ] Invalid JSON in settings → Should fail parsing
- [ ] All errors display with red styling

#### Test 2: TeamCreationForm

**Valid Submission:**
- [ ] Enter team name "Marketing"
- [ ] Add optional description "Marketing team for campaigns"
- [ ] Submit form
- [ ] Click "Load Teams" to see new team
- [ ] Verify team appears in database

**Validation Tests:**
- [ ] Empty team name → HTML5 should block with native UI
- [ ] Notice browser's native validation styling
- [ ] Submit with description only → Should work

#### Test 3: MemberRoleForm

**Valid Submission:**
- [ ] Click "Load Members" to see current members
- [ ] Copy a user_id from the list
- [ ] Paste into form
- [ ] Select different role (e.g., change from "member" to "admin")
- [ ] Submit form
- [ ] Reload members to verify change

**Validation Tests:**
- [ ] Empty user_id → HTML5 required validation
- [ ] Empty role → HTML5 required validation
- [ ] Non-existent user_id → Supabase returns 0 rows

#### Test 4: MemberInviteForm

**Valid Submission:**
- [ ] Enter email "newuser@example.com"
- [ ] Select role "member"
- [ ] Add optional message "Welcome to Acme!"
- [ ] Submit form
- [ ] Verify invite appears in list

**Validation Tests:**
- [ ] Invalid email "not-an-email" → Zod error: "Invalid email format"
- [ ] Empty email → Zod error: "Email Address is required"
- [ ] Blank role selection → Zod enum validation error
- [ ] Valid formats: test@example.com, user+tag@domain.co.uk

---

## Part 3: RBAC Middleware Testing

### Prerequisites

- Test users created and linked to organization
- Auth cookies available (login via browser)

### Test 1: Unauthenticated Request

**Using curl:**

```bash
curl https://acf-b2b-saas-session77.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams
```

**Expected:**
- Status: `401 Unauthorized` or `403 Forbidden`
- Body: Error message about authentication

### Test 2: Authenticated Request (Owner)

**Steps:**

1. Login as `owner@acme-test.com` in browser
2. Open DevTools → Application → Cookies
3. Copy cookie values for `sb-access-token` and `sb-refresh-token`
4. Use in curl:

```bash
curl https://acf-b2b-saas-session77.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE; sb-refresh-token=YOUR_REFRESH_HERE"
```

**Expected:**
- Status: `200 OK`
- Body: JSON array of teams

### Test 3: Insufficient Permissions (Member)

**Test creating a team (requires `manage_team` permission):**

1. Login as `member@acme-test.com`
2. Get auth cookies
3. Try to POST:

```bash
curl -X POST https://acf-b2b-saas-session77.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Unauthorized Team"}'
```

**Expected:**
- Status: `403 Forbidden`
- Body: Error about insufficient permissions

### Permissions Matrix

| Role | Permissions | Can Create Team? |
|------|-------------|------------------|
| owner | All | ✅ Yes |
| admin | manage_team, manage_members | ✅ Yes |
| member | read, write | ❌ No |
| viewer | read | ❌ No |

---

## Part 4: RLS Policy Testing

### Test 1: Tenant Isolation (Service Role)

**Setup:**

```sql
-- Create second organization for isolation test
INSERT INTO organizations (id, name, slug, plan)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Beta Industries',
  'beta-industries',
  'free'
);

INSERT INTO teams (organization_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Beta Team 1'),
  ('00000000-0000-0000-0000-000000000002', 'Beta Team 2');
```

**Test isolation:**

```sql
-- Set session to Org 1 (Acme)
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

-- Query all organizations (RLS should filter)
SELECT * FROM organizations;
-- Expected: Only Acme Corporation (Org 1)

-- Try to access Org 2 directly
SELECT * FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000002';
-- Expected: Empty result (RLS blocks)

-- Query teams (no RLS on teams table)
SELECT * FROM teams;
-- Expected: Teams from ALL organizations (teams has no RLS)
```

### Test 2: Service Role Bypass

**Run as service_role:**

```sql
-- Service role should bypass RLS and see all data
SELECT * FROM organizations;
-- Expected: Both Acme (Org 1) AND Beta Industries (Org 2)

SELECT COUNT(*) FROM organization_members;
-- Expected: Count of ALL members across all organizations
```

### Test 3: RLS on organization_members

```sql
-- Set to Org 1
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-000000000001';

SELECT * FROM organization_members;
-- Expected: Only members of Org 1

-- Try to query Org 2 members
SELECT * FROM organization_members
WHERE organization_id = '00000000-0000-0000-0000-000000000002';
-- Expected: Empty result (RLS blocks)
```

### Validation Checklist

- [ ] RLS enabled on `organizations` table
- [ ] RLS enabled on `organization_members` table
- [ ] RLS NOT enabled on `teams` table (by design)
- [ ] Service role can bypass RLS
- [ ] Regular roles cannot access other organizations
- [ ] `app.current_organization_id` filters correctly

---

## Part 5: Performance Benchmarks

### Benchmark 1: Zod Validation

**Run benchmark:**

```bash
cd generated/b2b_saas
npx ts-node benchmarks/zod-validation.ts
```

**Expected Output:**

```
Zod Validation Performance Benchmark
============================================================

Test 1: OrganizationSettings Schema - Valid Data
------------------------------------------------------------
Zod validation (1000 iterations): 8.234ms
Total time: 8.23ms
Per validation: 0.0082ms
Validations per second: 121,500
```

**Success Criteria:**

- [ ] Per-validation time < 0.01ms
- [ ] Total time for 1000 iterations < 10ms
- [ ] No errors during validation
- [ ] safeParse vs parse performance comparable

### Benchmark 2: API Latency

**Run benchmark:**

```bash
cd generated/b2b_saas
npx ts-node benchmarks/api-latency.ts
```

**Expected Output:**

```
API Route Latency Benchmark
============================================================

Test 1: GET /api/orgs/[orgId]/teams
============================================================
Testing https://acf-b2b-saas-session77.vercel.app/api/orgs/.../teams
Iterations: 50

Latency Statistics:
------------------------------------------------------------
Min         : 98.45ms
Max         : 456.23ms
Average     : 156.78ms    (target: 200ms) ✅
Median      : 142.34ms
P50         : 142.34ms    (target: 150ms) ✅
P95         : 298.12ms    (target: 500ms) ✅
P99         : 423.45ms    (target: 1000ms) ✅
```

**Success Criteria:**

- [ ] Average < 200ms
- [ ] P50 < 150ms
- [ ] P95 < 500ms
- [ ] P99 < 1000ms
- [ ] < 5% error rate

### Benchmark 3: Lighthouse Audit

**Install Lighthouse CLI:**

```bash
npm install -g lighthouse
```

**Run audit:**

```bash
lighthouse https://acf-b2b-saas-session77.vercel.app \
  --output html \
  --output json \
  --output-path ./lighthouse-report \
  --view
```

**Success Criteria:**

- [ ] Performance score > 80
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.8s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Accessibility score > 85
- [ ] Best Practices score > 90
- [ ] SEO score > 80

---

## Part 6: Results Documentation

### Create Test Results Template

Create `generated/b2b_saas/TEST_RESULTS.md`:

```markdown
# Test Results - Session 78

**Date:** 2025-12-12
**Tester:** [Your Name]
**Environment:** Production (acf-b2b-saas-session77.vercel.app)

## Part 1: Auth Setup

- [x] Email provider enabled
- [x] 3 test users created
- [x] Users linked to organization
- [ ] Login tested successfully

## Part 2: Form Testing

### OrganizationSettingsForm
- [ ] Valid submission works
- [ ] Zod validation catches errors
- [ ] Database updated correctly
- Notes: ___________

### TeamCreationForm
- [ ] Valid submission works
- [ ] HTML5 validation works
- [ ] Database insert successful
- Notes: ___________

### MemberRoleForm
- [ ] Valid submission works
- [ ] Role update successful
- Notes: ___________

### MemberInviteForm
- [ ] Valid submission works
- [ ] Email validation works
- [ ] Enum validation works
- Notes: ___________

## Part 3: RBAC Testing

- [ ] Unauthenticated requests blocked
- [ ] Authenticated requests work
- [ ] Permission enforcement tested
- [ ] Owner has full access
- [ ] Member blocked from management

## Part 4: RLS Testing

- [ ] Tenant isolation working
- [ ] Service role bypasses RLS
- [ ] organization_members filtered correctly
- [ ] Cannot access other org's data

## Part 5: Performance

### Zod Validation
- Per-validation time: ______ ms
- Status: PASS / FAIL
- Notes: ___________

### API Latency
- Average: ______ ms
- P95: ______ ms
- Status: PASS / FAIL
- Notes: ___________

### Lighthouse
- Performance: ______ / 100
- Accessibility: ______ / 100
- Best Practices: ______ / 100
- SEO: ______ / 100
- Status: PASS / FAIL

## Issues Found

1. Issue: ___________
   Severity: HIGH / MEDIUM / LOW
   Resolution: ___________

2. Issue: ___________
   Severity: HIGH / MEDIUM / LOW
   Resolution: ___________

## Recommendations

1. ___________
2. ___________
3. ___________

## Overall Assessment

- [ ] All critical tests passed
- [ ] Performance meets targets
- [ ] Ready for next phase
- [ ] Blockers identified: ___________
```

---

## Troubleshooting

### Auth Issues

**Problem:** "User not found"
**Solution:** Verify email auto-confirm is enabled in Supabase Auth settings

**Problem:** "Invalid credentials"
**Solution:** Check password matches what was set (TestPass123!)

### Form Issues

**Problem:** Forms don't submit
**Solution:** Check browser console for Supabase connection errors

**Problem:** Zod validation not working
**Solution:** Verify form is using Zod schema, check error display logic

### RBAC Issues

**Problem:** All requests return 401
**Solution:** Verify RBAC middleware is deployed, check auth tokens

**Problem:** Permissions not enforced
**Solution:** Check permissions.ts and role mappings

### RLS Issues

**Problem:** Can see other organization's data
**Solution:** Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`

**Problem:** Service role blocked
**Solution:** Ensure using SUPABASE_SERVICE_ROLE_KEY, not anon key

---

## Next Steps

After completing Session 78 testing:

1. **Document all findings** in TEST_RESULTS.md
2. **Fix any bugs** discovered during testing
3. **Session 79:** Add additional entities (Invitations, Audit Logs)
4. **Session 80:** Advanced features (Stripe, onboarding, etc.)

---

**Generated by ACF (Agentic Capsule Factory)**
Session 78 - Integration Testing & Form Validation
🤖 Claude Sonnet 4.5
