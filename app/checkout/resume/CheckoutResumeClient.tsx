'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore, CartItem } from '@/lib/store/cart'

interface CustomerData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
}

interface CheckoutResumeClientProps {
  orderId: string
  items: CartItem[]
  customerData: CustomerData
}

/**
 * Client component that restores the abandoned cart and redirects
 * the customer to the checkout page with pre-filled data.
 *
 * This component renders a loading state while the cart is being
 * restored, then redirects to /checkout.
 */
export default function CheckoutResumeClient({
  orderId,
  items,
  customerData,
}: CheckoutResumeClientProps) {
  const router = useRouter()
  const { clearCart, addItem } = useCartStore()
  const hasRestored = useRef(false)

  useEffect(() => {
    // Prevent double-restore in StrictMode
    if (hasRestored.current) return
    hasRestored.current = true

    // Restore cart: clear existing items, then add each from the order
    clearCart()

    // Add items one by one with a small delay to ensure state settles
    items.forEach((item) => {
      addItem(item)
    })

    // Store customer data in sessionStorage for the checkout page to pick up
    try {
      sessionStorage.setItem(
        `abandoned-order-${orderId}`,
        JSON.stringify(customerData)
      )
    } catch {
      // Non-critical; proceed without pre-fill
    }

    // Redirect to checkout
    router.push(`/checkout?resume=${orderId}`)
  }, [orderId, items, customerData, clearCart, addItem, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400 uppercase tracking-[0.1em]">
          Restoring your cart...
        </p>
      </div>
    </div>
  )
}