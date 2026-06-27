'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { signout } from '@/lib/actions/auth'
import type { Order } from './page'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'text-yellow-400'
    case 'processing':
      return 'text-blue-400'
    case 'shipped':
      return 'text-purple-400'
    case 'delivered':
      return 'text-green-400'
    case 'cancelled':
      return 'text-red-400'
    default:
      return 'text-zinc-400'
  }
}

export default function AccountDashboard({
  user,
  orders,
}: {
  user: User
  orders: Order[]
}) {
  const userEmail = user.email ?? 'User'

  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
        Hello, {userEmail}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">Manage your account and orders.</p>

      <div className="mt-10 space-y-10">
        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Profile
          </h2>
          <div className="mt-4 border border-zinc-800 divide-y divide-zinc-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                Email
              </span>
              <span className="text-sm text-white">{user.email}</span>
            </div>
            {user.user_metadata?.full_name && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Name
                </span>
                <span className="text-sm text-white">
                  {user.user_metadata.full_name as string}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Order History Section */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Order History
          </h2>

          {orders.length === 0 ? (
            <div className="mt-4 border border-zinc-800 px-4 py-8 text-center">
              <p className="text-sm text-zinc-500">No orders yet.</p>
              <Link
                href="/collections"
                className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-4 border border-zinc-800 divide-y divide-zinc-800">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs uppercase tracking-[0.1em] ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-sm text-white">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sign Out */}
        <form action={signout} className="pt-4 border-t border-zinc-800">
          <button
            type="submit"
            className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}