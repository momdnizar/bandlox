import type { AdminRole } from './types'
import { ROLE_HIERARCHY, PERMISSION_MIN_ROLE } from './types'

/**
 * Check if a user's role meets the minimum required role.
 */
export function hasRole(role: AdminRole, minRole: AdminRole): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(role)
  const minIndex = ROLE_HIERARCHY.indexOf(minRole)
  return roleIndex >= minIndex
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const minRole = PERMISSION_MIN_ROLE[permission]
  if (!minRole) {
    return false
  }
  return hasRole(role, minRole)
}