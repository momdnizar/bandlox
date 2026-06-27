import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function CheckoutSuccessPage(props: {
  searchParams: Promise<{ orderId?: string; paymentId?: string }>
}) {
  const searchParams = await props.searchParams
  const orderId = searchParams.orderId
  const paymentId = searchParams.paymentId

  if (!orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <h1 className="text-xl font-semibold text-white uppercase tracking-[0.15em] mb-3">
            No Order Found
          </h1>
          <p className="text-sm text-zinc-400 mb-8">
            We couldn't find an order to confirm. If you believe this is an error,
            please contact support.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black bg-white hover:bg-zinc-200 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white uppercase tracking-[0.15em] mb-3">
          Payment Successful
        </h1>

        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Thank you for your order. We'll send you a confirmation email
          once your order has shipped.
        </p>

        {/* Order Number */}
        <div className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-800 rounded-sm mb-4">
          <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">
            Order Number
          </span>
          <span className="text-sm font-mono text-zinc-300">{orderId}</span>
        </div>

        {/* Payment Status */}
        <div className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-800 rounded-sm mb-4">
          <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">
            Payment Status
          </span>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-[0.1em]">
            Paid
          </span>
        </div>

        {/* Payment ID */}
        {paymentId && (
          <div className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-800 rounded-sm mb-10">
            <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">
              Razorpay Payment ID
            </span>
            <span className="text-xs font-mono text-zinc-300">{paymentId}</span>
          </div>
        )}

        {/* Continue Shopping */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black bg-white hover:bg-zinc-200 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}