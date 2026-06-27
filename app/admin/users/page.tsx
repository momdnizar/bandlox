import { requireRole } from '@/lib/admin/auth'

export const metadata = {
  title: 'Admin Users | Bandlox Admin',
}

export default async function AdminUsersPage() {
  // Server-side RBAC: only super_admin can access this page
  const session = await requireRole('super_admin')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
          Admin Users
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage admin accounts and roles
        </p>
      </div>

      <div className="border border-zinc-800 rounded-lg">
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-500">
            Admin user management interface.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            This page is only accessible to super_admin users.
          </p>
        </div>
      </div>
    </div>
  )
}