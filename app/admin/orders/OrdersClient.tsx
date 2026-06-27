'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ORDER_STATUSES,
  isValidTransition,
  statusBadgeColor,
  statusLabel,
  SHIPPING_EMAIL_STATUSES,
  type OrderStatus,
} from '@/lib/orders/order-status'
import { ChevronDown, ExternalLink, RefreshCw, Search } from 'lucide-react'

interface AdminOrder {
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
}

interface PaginatedResponse {
  orders: AdminOrder[]
  total: number
  page: number
  page_size: number
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

export default function OrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateMessage, setUpdateMessage] = useState<{
    id: string
    text: string
    error: boolean
  } | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/orders?${params}`)
      const data: PaginatedResponse = await res.json()

      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }

      setOrders(data.orders)
      setTotal(data.total)
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: string, sendEmail: boolean) => {
      setUpdatingId(orderId)
      setUpdateMessage(null)

      try {
        const res = await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            status: newStatus,
            send_email: sendEmail,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setUpdateMessage({
            id: orderId,
            text: data.error || 'Update failed',
            error: true,
          })
          return
        }

        setUpdateMessage({
          id: orderId,
          text: data.message || 'Status updated',
          error: false,
        })

        // Refresh list
        fetchOrders()
      } catch {
        setUpdateMessage({
          id: orderId,
          text: 'Update failed',
          error: true,
        })
      } finally {
        setUpdatingId(null)
      }
    },
    [fetchOrders]
  )

  const handleTrackingUpdate = useCallback(
    async (
      orderId: string,
      trackingNumber: string,
      courierName: string,
      trackingUrl: string
    ) => {
      setUpdatingId(orderId)
      setUpdateMessage(null)

      try {
        const res = await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            tracking_number: trackingNumber || null,
            courier_name: courierName || null,
            tracking_url: trackingUrl || null,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setUpdateMessage({
            id: orderId,
            text: data.error || 'Update failed',
            error: true,
          })
          return
        }

        setUpdateMessage({
          id: orderId,
          text: 'Tracking info saved',
          error: false,
        })

        fetchOrders()
      } catch {
        setUpdateMessage({
          id: orderId,
          text: 'Update failed',
          error: true,
        })
      } finally {
        setUpdatingId(null)
      }
    },
    [fetchOrders]
  )

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-white">
              Orders
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {total} total order{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, email, or order ID..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm pl-10 pr-4 py-2.5 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-white transition-colors min-w-[160px]"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-zinc-800 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isUpdating={updatingId === order.id}
                updateMessage={updateMessage?.id === order.id ? updateMessage : null}
                onStatusUpdate={handleStatusUpdate}
                onTrackingUpdate={handleTrackingUpdate}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-zinc-400 border border-zinc-800 hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-zinc-400 border border-zinc-800 hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Single Order Row ──

function OrderRow({
  order,
  isUpdating,
  updateMessage,
  onStatusUpdate,
  onTrackingUpdate,
}: {
  order: AdminOrder
  isUpdating: boolean
  updateMessage: { text: string; error: boolean } | null
  onStatusUpdate: (id: string, status: string, sendEmail: boolean) => Promise<void>
  onTrackingUpdate: (
    id: string,
    trackingNumber: string,
    courierName: string,
    trackingUrl: string
  ) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [sendEmail, setSendEmail] = useState(
    SHIPPING_EMAIL_STATUSES.includes(order.status as OrderStatus)
  )
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [courierName, setCourierName] = useState(order.courier_name ?? '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '')

  const availableStatuses = ORDER_STATUSES.filter((s) =>
    isValidTransition(order.status, s)
  )

  return (
    <div className="border border-zinc-800">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <span
              className={`text-[10px] uppercase tracking-[0.1em] px-2 py-1 border ${statusBadgeColor(order.status)}`}
            >
              {statusLabel(order.status)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-mono truncate">
              {order.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{order.customer_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-white">
              {formatCurrency(order.subtotal)}
            </p>
            <p className="text-[10px] text-zinc-600">
              {formatDate(order.created_at)}
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-800 px-5 py-5 space-y-6">
          {/* Status Update */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.15em] text-zinc-500 mb-3">
              Update Status
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setSendEmail(
                    SHIPPING_EMAIL_STATUSES.includes(
                      e.target.value as OrderStatus
                    )
                  )
                }}
                className="bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-white transition-colors"
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-3.5 h-3.5 accent-white"
                />
                <span className="text-xs text-zinc-400 uppercase tracking-[0.1em]">
                  Send email
                </span>
              </label>

              <button
                onClick={() =>
                  onStatusUpdate(order.id, selectedStatus, sendEmail)
                }
                disabled={isUpdating || selectedStatus === order.status}
                className="bg-white text-black text-xs uppercase tracking-[0.2em] font-semibold px-4 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>

          {/* Tracking Information */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.15em] text-zinc-500 mb-3">
              Tracking Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-600 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-600 mb-1">
                  Courier Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. FedEx, India Post"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] text-zinc-600 mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
            <button
              onClick={() =>
                onTrackingUpdate(
                  order.id,
                  trackingNumber,
                  courierName,
                  trackingUrl
                )
              }
              disabled={isUpdating}
              className="mt-3 bg-zinc-800 text-white text-xs uppercase tracking-[0.2em] font-semibold px-4 py-2 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 uppercase tracking-[0.1em]">
                Email
              </span>
              <p className="text-white mt-1 truncate">{order.email}</p>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-[0.1em]">
                Payment
              </span>
              <p className="text-white mt-1 capitalize">{order.payment_status}</p>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-[0.1em]">
                Total
              </span>
              <p className="text-white mt-1">
                {formatCurrency(order.subtotal)}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-[0.1em]">
                Last Updated
              </span>
              <p className="text-white mt-1">
                {order.status_updated_at
                  ? formatDate(order.status_updated_at)
                  : '-'}
              </p>
            </div>
          </div>

          {/* Message */}
          {updateMessage && (
            <div
              className={`px-3 py-2 text-xs ${
                updateMessage.error
                  ? 'text-red-400 bg-red-500/5 border border-red-500/20'
                  : 'text-green-400 bg-green-500/5 border border-green-500/20'
              }`}
            >
              {updateMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}