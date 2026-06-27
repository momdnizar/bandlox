import { getAdminSession, requirePermission } from '@/lib/admin/auth'

export const metadata = {
  title: 'Products | Bandlox Admin',
}

export default async function AdminProductsPage() {
  // Server-side RBAC: require products:read
  // This will redirect to /admin/login if not authenticated
  // or to /admin if the user lacks permission
  const session = await requirePermission('products:read')

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
            Products
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your product catalog
          </p>
        </div>

        {/* Only show Add Product if user can create products */}
        {session.admin.role !== 'staff' && (
          <button className="bg-white text-black px-4 py-2 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-zinc-200 transition-colors">
            Add Product
          </button>
        )}
      </div>

      {/* Product list placeholder */}
      <div className="border border-zinc-800 rounded-lg">
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-500">
            Product management interface will be built here.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            This page requires the products:read permission.
          </p>
        </div>
      </div>
    </div>
  )
}