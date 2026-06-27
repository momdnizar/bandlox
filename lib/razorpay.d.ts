// Type declarations for Razorpay Checkout
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
    hide_topbar?: boolean
  }
  modal?: {
    backdropclose?: boolean
    escape?: boolean
    handleback?: boolean
    confirm_close?: boolean
    ondismiss?: () => void
    animation?: boolean
  }
  handler: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

interface Window {
  Razorpay: RazorpayConstructor
}