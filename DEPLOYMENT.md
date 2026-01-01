# Deployment Guide

ML-Generated B2B SaaS Application - Complete Deployment Instructions

**Generated:** Session 76
**Deployed:** Session 77
**Production URL:** https://acf-b2b-saas-session77.vercel.app
**Repository:** https://github.com/msantiago007/acf-b2b-saas-session77

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier sufficient)
- Vercel account (free tier sufficient)
- Git installed
- GitHub account (optional, for version control)

---

## Part 1: Supabase Setup (15 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Configure:
   - **Name:** Your project name
   - **Database Password:** Generate strong password (save securely)
   - **Region:** Select closest region
   - **Plan:** Free (sufficient for demo/testing)
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Step 2: Get API Credentials

Once provisioned:
1. Go to **Settings** > **API**
2. Copy these values (needed for environment variables):
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key:** `eyJ...` (public, safe for client)
   - **service_role key:** `eyJ...` (secret, server-only)

### Step 3: Run SQL Migrations

**IMPORTANT:** Run these in the exact order shown!

#### Migration 0: Trigger Function (MUST RUN FIRST)

Go to **SQL Editor** > **New query** and run:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function to automatically update the updated_at timestamp on row updates.';
```

#### Migration 1: Organizations Table

```sql
-- Run contents of sql/01_organizations.sql
```

See: `sql/01_organizations.sql` for full SQL

#### Migration 2: Teams Table

```sql
-- Run contents of sql/02_teams.sql
```

See: `sql/02_teams.sql` for full SQL

#### Migration 3: Organization Members Table

```sql
-- Run contents of sql/03_organization_members.sql
```

See: `sql/03_organization_members.sql` for full SQL

#### Validation: Verify Setup

Run the validation script:

```sql
-- Run contents of sql/99_validate_setup.sql
```

**Expected Results:**
- 3 tables created (organizations, teams, organization_members)
- RLS enabled on organizations and organization_members
- 4 RLS policies total
- 3 triggers (one per table)

### Step 4: Create Test Data (Optional)

For testing, insert sample data:

```sql
INSERT INTO organizations (id, name, slug, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Acme Corporation',
  'acme-corp',
  'pro',
  '{"features": {"analytics": true}}'::jsonb
);

INSERT INTO teams (organization_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Engineering'),
  ('00000000-0000-0000-0000-000000000001', 'Product');
```

---

## Part 2: Local Development Setup (5 minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/msantiago007/acf-b2b-saas-session77.git
cd acf-b2b-saas-session77
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_NAME="ACF B2B SaaS Demo"
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - app should load without errors.

---

## Part 3: Production Deployment (20 minutes)

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Create GitHub Repository (If Not Done)

```bash
git init
git add .
git commit -m "Initial commit: ML-generated B2B SaaS app"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Import your repository
4. Configure project:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`

#### Step 3: Add Environment Variables (CRITICAL!)

In Vercel project settings, add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |

#### Step 4: Deploy

Click **"Deploy"** - deployment takes 2-3 minutes.

#### Step 5: Verify Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Open DevTools Console (F12)
3. Verify no JavaScript errors
4. Check Supabase connection working

### Option B: Deploy to Other Platforms

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Docker

```bash
docker build -t b2b-saas .
docker run -p 3000:3000 b2b-saas
```

---

## Part 4: Post-Deployment

### Enable Supabase Auth (Optional)

For user authentication:

1. Go to Supabase **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates
4. Update app to use Supabase Auth

### Custom Domain (Optional)

In Vercel:
1. Go to **Settings** > **Domains**
2. Add your custom domain
3. Update DNS records as instructed

### Monitoring

- **Vercel Analytics:** Enable in project settings
- **Supabase Logs:** Check database query performance
- **Error Tracking:** Add Sentry or similar (optional)

---

## Troubleshooting

### Build Errors

**Error:** `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Solution:** Ensure environment variables are set in Vercel/Netlify dashboard, not just `.env.local`.

### Database Connection Errors

**Error:** `Failed to connect to Supabase`

**Solution:**
- Verify environment variables are correct
- Check Supabase project is active
- Confirm anon key is valid

### RLS Policy Errors

**Error:** `new row violates row-level security policy`

**Solution:**
- Check `app.current_organization_id` is set correctly
- Verify service role key is used for admin operations
- Confirm RLS policies match your use case

### Build Performance Issues

If build is slow:
- Check bundle size: `npm run build`
- Optimize images: Use Next.js Image component
- Enable caching: Configured by default

---

## Performance Targets

Based on Session 77 deployment:

| Metric | Target | Actual |
|--------|--------|--------|
| First Load JS | < 100 kB | 83.9 kB ✅ |
| Build Time | < 30s | ~15s ✅ |
| TypeScript Errors | 0 | 0 ✅ |
| Lighthouse Performance | > 80 | Not measured* |

\* Run Lighthouse manually: https://pagespeed.web.dev

---

## Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] Service role key is server-side only (never exposed to client)
- [ ] RLS policies enabled on sensitive tables
- [ ] SQL migrations reviewed for security issues
- [ ] CORS configured (if needed)
- [ ] Rate limiting considered (Upstash Redis recommended)

---

## Next Steps

After deployment:

1. **Test Forms:** Verify all 4 forms work with real data
2. **Test RBAC:** Confirm role-based access control works
3. **Test RLS:** Verify tenant isolation with multiple orgs
4. **Add Features:** Implement Stripe, onboarding, etc.
5. **Monitoring:** Set up error tracking and analytics

---

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs

---

**Generated by ACF (Agentic Capsule Factory)**
Session 77 - Production Deployment & Performance Testing
🤖 Claude Sonnet 4.5
