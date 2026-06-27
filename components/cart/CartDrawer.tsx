'use client'

import { useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ShoppingBag, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCartStore, selectItemCount, selectSubtotal } from '@/lib/store/cart'
import CartItem from './CartItem'

export default function CartDrawer() {
  const { items, isOpen, closeCart } = useCartStore()
  const itemCount = useCartStore(selectItemCount)
  const subtotal = useCartStore(selectSubtotal)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeCart])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    },
    []
  )

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeCart()
      }
    },
    [closeCart]
  )

  const router = useRouter()

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={handleOverlayClick}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        onKeyDown={handleKeyDown}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-black border-l border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-zinc-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
              Shopping Cart
            </h2>
            {itemCount > 0 && (
              <span className="text-xs text-zinc-500">({itemCount})</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-zinc-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
            aria-label="Close shopping cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag className="w-12 h-12 text-zinc-700" aria-hidden="true" />
            <p className="text-sm text-zinc-500">Your cart is empty</p>
            <Link
              href="/"
              onClick={closeCart}
              className="inline-flex items-center px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white border border-zinc-700 hover:border-zinc-500 transition-colors focus-visible:outline-none focus-visible:border-zinc-500"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-zinc-800/60">
              {items.map((item) => (
                <CartItem key={`${item.id}-${item.variant || ''}`} item={item} />
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-zinc-800 bg-black px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-[0.1em]">
                  Subtotal
                </span>
                <span className="text-lg font-semibold text-white">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                Shipping and taxes calculated at checkout
              </p>
              <button
                onClick={() => {
                  closeCart()
                  router.push('/checkout')
                }}
                className="w-full py-4 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}