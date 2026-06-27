/**
 * Order status workflow types and helpers for Bandlox.
 *
 * Status transition lifecycle:
 *   Pending → Paid → Processing → Packed → Shipped → Out For Delivery → Delivered
 *
 * Terminal states (can only enter, not leave):
 *   Cancelled, Refunded
 */

export const ORDER_STATUSES = [
  'Pending',
  'Paid',
  'Processing',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
  'Refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Statuses that trigger a shipping notification email */
export const SHIPPING_EMAIL_STATUSES: readonly OrderStatus[] = [
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
]

/** The visual timeline shown on the order-lookup page */
export const TIMELINE_STATUSES: readonly OrderStatus[] = [
  'Pending',
  'Processing',
  'Packed',
  'Shipped',
  'Out For Delivery',
  'Delivered',
]

/** Terminal statuses — an order in one of these will never change again */
export const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'Delivered',
  'Cancelled',
  'Refunded',
])

/**
 * Returns the 0-based index of a status within the timeline.
 * -1 if the status is not on the timeline (e.g. Cancelled, Refunded).
 */
export function timelineIndex(status: string): number {
  return TIMELINE_STATUSES.indexOf(status as OrderStatus)
}

/**
 * Returns true if `from` → `to` is a valid forward transition.
 */
export function isValidTransition(from: string | null, to: string): boolean {
  const fromStatus = from as OrderStatus | null
  const toStatus = to as OrderStatus

  // Terminal statuses cannot be left
  if (fromStatus && TERMINAL_STATUSES.has(fromStatus)) return false

  // Any status can go to Cancelled or Refunded
  if (toStatus === 'Cancelled' || toStatus === 'Refunded') return true

  // Must be a forward step (or same — allow re-sending email by re-setting)
  if (fromStatus === toStatus) return true

  const fromIdx = fromStatus ? ORDER_STATUSES.indexOf(fromStatus) : -1
  const toIdx = ORDER_STATUSES.indexOf(toStatus)

  return toIdx > fromIdx
}

/**
 * Returns the next logical status step (or null if terminal / already final).
 */
export function nextStatus(current: string): OrderStatus | null {
  const idx = ORDER_STATUSES.indexOf(current as OrderStatus)
  if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return null

  // Skip terminal statuses
  const next = ORDER_STATUSES[idx + 1]
  if (TERMINAL_STATUSES.has(next)) return null
  return next
}

/**
 * Human-readable label for an order status.
 */
export function statusLabel(status: string): string {
  switch (status) {
    case 'Pending':
      return 'Pending'
    case 'Paid':
      return 'Paid'
    case 'Processing':
      return 'Processing'
    case 'Packed':
      return 'Packed'
    case 'Shipped':
      return 'Shipped'
    case 'Out For Delivery':
      return 'Out for Delivery'
    case 'Delivered':
      return 'Delivered'
    case 'Cancelled':
      return 'Cancelled'
    case 'Refunded':
      return 'Refunded'
    default:
      return status
  }
}

/**
 * Tailwind colour class for each status badge.
 */
export function statusBadgeColor(status: string): string {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'Paid':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'Processing':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    case 'Packed':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'Shipped':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    case 'Out For Delivery':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case 'Delivered':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'Cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'Refunded':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
}