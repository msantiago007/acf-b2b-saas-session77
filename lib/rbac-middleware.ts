/**
 * RBAC Middleware for Next.js API Routes
 * Generated: Session 76
 *
 * Provides role-based access control for multi-tenant B2B SaaS
 * Integrates with Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { hasPermission, hasRoleLevel, OrgRole, Permission } from './permissions'

// Types
interface User {
  id: string
  email: string
}

interface Membership {
  id: string
  organization_id: string
  user_id: string
  role: OrgRole
  organization?: Organization
}

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
}

// Extended NextRequest with auth context
export interface AuthenticatedRequest extends NextRequest {
  user?: User
  membership?: Membership
  org?: Organization
}

/**
 * Get authenticated user from request
 * Uses Supabase Auth session with proper SSR cookie handling
 *
 * @param req - Next.js request
 * @returns User object or null
 */
async function getUser(req: NextRequest): Promise<User | null> {
  // Create server client with proper cookie handling
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

  // Get user from session
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email!,
  }
}

/**
 * Get user's membership in organization
 *
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Membership object or null
 */
async function getMembership(userId: string, orgId: string): Promise<Membership | null> {
  // Initialize Supabase client (server-side, use service role for query)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Query membership
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    organization_id: data.organization_id,
    user_id: data.user_id,
    role: data.role as OrgRole,
    organization: data.organization as Organization,
  }
}

/**
 * Middleware factory: Require minimum role level
 * Returns 403 if user doesn't have sufficient role
 *
 * @param requiredRole - Minimum required role (viewer/member/admin/owner)
 * @returns Middleware function
 *
 * @example
 * export const POST = withRole('admin')(async (req, context) => {
 *   // Only admins and owners can access this route
 *   return NextResponse.json({ success: true })
 * })
 */
export function requireRole(requiredRole: OrgRole) {
  return function middleware(
    handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      // Get user from session
      const user = await getUser(req)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        )
      }

      // Get organization ID from route params
      const orgId = context.params.orgId
      if (!orgId) {
        return NextResponse.json(
          { error: 'Organization ID required' },
          { status: 400 }
        )
      }

      // Get membership
      const membership = await getMembership(user.id, orgId)
      if (!membership) {
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        )
      }

      // Check role level
      if (!hasRoleLevel(membership.role, requiredRole)) {
        return NextResponse.json(
          {
            error: `Requires ${requiredRole} role or higher`,
            userRole: membership.role,
            requiredRole,
          },
          { status: 403 }
        )
      }

      // Attach auth context to request
      const authReq = req as AuthenticatedRequest
      authReq.user = user
      authReq.membership = membership
      authReq.org = membership.organization

      // Call handler with authenticated request
      return handler(authReq, context)
    }
  }
}

/**
 * Middleware factory: Require specific permission
 * Returns 403 if user doesn't have the permission
 *
 * @param permission - Required permission
 * @returns Middleware function
 *
 * @example
 * export const DELETE = withPermission('delete')(async (req, context) => {
 *   // Only users with 'delete' permission can access
 *   return NextResponse.json({ success: true })
 * })
 */
export function requirePermission(permission: Permission) {
  return function middleware(
    handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      // Get user from session
      const user = await getUser(req)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        )
      }

      // Get organization ID from route params
      const orgId = context.params.orgId
      if (!orgId) {
        return NextResponse.json(
          { error: 'Organization ID required' },
          { status: 400 }
        )
      }

      // Get membership
      const membership = await getMembership(user.id, orgId)
      if (!membership) {
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        )
      }

      // Check permission
      if (!hasPermission(membership.role, permission)) {
        return NextResponse.json(
          {
            error: `Requires permission: ${permission}`,
            userRole: membership.role,
            requiredPermission: permission,
          },
          { status: 403 }
        )
      }

      // Attach auth context to request
      const authReq = req as AuthenticatedRequest
      authReq.user = user
      authReq.membership = membership
      authReq.org = membership.organization

      // Call handler with authenticated request
      return handler(authReq, context)
    }
  }
}

/**
 * Optional: Attach user context without requiring specific role/permission
 * Useful for routes that need user info but allow unauthenticated access
 *
 * @example
 * export const GET = withOptionalAuth(async (req, context) => {
 *   if (req.user) {
 *     // Authenticated user
 *   } else {
 *     // Anonymous user
 *   }
 * })
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const user = await getUser(req)
    const authReq = req as AuthenticatedRequest

    if (user && context.params?.orgId) {
      const membership = await getMembership(user.id, context.params.orgId)
      authReq.user = user
      authReq.membership = membership || undefined
      authReq.org = membership?.organization
    }

    return handler(authReq, context)
  }
}

/**
 * RBAC middleware with permission checking
 * Validates user authentication, membership, and permissions
 *
 * @param req - NextRequest object
 * @param orgId - Organization ID
 * @param permissions - Array of required permissions (user needs at least one)
 * @param callback - Callback function with auth context
 * @returns Response from callback or error response
 *
 * @example
 * return withRbac(req, params.orgId, ['read'], async (context) => {
 *   // context.user, context.membership, context.org are available
 *   return successResponse({ data: 'success' })
 * })
 */
export async function withRbac(
  req: NextRequest,
  orgId: string,
  permissions: Permission[],
  callback: (context: {
    user: User
    membership: Membership
    org: Organization
  }) => Promise<Response>
): Promise<Response> {
  // Get user from session
  const user = await getUser(req)
  if (!user) {
    throw new Error('Unauthorized - Please log in')
  }

  // Validate organization ID
  if (!orgId) {
    throw new Error('Organization ID required')
  }

  // Get membership
  const membership = await getMembership(user.id, orgId)
  if (!membership) {
    throw new Error('Not a member of this organization')
  }

  // Check if user has at least one of the required permissions
  const hasAnyPermission = permissions.some(permission =>
    hasPermission(membership.role, permission)
  )

  if (!hasAnyPermission) {
    throw new Error(
      `Requires one of these permissions: ${permissions.join(', ')}`
    )
  }

  // Call callback with auth context
  return callback({
    user,
    membership,
    org: membership.organization!,
  })
}
