# Database Schema Design Decisions

**Created:** Session 80
**Last Updated:** 2025-12-13

---

## Table of Contents

1. [Users Table Design](#users-table-design)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Foreign Key Relationships](#foreign-key-relationships)
4. [RLS Policies](#rls-policies)
5. [Indexes and Performance](#indexes-and-performance)

---

## Users Table Design

### Decision: Separate `users` Table as Bridge

**Context:** We maintain a separate `users` table in the public schema as a bridge between `auth.users` (Supabase Auth) and `organization_members`.

### Rationale

**Why not reference `auth.users` directly?**

1. **Schema Isolation:** `auth.users` is in the `auth` schema (managed by Supabase), while our tables are in `public` schema
2. **Foreign Key Constraints:** Direct foreign keys to `auth.users` create coupling with Supabase's internal schema
3. **Data Portability:** If we migrate away from Supabase Auth, we don't need to restructure organization relationships
4. **Additional Metadata:** The `users` table can store application-specific user data separate from authentication

**Structure:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- Matches auth.users.id
  email TEXT,           -- Cached from auth.users.email
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Synchronization Strategy

**Current State (Manual):**
- Users are manually inserted into `users` table when created in `auth.users`
- Email is cached to avoid JOIN queries to `auth.users`

**Future Enhancement (Auto-Sync):**

Implement trigger-based synchronization:

```sql
-- Trigger function to sync auth.users to users table
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert/update
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user();
```

**Note:** This trigger requires `SECURITY DEFINER` to allow `public` schema functions to access `auth` schema.

### When to Query Each Table

| Use Case | Table | Reason |
|----------|-------|--------|
| Organization membership lookup | `users` | Fast lookup, no cross-schema query |
| Display user list in org | `users` | Email cached, single query |
| Authentication check | `auth.users` | Handled by Supabase Auth SDK |
| User metadata (profile, settings) | `users` | Application-specific data |

---

## Multi-Tenant Architecture

### RLS-Based Tenant Isolation

**Design:** Row-Level Security (RLS) policies enforce multi-tenant data isolation at the database level.

### Policy Pattern

All tenant-scoped tables use this pattern:

```sql
-- Example: organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation"
  ON organizations
  FOR ALL
  USING (
    id = current_setting('app.current_organization_id', TRUE)::UUID
  );
```

### Benefits

1. **Security at Database Layer:** Cannot be bypassed by application bugs
2. **Consistent Enforcement:** All queries automatically filtered
3. **No Query Modification:** Application code doesn't need `WHERE organization_id = ...`
4. **Audit Trail:** RLS violations are logged by Postgres

### Trade-offs

**✅ Pros:**
- Strong security guarantees
- Prevents accidental cross-tenant data leaks
- Simplifies application code

**⚠️ Cons:**
- Requires service role key for admin operations
- Client-side queries with anon key return empty results
- Need server-side API routes for tenant-scoped operations

**Solution:** All admin operations (org settings, member management) use server-side API routes with service role key.

---

## Foreign Key Relationships

### Current Foreign Keys

```sql
-- organization_members → organizations
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE;

-- organization_members → users (RESTORED in Session 80)
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- teams → organizations
ALTER TABLE teams
  ADD CONSTRAINT teams_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE;
```

### Cascade Behavior

**`ON DELETE CASCADE`** ensures:
- Deleting an organization removes all members and teams
- Deleting a user removes all their organization memberships
- No orphaned records

### Why `users` Table Foreign Key Was Temporarily Dropped

**Session 79 Issue:** The `organization_members` table had a foreign key pointing to `users` table which didn't exist initially.

**Resolution:**
1. Created `users` table (Session 79)
2. Populated with auth users (Session 79)
3. Restored foreign key constraint (Session 80)

This maintains referential integrity while allowing flexibility in user management.

---

## RLS Policies

### Tables with RLS Enabled

| Table | RLS Enabled | Reason |
|-------|-------------|--------|
| `organizations` | ✅ Yes | Tenant isolation |
| `organization_members` | ✅ Yes | Tenant isolation |
| `teams` | ❌ No | Cross-org visibility needed |
| `users` | ❌ No | Bridge table, no sensitive data |

### Organizations Table Policies

```sql
-- Read: Only see your own organization
CREATE POLICY "organizations_select_policy"
  ON organizations
  FOR SELECT
  USING (
    id = current_setting('app.current_organization_id', TRUE)::UUID
  );

-- Update: Only modify your own organization
CREATE POLICY "organizations_update_policy"
  ON organizations
  FOR UPDATE
  USING (
    id = current_setting('app.current_organization_id', TRUE)::UUID
  );
```

### Organization Members Table Policies

```sql
-- Read: Only see members of your organization
CREATE POLICY "organization_members_select_policy"
  ON organization_members
  FOR SELECT
  USING (
    organization_id = current_setting('app.current_organization_id', TRUE)::UUID
  );

-- Insert: Only add members to your organization
CREATE POLICY "organization_members_insert_policy"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.current_organization_id', TRUE)::UUID
  );
```

### Service Role Bypass

**Service role key bypasses all RLS policies.** This is intentional:
- Allows admin operations via API routes
- Enables cross-tenant analytics
- Supports system maintenance tasks

**Security:** Service role key is kept secret, only used server-side in API routes protected by RBAC middleware.

---

## Indexes and Performance

### Current Indexes

```sql
-- Primary keys (automatic indexes)
CREATE INDEX IF NOT EXISTS organizations_pkey ON organizations(id);
CREATE INDEX IF NOT EXISTS organization_members_pkey ON organization_members(id);
CREATE INDEX IF NOT EXISTS teams_pkey ON teams(id);
CREATE INDEX IF NOT EXISTS users_pkey ON users(id);

-- Foreign keys (for join performance)
CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx
  ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
  ON organization_members(user_id);

CREATE INDEX IF NOT EXISTS teams_organization_id_idx
  ON teams(organization_id);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_key
  ON organizations(slug);

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user_key
  ON organization_members(organization_id, user_id);
```

### Index Strategy

1. **Primary Keys:** All tables have UUID primary keys with automatic indexes
2. **Foreign Keys:** Indexed for fast JOIN queries
3. **Unique Constraints:** Enforce business rules (slug uniqueness, one membership per user/org)
4. **No Over-Indexing:** Avoid indexes on low-cardinality columns (role, plan) that are rarely queried alone

### Query Performance Targets

| Query Type | Target | Status |
|------------|--------|--------|
| Organization lookup by ID | < 5ms | ✅ Met |
| Member list for org | < 10ms | ✅ Met |
| Team list for org | < 10ms | ✅ Met |
| User membership lookup | < 5ms | ✅ Met |

---

## Design Principles

### 1. Security First
- RLS at database layer
- Foreign keys enforce referential integrity
- Service role key used only server-side

### 2. Performance Second
- Indexes on all foreign keys
- Cached email in users table (avoid auth schema JOINs)
- Minimal over-indexing

### 3. Maintainability Third
- Clear separation between auth and app data
- Cascade deletes prevent orphaned records
- Triggers for automatic synchronization

### 4. Portability Last
- Users table allows migration away from Supabase Auth
- Schema owned by application, not auth provider
- Clear documentation for future migrations

---

## Future Enhancements

### Short Term (Sessions 81-85)

- [ ] Add auto-sync trigger for `auth.users` → `users`
- [ ] Add composite indexes for complex queries
- [ ] Add soft delete support (deleted_at columns)
- [ ] Add audit logging tables

### Medium Term (Sessions 86-90)

- [ ] Add materialized views for analytics
- [ ] Implement database connection pooling
- [ ] Add read replicas for scaling
- [ ] Optimize RLS policies with caching

### Long Term (Sessions 91-100)

- [ ] Multi-region database support
- [ ] Advanced security (encryption at rest)
- [ ] Performance monitoring and alerting
- [ ] Automated schema migration system

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [Session 79 Test Results](TEST_RESULTS_SESSION79.md)
- [B2B SaaS Data Model](../../B2B_SAAS_DATA_MODEL.md)

---

**Document Status:** ✅ COMPLETE
**Next Review:** Session 85
