/**
 * RBAC Permission Constants
 * Generated: Session 76
 *
 * Defines role hierarchy and permission mapping for multi-tenant B2B SaaS
 */

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'manage_team'
  | 'manage_billing'
  | 'manage_org'
  | 'invite_members'
  | 'remove_members'

/**
 * Role hierarchy (higher number = more privileges)
 * Used to check if user has sufficient role level
 */
export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
}

/**
 * Permission matrix - maps roles to their allowed permissions
 * Follows principle of least privilege
 */
export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  viewer: [
    'read',
  ],
  member: [
    'read',
    'write',
  ],
  admin: [
    'read',
    'write',
    'delete',
    'manage_team',
    'invite_members',
    'remove_members',
  ],
  owner: [
    'read',
    'write',
    'delete',
    'manage_team',
    'manage_billing',
    'manage_org',
    'invite_members',
    'remove_members',
  ],
}

/**
 * Check if a role has a specific permission
 *
 * @param role - User's role in the organization
 * @param permission - Required permission
 * @returns true if role has permission
 *
 * @example
 * hasPermission('admin', 'manage_team') // true
 * hasPermission('member', 'manage_team') // false
 */
export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if user role meets minimum required role level
 * Uses role hierarchy (viewer < member < admin < owner)
 *
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns true if user has sufficient role level
 *
 * @example
 * hasRoleLevel('owner', 'admin') // true (owner >= admin)
 * hasRoleLevel('member', 'admin') // false (member < admin)
 */
export function hasRoleLevel(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Get all permissions for a role
 *
 * @param role - Organization role
 * @returns Array of permissions
 */
export function getRolePermissions(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  read: 'View organization data and resources',
  write: 'Create and edit resources',
  delete: 'Delete resources',
  manage_team: 'Manage teams and team members',
  manage_billing: 'Access and modify billing settings',
  manage_org: 'Modify organization settings and structure',
  invite_members: 'Invite new members to the organization',
  remove_members: 'Remove members from the organization',
}

/**
 * Role descriptions for UI display
 */
export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  viewer: 'Can view organization data but cannot make changes',
  member: 'Can view and create resources within their teams',
  admin: 'Can manage teams and members, full access except billing',
  owner: 'Full access to all organization features and settings',
}
