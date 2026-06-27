'use client'

import { useCallback } from 'react'

interface Props {
  quantity: number
  maxQuantity: number
  onQuantityChange: (quantity: number) => void
}

export default function QuantitySelector({
  quantity,
  maxQuantity,
  onQuantityChange,
}: Props) {
  const canDecrease = quantity > 1
  const canIncrease = quantity < maxQuantity

  const handleDecrease = useCallback(() => {
    console.log('MINUS CLICK')
    if (canDecrease) {
      onQuantityChange(quantity - 1)
    }
  }, [canDecrease, quantity, onQuantityChange])

  const handleIncrease = useCallback(() => {
    console.log('PLUS CLICK')
    if (canIncrease) {
      onQuantityChange(quantity + 1)
    }
  }, [canIncrease, quantity, onQuantityChange])

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
        Quantity
      </span>
      <div className="flex items-center border border-zinc-800 w-fit">
        {/* Decrease Button */}
        <button
          onClick={handleDecrease}
          disabled={!canDecrease}
          className={`px-4 py-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            canDecrease
              ? 'text-white hover:bg-zinc-900 cursor-pointer'
              : 'text-zinc-700 cursor-not-allowed'
          }`}
          aria-label="Decrease quantity"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        {/* Quantity Display */}
        <div
          className="px-6 py-3 text-sm text-white font-medium min-w-[3rem] text-center border-x border-zinc-800"
          aria-live="polite"
          aria-label={`Quantity: ${quantity}`}
        >
          {quantity}
        </div>

        {/* Increase Button */}
        <button
          onClick={handleIncrease}
          disabled={!canIncrease}
          className={`px-4 py-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            canIncrease
              ? 'text-white hover:bg-zinc-900 cursor-pointer'
              : 'text-zinc-700 cursor-not-allowed'
          }`}
          aria-label="Increase quantity"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
