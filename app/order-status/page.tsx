'use client'

import { useState, useCallback } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import ShippingTimeline from '@/components/ShippingTimeline'
import { statusBadgeColor, statusLabel } from '@/lib/orders/order-status'

interface OrderItem {
  id: string
  product_name: string
  price: number
  quantity: number
  variant: string | null
}

interface OrderData {
  id: string
  created_at: string
  status: string
  payment_status: string
  subtotal: number
  customer_name: string
  email: string
  tracking_number: string | null
  courier_name: string | null
  tracking_url: string | null
  status_updated_at: string | null
  order_items: OrderItem[]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

function OrderIdDisplay({ id }: { id: string }) {
  return (
    <span className="font-mono">
      {id.slice(0, 8)}...{id.slice(-4)}
    </span>
  )
}

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookedUp, setLookedUp] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setOrder(null)
      setLookedUp(false)

      if (!orderId.trim() || !email.trim()) {
        setError('Please enter both order ID and email.')
        return
      }

      setLoading(true)

      try {
        const params = new URLSearchParams({
          order_id: orderId.trim(),
          email: email.trim(),
        })

        const res = await fetch(`/api/orders/lookup?${params}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Order not found.')
          setLookedUp(true)
          return
        }

        setOrder(data.order)
      } catch {
        setError('Unable to look up order. Please try again.')
      } finally {
        setLoading(false)
        setLookedUp(true)
      }
    },
    [orderId, email]
  )

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-16">
        {/* ── Page Header ── */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
            Order Status
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto">
            Enter your order ID and email address to check the status of your
            order. No login required.
          </p>
        </div>

        {/* ── Search Form ── */}
        <form
          onSubmit={handleSubmit}
          className="border border-zinc-800 p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="order_id"
                className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
              >
                Order ID
              </label>
              <input
                id="order_id"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. a1b2c3d4-e5f6-..."
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs uppercase tracking-[0.2em] font-semibold px-6 py-3 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  Track Order
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Error ── */}
        {error && (
          <div className="mt-8 border border-red-500/20 bg-red-500/5 px-6 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Not Found ── */}
        {lookedUp && !order && !error && (
          <div className="mt-8 border border-zinc-800 px-6 py-8 text-center">
            <p className="text-sm text-zinc-500">
              No order found matching that ID and email combination.
            </p>
          </div>
        )}

        {/* ── Order Details ── */}
        {order && (
          <div className="mt-8 space-y-8">
            {/* Order Info Card */}
            <div className="border border-zinc-800 divide-y divide-zinc-800">
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Order Number
                </span>
                <span className="text-sm text-white font-mono">
                  <OrderIdDisplay id={order.id} />
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Date
                </span>
                <span className="text-sm text-white">
                  {formatDate(order.created_at)}
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Payment Status
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.1em] px-2 py-1 border ${
                    order.payment_status === 'paid'
                      ? 'text-green-400 border-green-500/20 bg-green-500/10'
                      : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                  }`}
                >
                  {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                  Order Status
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.1em] px-2 py-1 border ${statusBadgeColor(order.status)}`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>

              {order.tracking_number && (
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                    Tracking Number
                  </span>
                  <span className="text-sm text-white font-mono">
                    {order.tracking_number}
                  </span>
                </div>
              )}

              {order.courier_name && (
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                    Courier
                  </span>
                  <span className="text-sm text-white">
                    {order.courier_name}
                  </span>
                </div>
              )}

              {order.tracking_url && (
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                    Tracking Link
                  </span>
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-white hover:text-zinc-300 transition-colors"
                  >
                    Track Package
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Shipping Timeline */}
            <div className="border border-zinc-800 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">
                Shipping Progress
              </h2>
              <ShippingTimeline
                currentStatus={order.status}
                cancelled={order.status === 'Cancelled'}
                refunded={order.status === 'Refunded'}
              />
            </div>

            {/* Items */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="border border-zinc-800">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    Items Ordered
                  </h2>
                </div>
                <div className="divide-y divide-zinc-800">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
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
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <span className="text-zinc-400">
                          ×{item.quantity}
                        </span>
                        <span className="text-white w-20 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-[0.1em] text-white">
                    Total
                  </span>
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Status update time */}
            {order.status_updated_at && (
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] text-center">
                Last updated:{' '}
                {formatDate(order.status_updated_at)} at{' '}
                {formatTime(order.status_updated_at)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}