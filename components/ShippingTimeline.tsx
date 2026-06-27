'use client'

import { Check, Package, Truck, MapPin, Clock, XCircle } from 'lucide-react'
import { TIMELINE_STATUSES, timelineIndex, statusLabel } from '@/lib/orders/order-status'

interface ShippingTimelineProps {
  currentStatus: string
  cancelled?: boolean
  refunded?: boolean
}

const statusIcons: Record<string, React.ReactNode> = {
  Pending: <Clock className="w-4 h-4" />,
  Processing: <Package className="w-4 h-4" />,
  Packed: <Package className="w-4 h-4" />,
  Shipped: <Truck className="w-4 h-4" />,
  'Out For Delivery': <MapPin className="w-4 h-4" />,
  Delivered: <Check className="w-4 h-4" />,
}

export default function ShippingTimeline({
  currentStatus,
  cancelled = false,
  refunded = false,
}: ShippingTimelineProps) {
  const currentIdx = timelineIndex(currentStatus)

  if (cancelled || refunded) {
    const label = cancelled ? 'Cancelled' : 'Refunded'
    const color = cancelled ? 'text-red-400' : 'text-pink-400'
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-500/20 bg-red-500/10 ${color} mb-4`}
        >
          <XCircle className="w-6 h-6" />
        </div>
        <p className={`text-sm font-semibold uppercase tracking-[0.15em] ${color}`}>
          Order {label}
        </p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="relative">
        {/* Vertical line connecting all steps */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-800" />

        {/* Completed line overlay */}
        {currentIdx >= 0 && (
          <div
            className="absolute left-[19px] top-2 w-px bg-white transition-all duration-500"
            style={{
              height: `${
                currentIdx === 0
                  ? 0
                  : ((currentIdx) / (TIMELINE_STATUSES.length - 1)) * 100
              }%`,
              maxHeight: `calc((100% - 16px) * ${currentIdx / (TIMELINE_STATUSES.length - 1)})`,
            }}
          />
        )}

        {/* Steps */}
        <div className="space-y-0">
          {TIMELINE_STATUSES.map((status, index) => {
            const isActive = index <= currentIdx
            const isCurrent = index === currentIdx
            const isFuture = index > currentIdx

            return (
              <div key={status} className="flex items-start gap-4 pb-8 last:pb-0">
                {/* Icon circle */}
                <div
                  className={`relative z-10 flex items-center justify-center w-[38px] h-[38px] rounded-full border-2 shrink-0 transition-all duration-300 ${
                    isActive
                      ? 'border-white bg-white text-black'
                      : isFuture
                        ? 'border-zinc-700 bg-zinc-900/50 text-zinc-600'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-500'
                  } ${isCurrent ? 'ring-2 ring-white/20' : ''}`}
                >
                  {isActive ? (
                    index === TIMELINE_STATUSES.length - 1 ? (
                      <Check className="w-4 h-4" />
                    ) : index === currentIdx ? (
                      statusIcons[status] || <div className="w-2 h-2 rounded-full bg-black" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col justify-center min-h-[38px]">
                  <span
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isActive
                        ? 'text-white font-semibold'
                        : isFuture
                          ? 'text-zinc-600'
                          : 'text-zinc-500'
                    }`}
                  >
                    {statusLabel(status)}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] mt-0.5">
                      Current
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}