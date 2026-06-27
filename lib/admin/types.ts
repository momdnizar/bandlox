export type AdminRole = 'super_admin' | 'admin' | 'staff'

export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  created_at: string
  updated_at: string
}

export interface AdminSession {
  user: {
    id: string
    email: string
  }
  admin: AdminUser
}

/**
 * Hierarchical permissions map.
 * Each role inherits permissions from roles below it.
 * Add new permission keys here as the app grows.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  staff: [
    'orders:read',
    'orders:update_status',
  ],
  admin: [
    'orders:read',
    'orders:update_status',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'media:upload',
    'media:delete',
  ],
  super_admin: [
    'orders:read',
    'orders:update_status',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'media:upload',
    'media:delete',
    'admin:users:read',
    'admin:users:invite',
    'admin:users:update_role',
    'admin:users:remove',
    'admin:settings:read',
    'admin:settings:update',
  ],
}

/**
 * Minimum role required for each permission.
 * Used by hasPermission() to avoid iterating all permissions.
 */
export const PERMISSION_MIN_ROLE: Record<string, AdminRole> = {
  'orders:read': 'staff',
  'orders:update_status': 'staff',
  'products:read': 'admin',
  'products:create': 'admin',
  'products:update': 'admin',
  'products:delete': 'admin',
  'media:upload': 'admin',
  'media:delete': 'admin',
  'admin:users:read': 'super_admin',
  'admin:users:invite': 'super_admin',
  'admin:users:update_role': 'super_admin',
  'admin:users:remove': 'super_admin',
  'admin:settings:read': 'super_admin',
  'admin:settings:update': 'super_admin',
}

/**
 * Role hierarchy for comparison.
 * Higher index = more privileged.
 */
export const ROLE_HIERARCHY: AdminRole[] = ['staff', 'admin', 'super_admin']