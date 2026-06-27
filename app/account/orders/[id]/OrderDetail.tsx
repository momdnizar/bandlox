'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

export default function OrderDetail({
  order,
  items,
}: {
  order: Record<string, unknown> & {
    id: string
    created_at: string
    status: string
    subtotal: number
    customer_name?: string
    email?: string
  }
  items: Array<{
    id: string
    product_name: string
    price: number
    quantity: number
    variant: string | null
  }>
}) {
  const calculateTotal = () => {
    const subtotal = order.subtotal ?? 0
    return subtotal
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Account
      </Link>

      {/* Order Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
          Order #{order.id.slice(0, 8)}
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
          <span>{formatDate(order.created_at)}</span>
          <span className={`text-xs uppercase tracking-[0.1em] ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Customer Details */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Customer Details
        </h2>
        <div className="mt-4 border border-zinc-800 divide-y divide-zinc-800">
          {order.customer_name && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                Name
              </span>
              <span className="text-sm text-white">
                {order.customer_name}
              </span>
            </div>
          )}
          {order.email && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                Email
              </span>
              <span className="text-sm text-white">{order.email}</span>
            </div>
          )}
        </div>
      </section>

      {/* Order Items */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Products
        </h2>
        <div className="mt-4 border border-zinc-800 divide-y divide-zinc-800">
          {/* Header row */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-xs uppercase tracking-[0.1em] text-zinc-600">
            <span className="flex-1">Product</span>
            <span className="w-20 text-right">Price</span>
            <span className="w-16 text-center">Qty</span>
            <span className="w-24 text-right">Total</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {item.product_name}
                  </p>
                  {item.variant && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.variant}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 sm:gap-0 sm:w-[212px]">
                  <span className="text-sm text-zinc-400 text-right w-20 hidden sm:block">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="text-sm text-zinc-400 text-center w-16">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-white text-right w-24">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Total */}
      <div className="mt-6 border border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Total
          </span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </div>
    </div>
  )
}