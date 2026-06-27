import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware that protects admin routes and refreshes Supabase sessions.
 *
 * - Refreshes the Supabase auth session on every request (required for SSR).
 * - Redirects unauthenticated users to /admin/login for admin routes.
 * - Allows public routes (/, /products, /auth, /api/checkout, etc.) without auth.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this also sets/clears cookies
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // === Admin Route Protection ===
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')
  const isAdminLoginPage = pathname === '/admin/login'

  // Allow the login page itself to load without auth
  if (isAdminRoute && !isAdminLoginPage && !user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /api/admin/* routes
  if (isAdminApiRoute && !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // If user is logged in and hits /admin/login, redirect to /admin
  if (isAdminLoginPage && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/admin'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Apply to admin routes and API admin routes
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}