# Developer Guide

**Version:** 1.0.0
**Created:** Session 80
**Audience:** Developers working on the B2B SaaS application

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Key Technologies](#key-technologies)
4. [Authentication Flow](#authentication-flow)
5. [RBAC Implementation](#rbac-implementation)
6. [Multi-Tenant Architecture](#multi-tenant-architecture)
7. [Common Development Tasks](#common-development-tasks)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Git installed
- Vercel account (for deployment)

### Local Development Setup

```bash
# 1. Clone repository
git clone <your-repo-url>
cd generated/b2b_saas

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 4. Run database migrations
# Open Supabase SQL Editor and run scripts in sql/ folder in order:
# - 00_organizations.sql
# - 01_users.sql
# - 02_rls_policies.sql
# - 03_organization_members.sql
# - 04_teams.sql
# - 05_users_sync_trigger.sql
# - 06_restore_foreign_keys.sql

# 5. Start development server
npm run dev

# 6. Open browser
open http://localhost:3000
```

### Verify Setup

1. Visit test pages: `http://localhost:3000/test/auth-check`
2. Login with test user (created in Session 79)
3. Verify API calls return data
4. Check console for errors

---

## Project Structure

```
generated/b2b_saas/
├── app/
│   ├── api/                      # API routes (server-side)
│   │   └── orgs/
│   │       └── [orgId]/
│   │           ├── route.ts      # Organization settings API
│   │           ├── members/
│   │           │   ├── route.ts       # List/invite members
│   │           │   └── [userId]/
│   │           │       └── route.ts   # Update/delete member
│   │           └── teams/
│   │               └── route.ts       # Team management
│   ├── test/                     # Test pages for manual testing
│   │   ├── auth-check/
│   │   ├── member-invite/
│   │   ├── member-role/
│   │   ├── org-settings/
│   │   └── team-create/
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── OrganizationSettingsForm.tsx
│   ├── MemberInviteForm.tsx
│   ├── MemberRoleForm.tsx
│   └── TeamCreationForm.tsx
├── lib/                          # Utilities and core logic
│   ├── api-error.ts              # Error handling utilities
│   ├── permissions.ts            # RBAC permission definitions
│   ├── rbac-middleware.ts        # Authentication & authorization
│   └── supabase.ts               # Supabase client config
├── sql/                          # Database migration scripts
│   ├── 00_organizations.sql
│   ├── 01_users.sql
│   ├── 02_rls_policies.sql
│   ├── 03_organization_members.sql
│   ├── 04_teams.sql
│   ├── 05_users_sync_trigger.sql
│   └── 06_restore_foreign_keys.sql
├── scripts/                      # Utility scripts
│   └── benchmark-zod.ts          # Performance testing
├── .env.local                    # Environment variables (gitignored)
├── API_DOCUMENTATION.md          # API reference
├── SCHEMA_DECISIONS.md           # Database design docs
├── TESTING_GUIDE.md              # Testing instructions
└── README.md                     # Project overview
```

---

## Key Technologies

### Frontend

- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zod** - Runtime validation

### Backend

- **Next.js API Routes** - Server-side APIs
- **Supabase** - Database + Auth
- **PostgreSQL** - Relational database
- **Row-Level Security (RLS)** - Multi-tenant isolation

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control
- **Vercel** - Deployment platform

---

## Authentication Flow

### Client-Side Authentication

```typescript
// Login
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Session is automatically stored in cookies
// All API routes will now have access to user session
```

### Server-Side Session Validation

```typescript
// In API route (lib/rbac-middleware.ts)
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set() {},
      remove() {},
    },
  }
)

const { data: { user } } = await supabase.auth.getUser()
```

### Authentication Architecture

```
┌─────────────┐
│   Client    │ Login via Supabase Auth
│  (Browser)  │ ──────────────────────►
└─────────────┘
                 Session cookie set ✓

┌─────────────┐
│   Client    │ API request with cookie
│  (Browser)  │ ──────────────────────►
└─────────────┘
                ┌──────────────────┐
                │  API Route       │ 1. Extract user from cookie
                │  + RBAC          │ 2. Check org membership
                │  Middleware      │ 3. Verify permissions
                └──────────────────┘
                         │
                         │ Authorized ✓
                         ▼
                ┌──────────────────┐
                │   Supabase DB    │ Service role query
                │  (Service Role)  │ (bypasses RLS)
                └──────────────────┘
```

---

## RBAC Implementation

### Permission System

Defined in `lib/permissions.ts`:

```typescript
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission =
  | 'read'                 // View data
  | 'write'                // Create/edit
  | 'delete'               // Delete resources
  | 'manage_team'          // Team management
  | 'manage_billing'       // Billing access
  | 'manage_org'           // Org settings
  | 'invite_members'       // Invite users
  | 'remove_members'       // Remove users
```

### Role Hierarchy

```
owner      ──► All permissions
  │
admin      ──► All except manage_billing, manage_org
  │
member     ──► read, write
  │
viewer     ──► read only
```

### Using RBAC in API Routes

```typescript
import { withRbac } from '@/lib/rbac-middleware'
import { successResponse } from '@/lib/api-error'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  return withRbac(req, params.orgId, ['read'], async (context) => {
    // context.user - authenticated user
    // context.membership - org membership
    // context.org - organization details

    // Your logic here
    return successResponse({ data: 'success' })
  })
}
```

### Permission Checks

```typescript
import { hasPermission } from '@/lib/permissions'

// Check if user has specific permission
if (hasPermission(userRole, 'manage_team')) {
  // Allow team management
}

// Check role level
if (hasRoleLevel(userRole, 'admin')) {
  // User is admin or owner
}
```

---

## Multi-Tenant Architecture

### RLS-Based Isolation

All tenant-scoped tables use Row-Level Security:

```sql
-- Organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON organizations
  FOR ALL
  USING (
    id = current_setting('app.current_organization_id', TRUE)::UUID
  );
```

### Service Role Bypass

API routes use service role key to bypass RLS:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Bypasses RLS
)

// Can query across all organizations
const { data } = await supabaseAdmin
  .from('organizations')
  .select('*')  // Returns ALL orgs
```

### Security Model

```
Client-side (Anon Key)
  │
  │  RLS blocks queries ❌
  │  Returns empty results
  │
  ▼
Server-side API (Service Key)
  │
  │  RLS bypassed ✓
  │  RBAC middleware validates permissions
  │
  ▼
Database
```

---

## Common Development Tasks

### Add a New API Route

**1. Create route file:**

```typescript
// app/api/orgs/[orgId]/new-feature/route.ts

import { NextRequest } from 'next/server'
import { withRbac } from '@/lib/rbac-middleware'
import { successResponse, handleApiError } from '@/lib/api-error'

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  return withRbac(req, params.orgId, ['read'], async (context) => {
    try {
      // Your logic here
      return successResponse({ data: 'success' })
    } catch (error) {
      return handleApiError(error)
    }
  })
}
```

**2. Add permissions check:**

Choose required permissions from `lib/permissions.ts`

**3. Add validation (if needed):**

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const validation = schema.safeParse(body)
if (!validation.success) {
  throw ApiErrors.validationError(
    validation.error.errors.map(e => e.message).join(', ')
  )
}
```

**4. Document in API_DOCUMENTATION.md**

**5. Test manually via test page**

**6. Deploy to Vercel**

---

### Add a New Form Component

**1. Create schema with Zod:**

```typescript
import { z } from 'zod'

export const myFormSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.number().positive(),
})

export type MyFormData = z.infer<typeof myFormSchema>
```

**2. Create form component:**

```typescript
'use client'

import { useState } from 'react'
import { MyFormData, myFormSchema } from '@/lib/schemas'

export function MyForm({ onSubmit }: { onSubmit: (data: MyFormData) => Promise<void> }) {
  const [formData, setFormData] = useState<MyFormData>({ ... })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = myFormSchema.safeParse(formData)

    if (!result.success) {
      // Map errors
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(newErrors)
      return
    }

    // Submit
    await onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

**3. Create test page:**

```typescript
// app/test/my-form/page.tsx

'use client'

import { MyForm } from '@/components/MyForm'

export default function TestMyForm() {
  const handleSubmit = async (data: MyFormData) => {
    const response = await fetch('/api/orgs/[orgId]/my-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    console.log('Result:', result)
  }

  return <MyForm onSubmit={handleSubmit} />
}
```

**4. Test and iterate**

---

### Add a Database Migration

**1. Create SQL file:**

```sql
-- sql/07_new_table.sql

CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS if tenant-scoped
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON new_table
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', TRUE)::UUID
  );

-- Add indexes
CREATE INDEX new_table_organization_id_idx ON new_table(organization_id);

-- Add comments
COMMENT ON TABLE new_table IS 'Description of table purpose';
```

**2. Run in Supabase SQL Editor**

**3. Update schema documentation in SCHEMA_DECISIONS.md**

**4. Add TypeScript types**

**5. Create API routes for new table**

---

## Testing

### Manual Testing

**Test pages available at:**
- `/test/auth-check` - Authentication flow
- `/test/org-settings` - Organization settings form
- `/test/team-create` - Team creation form
- `/test/member-role` - Member role update form
- `/test/member-invite` - Member invitation form

**Testing workflow:**
1. Login via auth-check page
2. Navigate to specific test page
3. Submit form and verify response
4. Check browser console for errors
5. Verify database changes in Supabase dashboard

### Performance Testing

```bash
npm run benchmark:zod
```

Runs Zod validation performance benchmarks.

### Integration Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

---

## Deployment

### Vercel Deployment

**Automatic:**
- Push to `main` branch
- Vercel auto-deploys
- Check deployment logs for errors

**Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`
**Development Command:** `npm run dev`

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to Vercel
vercel --prod
```

---

## Troubleshooting

### Common Issues

#### Build Fails with "Module not found"

**Fix:**
```bash
npm install <missing-package>
git add package.json package-lock.json
git commit -m "fix: add missing dependency"
git push
```

#### API Returns 401 Unauthorized

**Cause:** Not logged in or session expired

**Fix:**
1. Visit `/test/auth-check`
2. Login with test credentials
3. Retry API call

#### API Returns 403 Forbidden

**Cause:** Insufficient permissions

**Fix:**
1. Check user role in organization
2. Verify permission requirements in API route
3. Update user role if needed

#### RLS Blocks Client-Side Query

**Cause:** Using anon key with RLS-enabled table

**Fix:**
Create server-side API route that uses service role key

#### Foreign Key Violation

**Cause:** Referencing non-existent record

**Fix:**
1. Ensure referenced record exists
2. Check foreign key constraints
3. Review SCHEMA_DECISIONS.md

#### Zod Validation Fails

**Cause:** Invalid data format

**Fix:**
1. Check error message for specific field
2. Verify schema definition
3. Update form validation

---

## Best Practices

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use async/await (not .then)
- Handle errors with try/catch
- Log important operations

### API Routes

- Always use RBAC middleware
- Validate input with Zod
- Use error handling utilities
- Log requests for debugging
- Return consistent response formats

### Forms

- Use Zod for validation
- Show clear error messages
- Disable submit during loading
- Reset form after success
- Handle network errors

### Database

- Use RLS for multi-tenant tables
- Add indexes on foreign keys
- Document schema decisions
- Test migrations locally first
- Never expose service role key

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [API Documentation](API_DOCUMENTATION.md)
- [Schema Decisions](SCHEMA_DECISIONS.md)
- [Testing Guide](TESTING_GUIDE.md)

---

**Happy coding! 🚀**

If you encounter issues not covered here, check the troubleshooting section or reach out to the team.
