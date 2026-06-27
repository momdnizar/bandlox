'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AdminRole, AdminSession, AdminUser } from './types'
import { hasRole, hasPermission } from './permissions'

/**
 * Get the current admin session.
 * Returns null if the user is not authenticated or not in admin_users.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (adminError || !admin) {
    return null
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
    },
    admin: admin as AdminUser,
  }
}

/**
 * Require an admin session. Redirects to /admin/login if not authenticated.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return session
}

/**
 * Require a minimum role. Redirects to /admin if the user lacks permissions.
 * Call after requireAdmin().
 */
export async function requireRole(minRole: AdminRole): Promise<AdminSession> {
  const session = await requireAdmin()

  if (!hasRole(session.admin.role, minRole)) {
    redirect('/admin')
  }

  return session
}

/**
 * Require a specific permission. Redirects to /admin if the user lacks it.
 * Call after requireAdmin().
 */
export async function requirePermission(permission: string): Promise<AdminSession> {
  const session = await requireAdmin()

  if (!hasPermission(session.admin.role, permission)) {
    redirect('/admin')
  }

  return session
}

/**
 * Sign in as an admin user.
 * Returns null on failure, or the AdminSession on success.
 */
export async function adminLogin(email: string, password: string): Promise<{ error?: string; session?: AdminSession }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Invalid email or password.' }
  }

  // Check if user is in admin_users
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', data.user.id)
    .single()

  if (adminError || !admin) {
    // Sign them back out to prevent non-admin access
    await supabase.auth.signOut()
    return { error: 'Access denied. You do not have admin privileges.' }
  }

  return {
    session: {
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
      },
      admin: admin as AdminUser,
    },
  }
}

/**
 * Sign out the current admin user.
 */
export async function adminLogout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}