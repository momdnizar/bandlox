import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin/auth'
import AdminHeader from './AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin session on the server side
  const session = await getAdminSession()

  // If not authenticated, the middleware should already redirect,
  // but this is a safety net for server components.
  if (!session) {
    redirect('/admin/login')
  }

  const { admin } = session

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader
        email={session.user.email}
        role={admin.role}
      />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-4rem)] border-r border-zinc-800 flex-shrink-0 hidden md:block">
          <nav className="p-4 space-y-1">
            <SidebarLink href="/admin" label="Dashboard" exact />
            <SidebarLink href="/admin/orders" label="Orders" />
            {admin.role !== 'staff' && (
              <SidebarLink href="/admin/products" label="Products" />
            )}
            {admin.role === 'super_admin' && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 px-3">
                    Admin
                  </p>
                </div>
                <SidebarLink href="/admin/users" label="Manage Users" />
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  label,
  exact,
}: {
  href: string
  label: string
  exact?: boolean
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors"
    >
      {label}
    </Link>
  )
}