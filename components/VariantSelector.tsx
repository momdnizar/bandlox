'use client'

import { useCallback } from 'react'

interface ProductVariant {
  id: string
  name: string
  value: string
  stock: number
  price_adjustment: number
}

interface Props {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
}

export default function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: Props) {
  // Group variants by their name (e.g., Size, Color)
  const variantGroups = variants.reduce<
    Record<string, { value: string; variant: ProductVariant }[]>
  >((groups, variant) => {
    if (!groups[variant.name]) {
      groups[variant.name] = []
    }
    groups[variant.name].push({
      value: variant.value,
      variant,
    })
    return groups
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(variantGroups).map(([groupName, items]) => (
        <div key={groupName} className="flex flex-col gap-3">
          {/* Group Label */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              {groupName}
            </span>
            {selectedVariant &&
              selectedVariant.name === groupName && (
                <span className="text-xs text-zinc-500">
                  {selectedVariant.value}
                </span>
              )}
          </div>

          {/* Options */}
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={`Select ${groupName}`}
          >
            {items.map(({ value, variant }) => {
              const isSelected = selectedVariant?.id === variant.id
              const isDisabled = variant.stock <= 0

              return (
                <button
                  key={variant.id}
                  onClick={() => onVariantChange(variant)}
                  disabled={isDisabled}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${value}${isDisabled ? ' - Sold Out' : ''}`}
                  className={`px-5 py-2.5 text-sm font-medium rounded-sm border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isDisabled
                      ? 'border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40 line-through'
                      : isSelected
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}