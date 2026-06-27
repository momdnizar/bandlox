import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AdminRole } from './types'
import { ROLE_HIERARCHY, PERMISSION_MIN_ROLE } from './types'

/**
 * Create a Supabase admin client with the service role key.
 * Use this in API routes after verifying the user is authenticated.
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Verify that the request is from an authenticated admin user.
 * Checks the auth token from the Authorization header or cookie.
 *
 * This is used in API routes (/api/admin/*) where middleware.ts
 * has already verified the user is authenticated.
 * We use the service client to check admin_users.
 */
export async function verifyAdminRequest(request: Request): Promise<
  | { authenticated: false; response: NextResponse }
  | { authenticated: true; userId: string; role: AdminRole }
> {
  const authHeader = request.headers.get('authorization')
  const supabase = getServiceClient()

  let userId: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }
    userId = user.id
  } else {
    // Check cookie-based session (Next.js SSR)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }
    userId = user.id
  }

  // Check if user is in admin_users
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (adminError || !admin) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    }
  }

  return {
    authenticated: true,
    userId,
    role: admin.role as AdminRole,
  }
}

/**
 * Require a specific role in an API route.
 * Returns a 403 response if the user's role is insufficient.
 */
export function requireApiRole(role: AdminRole, minRole: AdminRole): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(role)
  const minIndex = ROLE_HIERARCHY.indexOf(minRole)
  return roleIndex >= minIndex
}

/**
 * Require a specific permission in an API route.
 * Returns a 403 response if the user's role is insufficient.
 */
export function checkApiPermission(role: AdminRole, permission: string): boolean {
  const minRole = PERMISSION_MIN_ROLE[permission]
  if (!minRole) return false
  return requireApiRole(role, minRole)
}