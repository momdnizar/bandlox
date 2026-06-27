'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, Shield, Truck, Mail } from 'lucide-react'
import { useCartStore, selectSubtotal } from '@/lib/store/cart'

interface FormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
}

const shipping = 0

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.name.trim()) {
    errors.name = 'Full name is required'
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required'
  }

  if (!data.address.trim()) {
    errors.address = 'Address is required'
  }

  if (!data.city.trim()) {
    errors.city = 'City is required'
  }

  if (!data.state.trim()) {
    errors.state = 'State is required'
  }

  if (!data.postal_code.trim()) {
    errors.postal_code = 'Postal code is required'
  }

  return errors
}

/**
 * Dynamically load the Razorpay checkout script.
 * Returns a promise that resolves when the script is loaded.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const subtotal = useCartStore(selectSubtotal)

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<'idle' | 'preparing' | 'processing' | 'retrying'>('idle')

  const formRef = useRef<HTMLFormElement>(null)
  const orderIdRef = useRef<string | null>(null)

  // Load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      // Clear error on change if field was touched
      if (touched.has(name)) {
        setErrors((prev) => {
          const updated = { ...prev }
          delete updated[name as keyof FormErrors]
          return updated
        })
      }
    },
    [touched]
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name } = e.target
      setTouched((prev) => new Set(prev).add(name))

      // Validate single field on blur
      const fieldErrors = validateForm(formData)
      if (fieldErrors[name as keyof FormErrors]) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name as keyof FormErrors],
        }))
      }
    },
    [formData]
  )

  // ──────────────────────────────────────
  // Initiate Razorpay payment flow
  // ──────────────────────────────────────
  const initiatePayment = useCallback(
    async (orderId: string) => {
      setPaymentState('preparing')
      setApiError(null)

      try {
        // 1. Create Razorpay order
        const razorpayRes = await fetch('/api/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              variant: item.variant,
            })),
            subtotal,
          }),
        })

        const razorpayData = await razorpayRes.json()

        if (!razorpayRes.ok) {
          // Log the complete parsed response for debugging
          console.log(
            'Razorpay order API error response:',
            JSON.stringify(razorpayData, null, 2)
          )

          let errorMessage: string
          const err = razorpayData.error

          if (typeof err === 'string') {
            errorMessage = err
          } else if (err && typeof err === 'object') {
            errorMessage = err.message || JSON.stringify(err, null, 2)
          } else {
            errorMessage = 'Unable to initiate payment'
          }

          throw new Error(errorMessage)
        }

        // 2. Ensure Razorpay script is loaded
        const scriptLoaded = await loadRazorpayScript()
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error('Unable to load payment gateway. Please try again.')
        }

        // 3. Open Razorpay checkout
        setPaymentState('processing')

        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: razorpayData.amount,
          currency: razorpayData.currency || 'INR',
          name: 'Bandlox',
          description: `Order #${orderId.slice(0, 8)}`,
          order_id: razorpayData.id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#D97706', // amber-600 to match brand
            hide_topbar: false,
          },
          modal: {
            backdropclose: false,
            escape: false,
            handleback: true,
            confirm_close: true,
            ondismiss: () => {
              // User closed the modal — allow retry
              setPaymentState('idle')
              setIsSubmitting(false)
              setApiError(null)
            },
          },
          handler: async (response) => {
            // 4. Verify payment on server
            setPaymentState('processing')

            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: orderId,
                }),
              })

              const verifyData = await verifyRes.json()

              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed')
              }

              // 5. Success — clear cart and redirect
              clearCart()
              router.push(
                `/checkout/success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`
              )
            } catch (verifyError) {
              const message =
                verifyError instanceof Error
                  ? verifyError.message
                  : 'Payment verification failed. Please contact support.'
              setApiError(message)
              setPaymentState('retrying')
              setIsSubmitting(false)
            }
          },
        })

        razorpay.open()
      } catch (initError) {
        const message =
          initError instanceof Error
            ? initError.message
            : 'Unable to initiate payment. Please try again.'
        setApiError(message)
        setPaymentState('idle')
        setIsSubmitting(false)
      }
    },
    [items, subtotal, formData, clearCart, router]
  )

  // ──────────────────────────────────────
  // Handle form submission
  // ──────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setApiError(null)

      // Mark all fields as touched
      const allFields: (keyof FormData)[] = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'postal_code',
      ]
      setTouched(new Set(allFields))

      // Validate all fields
      const validationErrors = validateForm(formData)
      setErrors(validationErrors)

      if (Object.keys(validationErrors).length > 0) {
        const firstErrorField = Object.keys(validationErrors)[0]
        const firstErrorEl = formRef.current?.querySelector<HTMLElement>(
          `[name="${firstErrorField}"]`
        )
        firstErrorEl?.focus()
        return
      }

      if (items.length === 0) {
        setApiError('Your cart is empty')
        return
      }

      setIsSubmitting(true)

      try {
        // Step 1: Create the order
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              ...formData,
              country: 'India',
            },
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              variant: item.variant,
            })),
            subtotal,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Unable to place order. Please try again.')
        }

        orderIdRef.current = data.orderId

        // Step 2: Initiate Razorpay payment
        await initiatePayment(data.orderId)
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : 'Unable to place order. Please try again.'
        )
        setIsSubmitting(false)
      }
    },
    [formData, items, subtotal, initiatePayment]
  )

  const total = subtotal + shipping

  // Determine button text based on payment state
  const getButtonText = () => {
    if (paymentState === 'preparing') return 'Preparing Payment...'
    if (paymentState === 'processing') return 'Processing Payment...'
    if (paymentState === 'retrying') return 'Retry Payment'
    if (isSubmitting) return 'Placing Order...'
    return 'Place Order'
  }

  const isButtonDisabled = isSubmitting || paymentState === 'preparing' || paymentState === 'processing'

  const inputClass = (field: keyof FormData) =>
    `w-full bg-transparent border ${
      touched.has(field) && errors[field]
        ? 'border-red-500/50'
        : 'border-zinc-800'
    } px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors`

  const labelClass = 'block text-xs font-medium text-zinc-400 uppercase tracking-[0.1em] mb-2'

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <h1 className="text-lg sm:text-xl font-semibold text-white uppercase tracking-[0.15em] mb-8 sm:mb-12">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Order Form - 3 columns on desktop */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              {/* Customer Information */}
              <section>
                <h2 className="text-sm font-semibold text-white uppercase tracking-[0.15em] mb-6 pb-4 border-b border-zinc-800">
                  Customer Information
                </h2>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="John Doe"
                      className={inputClass('name')}
                      autoComplete="name"
                    />
                    {touched.has('name') && errors.name && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="john@example.com"
                      className={inputClass('email')}
                      autoComplete="email"
                      inputMode="email"
                    />
                    {touched.has('email') && errors.email && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="+91 98765 43210"
                      className={inputClass('phone')}
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                    {touched.has('phone') && errors.phone && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className={labelClass}>
                      Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="123 Main Street, Apt 4B"
                      className={inputClass('address')}
                      autoComplete="street-address"
                    />
                    {touched.has('address') && errors.address && (
                      <p className="mt-1.5 text-xs text-red-400">{errors.address}</p>
                    )}
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="city" className={labelClass}>
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Mumbai"
                        className={inputClass('city')}
                        autoComplete="address-level2"
                      />
                      {touched.has('city') && errors.city && (
                        <p className="mt-1.5 text-xs text-red-400">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="state" className={labelClass}>
                        State <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Maharashtra"
                        className={inputClass('state')}
                        autoComplete="address-level1"
                      />
                      {touched.has('state') && errors.state && (
                        <p className="mt-1.5 text-xs text-red-400">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label htmlFor="postal_code" className={labelClass}>
                      Postal Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      value={formData.postal_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="400001"
                      className={inputClass('postal_code')}
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                    {touched.has('postal_code') && errors.postal_code && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {errors.postal_code}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Order Summary - 2 columns on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="sticky top-8">
                <section className="border border-zinc-800">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-[0.15em] px-6 py-5 border-b border-zinc-800">
                    Order Summary
                  </h2>

                  {/* Cart Items */}
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
                      <ShoppingBag className="w-10 h-10 text-zinc-700" aria-hidden="true" />
                      <p className="text-sm text-zinc-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-zinc-800/60">
                        {items.map((item) => {
                          const lineTotal = item.price * item.quantity
                          const itemTitle = item.title?.trim() || 'Cart item'
                          return (
                            <div
                              key={`${item.id}-${item.variant || ''}`}
                              className="flex gap-4 px-6 py-4"
                            >
                              {/* Product Image */}
                              <div className="relative w-16 h-20 flex-shrink-0 bg-zinc-900 rounded-sm overflow-hidden">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={`${itemTitle} product image`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-zinc-700" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-white truncate">
                                  {itemTitle}
                                </h3>
                                {item.variant && (
                                  <p className="text-xs text-zinc-500 mt-1">
                                    {item.variant}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-zinc-500">
                                    Qty: {item.quantity}
                                  </span>
                                  <span className="text-sm font-medium text-white">
                                    ₹{lineTotal.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Totals */}
                      <div className="px-6 py-5 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Subtotal</span>
                          <span className="text-sm text-white">
                            ₹{subtotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Shipping</span>
                          <span className="text-sm text-zinc-500">Free</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                          <span className="text-sm font-semibold text-white uppercase tracking-[0.1em]">
                            Total
                          </span>
                          <span className="text-lg font-semibold text-white">
                            ₹{total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Payment State Indicator */}
                      {(paymentState === 'preparing' || paymentState === 'processing') && (
                        <div className="px-6 pb-4">
                          <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-sm">
                            <p className="text-xs text-amber-400 flex items-center gap-2">
                              <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              {paymentState === 'preparing'
                                ? 'Preparing Payment...'
                                : 'Processing Payment...'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* API Error */}
                      {apiError && (
                        <div className="px-6 pb-4">
                          <div className="p-3 border border-red-500/30 bg-red-500/5 rounded-sm">
                            <p className="text-xs text-red-400">{apiError}</p>
                          </div>
                        </div>
                      )}

                      {/* Trust Elements */}
                      <div className="px-6 pb-4">
                        <div className="space-y-3 py-4 border-t border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                            <span className="text-xs text-zinc-500 tracking-wide">
                              Secure Razorpay Checkout
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Truck className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                            <span className="text-xs text-zinc-500 tracking-wide">
                              Fast Shipping Across India
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                            <span className="text-xs text-zinc-500 tracking-wide">
                              Order Confirmation via Email
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Place Order Button */}
                      <div className="px-6 pb-6">
                        <button
                          type="submit"
                          disabled={items.length === 0 || isButtonDisabled}
                          className="w-full py-4 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          {getButtonText()}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
