# B2B SaaS API Documentation

**Version:** 1.0.0
**Created:** Session 80
**Last Updated:** 2025-12-13

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Organization Settings API](#organization-settings-api)
4. [Member Management API](#member-management-api)
5. [Team Management API](#team-management-api)
6. [Common Response Formats](#common-response-formats)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Authentication

All API routes require authentication via Supabase Auth session cookies.

### Authentication Flow

1. User logs in via Supabase Auth (client-side)
2. Session cookie is set automatically
3. API routes validate session and extract user ID
4. RBAC middleware checks organization membership and permissions

### Required Cookies

```
sb-<project-id>-auth-token
sb-<project-id>-auth-token-code-verifier
```

### Unauthenticated Requests

**Response:**
```json
{
  "error": {
    "message": "Unauthorized - Please log in",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

---

## Error Handling

All API routes use consistent error response format.

### Error Response Format

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_MEMBER` | 403 | Not a member of organization |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `PERMISSION_DENIED` | 403 | Specific permission required |
| `CANNOT_REMOVE_SELF` | 400 | Cannot remove own membership |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Organization Settings API

### Base URL

```
/api/orgs/:orgId
```

### Get Organization

**Endpoint:** `GET /api/orgs/:orgId`

**Required Permission:** `read`

**Description:** Fetches organization details including name, slug, plan, and settings.

**Example Request:**
```bash
curl -X GET https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001 \
  -H "Cookie: sb-<project>-auth-token=..."
```

**Success Response (200):**
```json
{
  "data": {
    "organization": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "plan": "pro",
      "settings": {
        "features": {
          "analytics": true,
          "api_access": true
        }
      },
      "created_at": "2025-12-13T07:01:14.522127+00:00",
      "updated_at": "2025-12-13T07:01:14.522127+00:00"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not a member of organization
- `404 Not Found` - Organization doesn't exist

---

### Update Organization

**Endpoint:** `PUT /api/orgs/:orgId`

**Required Permission:** `manage_org` (owner only)

**Description:** Updates organization settings (name, plan, settings JSON).

**Request Body:**
```json
{
  "name": "Acme Corporation Updated",
  "plan": "enterprise",
  "settings": {
    "features": {
      "analytics": true,
      "api_access": true,
      "custom_branding": true
    }
  }
}
```

**Validation Rules:**
- `name`: Optional string, min 1 character
- `plan`: Optional enum (`free`, `pro`, `enterprise`)
- `settings`: Optional JSON object

**Example Request:**
```bash
curl -X PUT https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001 \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=..." \
  -d '{
    "name": "Acme Corporation Updated",
    "plan": "enterprise"
  }'
```

**Success Response (200):**
```json
{
  "data": {
    "organization": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Acme Corporation Updated",
      "slug": "acme-corp",
      "plan": "enterprise",
      "settings": { ... },
      "created_at": "2025-12-13T07:01:14.522127+00:00",
      "updated_at": "2025-12-13T15:30:00.000000+00:00"
    }
  },
  "message": "Organization updated successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an owner
- `400 Bad Request` - Validation error
- `404 Not Found` - Organization doesn't exist

---

## Member Management API

### Base URL

```
/api/orgs/:orgId/members
```

### List Members

**Endpoint:** `GET /api/orgs/:orgId/members`

**Required Permission:** `read`

**Description:** Lists all members in the organization with their roles and email.

**Example Request:**
```bash
curl -X GET https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/members \
  -H "Cookie: sb-<project>-auth-token=..."
```

**Success Response (200):**
```json
{
  "data": {
    "members": [
      {
        "id": "6dc293a0-5b7e-4c61-b3fb-0214e4a0f4db",
        "user_id": "6dc293a0-5b7e-4c61-b3fb-0214e4a0f4db",
        "email": "owner@acme-test.com",
        "role": "owner",
        "created_at": "2025-12-13T07:01:14.522127+00:00"
      },
      {
        "id": "34069a66-c0e6-4784-9124-4212a7b0324c",
        "user_id": "34069a66-c0e6-4784-9124-4212a7b0324c",
        "email": "admin@acme-test.com",
        "role": "admin",
        "created_at": "2025-12-13T07:01:14.522127+00:00"
      }
    ],
    "count": 2
  }
}
```

---

### Invite Member

**Endpoint:** `POST /api/orgs/:orgId/members`

**Required Permission:** `invite_members` (admin+)

**Description:** Invites a new member to the organization. Creates auth user if doesn't exist.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member",
  "message": "Welcome to Acme Corp!" // Optional
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `role`: Required enum (`owner`, `admin`, `member`, `viewer`)
- `message`: Optional string for invitation message

**Example Request:**
```bash
curl -X POST https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/members \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=..." \
  -d '{
    "email": "newuser@example.com",
    "role": "member",
    "message": "Welcome to the team!"
  }'
```

**Success Response (201):**
```json
{
  "data": {
    "member": {
      "id": "a1b2c3d4-...",
      "user_id": "a1b2c3d4-...",
      "email": "newuser@example.com",
      "role": "member",
      "created_at": "2025-12-13T15:30:00.000000+00:00"
    }
  },
  "message": "Member invited successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Missing `invite_members` permission
- `400 Bad Request` - Validation error
- `409 Conflict` - User already a member

**Behavior:**
- If user exists in auth system: adds to organization
- If user doesn't exist: creates auth user + adds to organization
- Auto-confirms email for testing (configure in production)

---

### Update Member Role

**Endpoint:** `PUT /api/orgs/:orgId/members/:userId`

**Required Permission:** `invite_members` (admin+)

**Description:** Updates a member's role in the organization.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Validation Rules:**
- `role`: Required enum (`owner`, `admin`, `member`, `viewer`)

**Example Request:**
```bash
curl -X PUT https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/members/34069a66-c0e6-4784-9124-4212a7b0324c \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=..." \
  -d '{
    "role": "admin"
  }'
```

**Success Response (200):**
```json
{
  "data": {
    "member": {
      "id": "34069a66-c0e6-4784-9124-4212a7b0324c",
      "user_id": "34069a66-c0e6-4784-9124-4212a7b0324c",
      "email": "admin@acme-test.com",
      "role": "admin",
      "created_at": "2025-12-13T07:01:14.522127+00:00"
    }
  },
  "message": "Member role updated successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Missing `invite_members` permission
- `400 Bad Request` - Validation error
- `404 Not Found` - Member not found

---

### Remove Member

**Endpoint:** `DELETE /api/orgs/:orgId/members/:userId`

**Required Permission:** `remove_members` (admin+)

**Description:** Removes a member from the organization. Cannot remove yourself.

**Example Request:**
```bash
curl -X DELETE https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/members/34069a66-c0e6-4784-9124-4212a7b0324c \
  -H "Cookie: sb-<project>-auth-token=..."
```

**Success Response (200):**
```json
{
  "data": {
    "userId": "34069a66-c0e6-4784-9124-4212a7b0324c"
  },
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Missing `remove_members` permission
- `400 Bad Request` - Cannot remove yourself
- `404 Not Found` - Member not found

**Behavior:**
- Removes from organization only (doesn't delete auth user)
- Cannot remove your own membership
- Deletes membership record immediately

---

## Team Management API

### Base URL

```
/api/orgs/:orgId/teams
```

### List Teams

**Endpoint:** `GET /api/orgs/:orgId/teams`

**Required Permission:** `read`

**Description:** Lists all teams in the organization.

**Example Request:**
```bash
curl -X GET https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams \
  -H "Cookie: sb-<project>-auth-token=..."
```

**Success Response (200):**
```json
{
  "teams": [
    {
      "id": "17d70214-5c0a-4d4a-9c8c-6e3c027d3001",
      "organization_id": "00000000-0000-0000-0000-000000000001",
      "name": "Engineering",
      "created_at": "2025-12-13T07:01:14.522127+00:00",
      "updated_at": "2025-12-13T07:01:14.522127+00:00"
    }
  ],
  "organization": { ... },
  "user": {
    "id": "6dc293a0-5b7e-4c61-b3fb-0214e4a0f4db",
    "role": "owner"
  }
}
```

---

### Create Team

**Endpoint:** `POST /api/orgs/:orgId/teams`

**Required Permission:** `manage_team` (admin+)

**Description:** Creates a new team in the organization.

**Request Body:**
```json
{
  "name": "Marketing"
}
```

**Validation Rules:**
- `name`: Required string

**Example Request:**
```bash
curl -X POST https://your-app.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=..." \
  -d '{
    "name": "Marketing"
  }'
```

**Success Response (201):**
```json
{
  "team": {
    "id": "a1b2c3d4-...",
    "organization_id": "00000000-0000-0000-0000-000000000001",
    "name": "Marketing",
    "created_at": "2025-12-13T15:30:00.000000+00:00",
    "updated_at": "2025-12-13T15:30:00.000000+00:00"
  }
}
```

---

## Common Response Formats

### Success Response

```json
{
  "data": { ... },           // Optional response data
  "message": "Success message" // Optional success message
}
```

### Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

---

## Rate Limiting

**Current Status:** Not implemented

**Future Enhancement:** Add rate limiting to prevent abuse

**Planned Limits:**
- 100 requests/minute per user
- 1000 requests/hour per organization
- Burst allowance: 20 requests/second

---

## Examples

### Complete Authentication Flow

```typescript
// 1. Login user (client-side)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'owner@acme-test.com',
  password: 'TestPass123!'
})

// 2. Call API route (automatically includes session cookie)
const response = await fetch('/api/orgs/00000000-0000-0000-0000-000000000001/members')
const result = await response.json()

if (!response.ok) {
  console.error('Error:', result.error.message)
} else {
  console.log('Members:', result.data.members)
}
```

### Error Handling Pattern

```typescript
async function callApi(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      // Handle API error
      throw new Error(result.error?.message || 'API request failed')
    }

    return result.data
  } catch (error) {
    // Handle network error
    console.error('Request failed:', error)
    throw error
  }
}

// Usage
const members = await callApi('/api/orgs/00000000-0000-0000-0000-000000000001/members')
```

### Permission-Based UI

```typescript
// Check user permission before showing UI
const currentUser = {
  role: 'admin', // From API or context
}

const canManageMembers = hasPermission(currentUser.role, 'invite_members')

return (
  <div>
    {canManageMembers && (
      <button onClick={inviteMember}>Invite Member</button>
    )}
  </div>
)
```

---

## Security Considerations

### Service Role Key

- **Never expose service role key client-side**
- Only used in API routes server-side
- Bypasses all RLS policies
- Grants full database access

### RBAC Middleware

- All routes protected by `withRbac` middleware
- Validates authentication, membership, and permissions
- Returns 401/403 if checks fail
- Injects context into route handlers

### RLS Policies

- All tenant-scoped tables have RLS enabled
- Client-side queries with anon key blocked by RLS
- Service role bypasses RLS for admin operations
- See [SCHEMA_DECISIONS.md](SCHEMA_DECISIONS.md) for details

---

## Performance Targets

| Operation | Target | Status |
|-----------|--------|--------|
| GET /members | < 50ms | ✅ Met |
| POST /members | < 100ms | ✅ Met |
| PUT /members/:id | < 50ms | ✅ Met |
| DELETE /members/:id | < 50ms | ✅ Met |
| GET /orgs/:id | < 30ms | ✅ Met |
| PUT /orgs/:id | < 50ms | ✅ Met |
| GET /teams | < 50ms | ✅ Met |
| POST /teams | < 100ms | ✅ Met |

---

## Changelog

### v1.0.0 (Session 80 - 2025-12-13)

- ✅ Added Member Management API (GET, POST, PUT, DELETE)
- ✅ Added Organization Settings API (GET, PUT)
- ✅ Implemented `withRbac` middleware for permission checks
- ✅ Created API error handling utilities
- ✅ Documented all endpoints with examples
- ✅ Deployed to production

---

## References

- [RBAC Middleware](lib/rbac-middleware.ts)
- [API Error Utilities](lib/api-error.ts)
- [Permission System](lib/permissions.ts)
- [Schema Documentation](SCHEMA_DECISIONS.md)
- [Testing Guide](TESTING_GUIDE.md)

---

**Status:** ✅ COMPLETE
**Version:** 1.0.0
**Next Update:** Session 85
