'use client'

import { useEffect, useRef } from 'react'

interface Filters {
  minPrice: string
  maxPrice: string
  inStockOnly: boolean
}

interface FilterSidebarProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  isOpen: boolean
  onClose: () => void
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Trap focus when open
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      sidebarRef.current.focus()
    }
  }, [isOpen])

  const handleMinPriceChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      onFilterChange({ ...filters, minPrice: value })
    }
  }

  const handleMaxPriceChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      onFilterChange({ ...filters, maxPrice: value })
    }
  }

  const handleInStockChange = (checked: boolean) => {
    onFilterChange({ ...filters, inStockOnly: checked })
  }

  const handleClearAll = () => {
    onFilterChange({ minPrice: '', maxPrice: '', inStockOnly: false })
  }

  const hasActiveFilters =
    filters.minPrice !== '' || filters.maxPrice !== '' || filters.inStockOnly

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="complementary"
        aria-label="Product filters"
        tabIndex={-1}
        className={`
          fixed top-0 left-0 z-50 h-full w-[280px] bg-black border-r border-zinc-800
          transform transition-transform duration-300 ease-out
          md:relative md:transform-none md:z-auto md:border-r md:border-zinc-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-[0.1em]"
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors md:hidden"
              aria-label="Close filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Price Range */}
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400 mb-4">
              Price Range
            </legend>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="min-price" className="sr-only">
                  Minimum price
                </label>
                <input
                  id="min-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-sm text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
              <span className="text-zinc-600 text-sm">—</span>
              <div className="flex-1">
                <label htmlFor="max-price" className="sr-only">
                  Maximum price
                </label>
                <input
                  id="max-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-sm text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>
          </fieldset>

          {/* In Stock Toggle */}
          <fieldset>
            <div className="flex items-center gap-3">
              <button
                role="checkbox"
                aria-checked={filters.inStockOnly}
                onClick={() => handleInStockChange(!filters.inStockOnly)}
                className={`
                  relative w-[18px] h-[18px] border rounded-sm flex items-center justify-center
                  transition-all duration-200
                  ${
                    filters.inStockOnly
                      ? 'bg-white border-white'
                      : 'bg-transparent border-zinc-600 hover:border-zinc-400'
                  }
                `}
                aria-label="Toggle in stock only"
              >
                {filters.inStockOnly && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <label
                htmlFor="in-stock"
                className="text-sm text-zinc-300 cursor-pointer select-none"
                onClick={() => handleInStockChange(!filters.inStockOnly)}
              >
                In Stock Only
              </label>
            </div>
          </fieldset>
        </div>

        {/* Apply Button (Mobile) */}
        <div className="px-6 py-4 border-t border-zinc-800 md:hidden">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium uppercase tracking-[0.15em] text-black bg-white hover:bg-zinc-200 transition-colors rounded-sm"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  )
}