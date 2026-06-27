'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { X, Minus, Plus } from 'lucide-react'
import { useCartStore, type CartItem as CartItemType } from '@/lib/store/cart'

interface Props {
  item: CartItemType
}

export default function CartItem({ item }: Props) {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const itemTitle = item.title?.trim() || 'Cart item'
  const canIncrement =
    typeof item.availableStock === 'number'
      ? item.quantity < item.availableStock
      : true

  const handleDecrement = useCallback(() => {
    if (item.quantity <= 1) {
      removeItem(item.id, item.variant)
    } else {
      updateQuantity(item.id, item.quantity - 1, item.variant)
    }
  }, [item.id, item.quantity, item.variant, updateQuantity, removeItem])

  const handleIncrement = useCallback(() => {
    if (!canIncrement) return

    updateQuantity(item.id, item.quantity + 1, item.variant)
  }, [canIncrement, item.id, item.quantity, item.variant, updateQuantity])

  const handleRemove = useCallback(() => {
    removeItem(item.id, item.variant)
  }, [item.id, item.variant, removeItem])

  return (
    <div className="flex gap-4 py-5 border-b border-zinc-800/60 last:border-b-0">
      {/* Product Image */}
      <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-sm bg-zinc-950">
        <Image
          src={item.image || '/placeholder.svg'}
          alt={`${itemTitle} product image`}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Item Details */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Title & Remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {itemTitle}
            </h3>
            {item.variant && (
              <p className="mt-0.5 text-xs text-zinc-500">{item.variant}</p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="shrink-0 p-1 text-zinc-600 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:text-zinc-300"
            aria-label={`Remove ${itemTitle} from cart`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <p className="mt-1 text-sm text-zinc-300">
          ₹{item.price.toLocaleString('en-IN')}
        </p>

        {/* Quantity Controls */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border border-zinc-700 rounded-sm">
            <button
              onClick={handleDecrement}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:bg-zinc-800"
              aria-label={`Decrease quantity of ${itemTitle}`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className="w-8 text-center text-sm text-white select-none"
              aria-live="polite"
              aria-label={`Quantity: ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={!canIncrement}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:text-zinc-700 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:bg-zinc-800"
              aria-label={`Increase quantity of ${itemTitle}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm font-medium text-white">
            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  )
}
