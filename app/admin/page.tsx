import { getAdminSession } from '@/lib/admin/auth'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | Bandlox Admin',
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession()

  if (!session) {
    return null // layout redirects
  }

  const { admin, user } = session

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Orders Card */}
        <Link
          href="/admin/orders"
          className="block border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors"
        >
          <h2 className="text-sm font-semibold text-white uppercase tracking-[0.1em]">
            Orders
          </h2>
          <p className="mt-2 text-xs text-zinc-400">
            View and manage customer orders, update statuses, and track shipments.
          </p>
        </Link>

        {/* Products Card — visible to admin and super_admin */}
        {admin.role !== 'staff' && (
          <Link
            href="/admin/products"
            className="block border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors"
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-[0.1em]">
              Products
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Manage your product catalog, inventory, and media.
            </p>
          </Link>
        )}

        {/* Users Card — only super_admin */}
        {admin.role === 'super_admin' && (
          <Link
            href="/admin/users"
            className="block border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors"
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-[0.1em]">
              Admin Users
            </h2>
            <p className="mt-2 text-xs text-zinc-400">
              Manage admin accounts, roles, and permissions.
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}