# Environment Variables Checklist - Production Deployment

**Session 85: Path B - Deploy with Monitoring**
**Created:** 2026-01-01
**Purpose:** Verify all environment variables are configured for production deployment

---

## ✅ Current Status

### Configured in Vercel (Verified)

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- ✅ `NEXT_PUBLIC_APP_NAME` - Application display name

### ⚠️ Pending Configuration (Session 85 - Sentry Setup)

These variables need to be added to Vercel after Sentry account is created:

- ⏸️ `NEXT_PUBLIC_SENTRY_DSN` - Sentry Data Source Name (public)
- ⏸️ `SENTRY_DSN` - Sentry DSN for server-side (optional, same as above)
- ⏸️ `SENTRY_ORG` - Your Sentry organization slug
- ⏸️ `SENTRY_PROJECT` - Your Sentry project name
- ⏸️ `SENTRY_AUTH_TOKEN` - Sentry auth token for uploading source maps (optional)

---

## 📋 How to Add Sentry Variables to Vercel

### Step 1: Create Sentry Account (if not already done)

1. Go to https://sentry.io/signup/
2. Sign up for a free account
3. Create a new project:
   - **Platform:** Next.js
   - **Project Name:** `acf-b2b-saas-session77` (or your choice)
   - **Team:** Your team/personal account

### Step 2: Get Sentry Credentials

After creating the project, Sentry will provide:

- **DSN (Data Source Name):** Found in Settings → Client Keys (DSN)
  - Format: `https://[key]@[org].ingest.sentry.io/[project-id]`
  - Example: `https://abc123def456@o123456.ingest.sentry.io/7654321`

- **Organization Slug:** Found in Settings → Organization Settings
  - Example: `my-org`

- **Project Slug:** The project name you chose
  - Example: `acf-b2b-saas-session77`

- **Auth Token (Optional):** Settings → Auth Tokens → Create New Token
  - Scopes needed: `project:read`, `project:releases`
  - Only needed for uploading source maps

### Step 3: Add Variables to Vercel

1. Go to https://vercel.com/marcos-projects-39cb80b6/acf-b2b-saas-session77/settings/environment-variables

2. Add each variable:

   **NEXT_PUBLIC_SENTRY_DSN**
   - Value: `https://[your-key]@[your-org].ingest.sentry.io/[your-project-id]`
   - Environments: Production, Preview, Development

   **SENTRY_ORG**
   - Value: `your-org-slug`
   - Environments: Production, Preview, Development

   **SENTRY_PROJECT**
   - Value: `acf-b2b-saas-session77`
   - Environments: Production, Preview, Development

   **SENTRY_AUTH_TOKEN** (Optional - only if uploading source maps)
   - Value: `your_auth_token_here`
   - Environments: Production only
   - ⚠️ Mark as "Sensitive"

3. Click "Save" for each variable

### Step 4: Trigger Redeployment

After adding variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Select "Use existing Build Cache" (faster)
4. Click "Redeploy"

---

## 🔒 Security Best Practices

### ✅ Public Variables (Safe for Client-Side)

These variables are safe to expose in client-side code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_APP_NAME`

**Why?** Next.js bundles these into the client JavaScript. They're designed to be public.

### 🔐 Secret Variables (Server-Side Only)

These must NEVER be exposed to the client:
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses Row Level Security
- `SENTRY_AUTH_TOKEN` - Can upload releases/source maps

**Protection:** Next.js only exposes these to server-side code (API routes, server components).

### ⚠️ Never Commit to Git

Ensure `.env.local` is in `.gitignore`:

```bash
# Already configured in .gitignore
.env.local
.env*.local
```

---

## 🧪 Testing Environment Variables

### Local Testing

```bash
# In generated/b2b_saas directory

# Verify Supabase connection
npm run dev
# Open http://localhost:3000/test/auth-check
# Should show "Connected to Supabase" ✅

# Verify Sentry (after adding NEXT_PUBLIC_SENTRY_DSN to .env.local)
npm run dev
# Trigger an error in the app
# Check Sentry dashboard for error event
```

### Production Testing

After deployment with Sentry configured:

1. Visit https://acf-b2b-saas-session77.vercel.app
2. Intentionally trigger an error (e.g., invalid API call)
3. Check Sentry dashboard at https://sentry.io
4. Verify error appears within 1-2 minutes

---

## 📊 Current Configuration Summary

| Variable | Status | Environment | Public/Secret |
|----------|--------|-------------|---------------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ Configured | All | Public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Configured | All | Public |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Configured | All | Secret |
| NEXT_PUBLIC_APP_NAME | ✅ Configured | All | Public |
| NEXT_PUBLIC_SENTRY_DSN | ⏸️ Pending | All | Public |
| SENTRY_ORG | ⏸️ Pending | All | Public |
| SENTRY_PROJECT | ⏸️ Pending | All | Public |
| SENTRY_AUTH_TOKEN | ⏸️ Optional | Production | Secret |

---

## 🚀 Deployment Readiness

### Before Deployment (Optional - Sentry)

- [ ] Sentry account created
- [ ] Sentry project created (`acf-b2b-saas-session77`)
- [ ] Sentry DSN obtained
- [ ] Environment variables added to Vercel
- [ ] Redeployment triggered

### ✅ Can Deploy Without Sentry

**Important:** The application will work fine without Sentry configured. Sentry is optional monitoring.

- Sentry errors will be silent (no crashes)
- Application functionality unchanged
- You can add Sentry later without code changes

### After Adding Sentry Variables

- [ ] Visit production URL: https://acf-b2b-saas-session77.vercel.app
- [ ] Test error reporting by triggering an intentional error
- [ ] Check Sentry dashboard for error events
- [ ] Verify source maps uploaded (if SENTRY_AUTH_TOKEN configured)

---

## 📞 Support

### Sentry Documentation
- Getting Started: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Environment Variables: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#configure-environment-variables

### Vercel Documentation
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Deployments: https://vercel.com/docs/deployments/overview

---

**Next Steps:**
1. Create Sentry account (optional)
2. Add Sentry variables to Vercel (optional)
3. Proceed with Phase 3: Production Deployment (works with or without Sentry)
