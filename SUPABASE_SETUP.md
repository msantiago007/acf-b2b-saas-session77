# Supabase Setup Instructions

## Part 1: Create Supabase Project (5 minutes)

### Step 1: Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - **Name:** `acf-b2b-saas-session77` (or your preferred name)
   - **Database Password:** Generate a strong password (save it securely)
   - **Region:** Select closest region to you
   - **Pricing Plan:** Free (sufficient for demo)
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Get API Credentials
Once the project is ready:
1. Go to **Settings** > **API** (in left sidebar)
2. Copy these values (you'll need them for .env.local):
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys** > **anon/public:** `eyJ...` (public key)
   - **Project API keys** > **service_role:** `eyJ...` (secret key)

---

## Part 2: Run SQL Migrations (20 minutes)

### Step 1: Create Trigger Function (MUST RUN FIRST)
1. Go to **SQL Editor** (in left sidebar)
2. Click **New query**
3. Copy and paste the contents of: `sql/00_trigger_function.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify success: You should see "Success. No rows returned"

### Step 2: Run Table Migrations (in order)
Run these migrations **in the exact order listed**:

#### Migration 1: Organizations Table
1. Click **New query** in SQL Editor
2. Copy and paste the contents of: `sql/01_organizations.sql`
3. Click **Run**
4. Verify success: Check for "Success. No rows returned"
5. Verify RLS enabled: The output should indicate RLS policies were created

#### Migration 2: Teams Table
1. Click **New query**
2. Copy and paste the contents of: `sql/02_teams.sql`
3. Click **Run**
4. Verify success

#### Migration 3: Organization Members Table
1. Click **New query**
2. Copy and paste the contents of: `sql/03_organization_members.sql`
3. Click **Run**
4. Verify success

### Step 3: Validate Database Setup
Run this validation query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organizations', 'teams', 'organization_members');

-- Expected: 3 rows returned
```

Run this RLS check:

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'teams', 'organization_members');

-- Expected:
-- organizations: TRUE
-- teams: FALSE (no RLS needed for team data within same org)
-- organization_members: TRUE
```

---

## Part 3: Configure Environment Variables

### Step 1: Create .env.local
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_NAME="ACF B2B SaaS Demo"
   ```

### Step 2: Test Local Connection
```bash
npm install  # If you haven't already
npm run dev
```

Visit http://localhost:3000 - the app should load without errors.

---

## Troubleshooting

### "Function update_updated_at_column() does not exist"
**Solution:** Run `sql/00_trigger_function.sql` first before any table migrations.

### "RLS policy error: role does not exist"
**Solution:** The `service_role` is a built-in Supabase role. Ensure you're running migrations in the Supabase SQL Editor (not a local PostgreSQL instance).

### "Cannot set parameter app.current_organization_id"
**Solution:** This is expected - RLS policies use runtime configuration. Will work once you implement auth middleware in the app.

### Build errors about missing Supabase client
**Solution:** Ensure `.env.local` exists and contains valid Supabase credentials.

---

## Next Steps

After completing this setup:
1. ✅ Supabase project created
2. ✅ All 3 tables created with RLS
3. ✅ Local app connected to Supabase
4. Next: Deploy to Vercel (see main DEPLOYMENT.md)
