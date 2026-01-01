# Test User Credentials & Setup

**Purpose:** Reference for test users and multi-user testing setup
**Session:** 83
**Environment:** https://acf-b2b-saas-session77.vercel.app

---

## Test Users

### Primary Test Organization
- **Organization ID:** `00000000-0000-0000-0000-000000000001`
- **Organization Name:** Acme Test Corp (or similar)

### User Accounts

#### 1. Owner Account
- **Email:** `owner@acme-test.com`
- **Password:** *Retrieve from Supabase Dashboard → Authentication → Users*
- **Role:** `owner`
- **Permissions:**
  - ✅ manage_org (update org settings)
  - ✅ manage_members (invite, update roles, remove)
  - ✅ All read operations
- **Use For:**
  - TC3.9 (Owner can update org settings)
  - TC1.4 (Owner can update member roles)
  - TC2.1-2.6 (Inviting members)

---

#### 2. Admin Account
- **Email:** `admin@acme-test.com`
- **Password:** *Retrieve from Supabase Dashboard → Authentication → Users*
- **Role:** `admin`
- **Permissions:**
  - ❌ manage_org (CANNOT update org settings)
  - ✅ manage_members (invite, update roles, remove)
  - ✅ All read operations
- **Use For:**
  - TC3.10 (Admin CANNOT update org settings - should get 403)
  - TC1.5 (Admin CAN update member roles)
  - Permission matrix testing

---

#### 3. Member Account
- **Email:** `member@acme-test.com`
- **Password:** *Retrieve from Supabase Dashboard → Authentication → Users*
- **Role:** `member`
- **Permissions:**
  - ❌ manage_org (CANNOT update org settings)
  - ❌ manage_members (CANNOT manage members)
  - ✅ Read operations only
- **Use For:**
  - TC1.6 (Member CANNOT update roles - should get 403)
  - Permission matrix testing
  - Testing role updates (change this user's role)

---

#### 4. Viewer Account (Create if Needed)
- **Email:** `viewer@acme-test.com`
- **Password:** *Set during creation*
- **Role:** `viewer`
- **Permissions:**
  - ❌ manage_org (CANNOT update org settings)
  - ❌ manage_members (CANNOT manage members)
  - ✅ Read operations only
- **Use For:**
  - Permission matrix testing
  - Testing most restrictive role

**If viewer user doesn't exist:**
1. Login as owner@acme-test.com
2. Go to /test/member-invite
3. Invite viewer@acme-test.com with role "viewer"
4. Check Supabase for auto-generated password or set manually

---

## Getting User Passwords

### Method 1: Supabase Dashboard (Recommended)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Users**
4. Find the user by email
5. Click on user → View Details
6. Use **"Send Magic Link"** for passwordless login
7. OR use **"Reset Password"** to set a known password

### Method 2: Password Reset
1. Go to application login page
2. Click "Forgot Password"
3. Enter user email
4. Check email for reset link
5. Set new password

### Method 3: Manual Password Set (Supabase Admin)
```sql
-- Run in Supabase SQL Editor
-- WARNING: This sets a known password for ALL test accounts
-- Only use in test environments!

-- Set password to "TestPass123!" for all test users
-- (Requires Supabase admin access)
```

**Note:** For security, don't commit actual passwords to git. Keep them in a secure location or use password manager.

---

## Multi-User Testing Setup

### Option 1: Multiple Browser Profiles (Recommended)

**Chrome/Edge:**
1. Click profile icon (top right)
2. Create new profile for each user:
   - Profile 1: "Owner Test"
   - Profile 2: "Admin Test"
   - Profile 3: "Member Test"
   - Profile 4: "Viewer Test"
3. Each profile has separate cookies/sessions
4. Can have all open simultaneously

**Firefox:**
1. Type `about:profiles` in address bar
2. Create new profiles for each user
3. Launch with different profiles

---

### Option 2: Incognito/Private Windows

**Pros:**
- Quick setup
- No profile management

**Cons:**
- Can't have multiple incognito windows with different sessions
- Need to logout/login between tests

**Steps:**
1. Open regular window for User 1
2. Open incognito for User 2
3. Use different browser (Firefox) for User 3
4. Use mobile device for User 4

---

### Option 3: Single Browser (Sequential Testing)

**If limited to one browser:**
1. Complete all tests for Owner
2. **Logout**
3. Login as Admin
4. Complete all tests for Admin
5. **Logout**
6. Repeat for Member and Viewer

**Pros:**
- Simple setup

**Cons:**
- Time-consuming
- Can't test concurrent scenarios
- Easy to forget which user you're logged in as

---

## Permission Matrix Reference

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| **Read Operations** |
| GET /api/orgs/:orgId | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| GET /api/orgs/:orgId/members | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| GET /api/orgs/:orgId/teams | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| **Write Operations (manage_members)** |
| POST /api/orgs/:orgId/members | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |
| PUT /api/orgs/:orgId/members/:userId | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| DELETE /api/orgs/:orgId/members/:userId | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 |
| **Write Operations (manage_org)** |
| PUT /api/orgs/:orgId | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 403 |
| **Team Operations** |
| POST /api/orgs/:orgId/teams | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 |

---

## Testing Workflow

### Phase 1: Setup (5 min)
1. ✅ Open Supabase Dashboard
2. ✅ Get passwords for all 4 users
3. ✅ Set up browser profiles OR plan sequential testing
4. ✅ Test login for each user (verify access)

### Phase 2: Individual Tests (Per User)
1. Login as user
2. Navigate to test form
3. Attempt operation
4. Record result (status code, success/error)
5. Verify in database if write operation
6. Screenshot any errors

### Phase 3: Cleanup
1. Review permission matrix completeness
2. Document any unexpected results
3. Reset test data if needed (using SQL cleanup queries)

---

## Troubleshooting

### "Email not found" Error
**Cause:** User doesn't exist in Supabase Auth
**Solution:**
1. Check Supabase → Authentication → Users
2. Create user manually OR use invite form
3. Verify email is correct

### "Invalid password" Error
**Cause:** Password incorrect or user needs password reset
**Solution:**
1. Use "Send Magic Link" instead
2. OR reset password through Supabase
3. OR use password reset flow

### "Not authorized" / 403 Error
**Cause:** User doesn't have required role or org membership
**Solution:**
1. Verify user is in organization:
   ```sql
   SELECT * FROM organization_members om
   JOIN users u ON u.id = om.user_id
   WHERE u.email = 'user@example.com';
   ```
2. Check user's role is correct
3. Verify organization_id matches

### Can't Access Test Forms
**Cause:** Not logged in or session expired
**Solution:**
1. Login at: https://acf-b2b-saas-session77.vercel.app/login
2. OR navigate to test page (should redirect to login)
3. Check browser console for errors

### Session Conflicts (Multiple Windows)
**Cause:** Same browser profile sharing session
**Solution:**
- Use browser profiles (separate sessions)
- OR use different browsers
- Clear cookies between user switches

---

## Security Notes

### Test Environment Only
- These are TEST credentials for development
- Never use these patterns in production
- Change passwords regularly
- Don't commit actual passwords to git

### Production Checklist
- [ ] All test accounts disabled/removed in production
- [ ] Production uses real user invitations
- [ ] MFA/2FA enabled for admin accounts
- [ ] Password policies enforced
- [ ] Regular security audits

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│          TEST USER QUICK REFERENCE              │
├─────────────────────────────────────────────────┤
│ Owner:  owner@acme-test.com   (ALL permissions) │
│ Admin:  admin@acme-test.com   (manage_members)  │
│ Member: member@acme-test.com  (read-only)       │
│ Viewer: viewer@acme-test.com  (read-only)       │
├─────────────────────────────────────────────────┤
│ Test Org: 00000000-0000-0000-0000-000000000001  │
│ App URL:  https://acf-b2b-saas-session77...     │
└─────────────────────────────────────────────────┘
```

Print this and keep next to your screen during testing!

---

**Created:** Session 83
**Last Updated:** 2025-12-13
