'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import FilterSidebar from '@/components/FilterSidebar'
import SortDropdown from '@/components/SortDropdown'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

interface ProductImage {
  url: string
  position: number
}

interface Category {
  name: string
  slug: string
}

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  stock: number
  created_at: string
  product_images: ProductImage[]
  categories: Category | null
}

interface CollectionClientProps {
  products: Product[]
  categoryName: string
  productCount: number
}

export default function CollectionClient({
  products: initialProducts,
}: CollectionClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
  })

  // Apply client-side filtering
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts]

    // Filter by price range
    if (filters.minPrice !== '') {
      const min = Number(filters.minPrice)
      if (!isNaN(min)) {
        result = result.filter((p) => p.price >= min)
      }
    }

    if (filters.maxPrice !== '') {
      const max = Number(filters.maxPrice)
      if (!isNaN(max)) {
        result = result.filter((p) => p.price <= max)
      }
    }

    // Filter by stock
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock > 0)
    }

    return result
  }, [initialProducts, filters])

  // Apply client-side sorting
  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts]

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case 'featured':
      default:
        // Keep original order (as fetched from DB)
        break
    }

    return result
  }, [filteredProducts, sortBy])

  const handleFilterChange = useCallback(
    (newFilters: { minPrice: string; maxPrice: string; inStockOnly: boolean }) => {
      setFilters(newFilters)
    },
    []
  )

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(option)
  }, [])

  const hasActiveFilters =
    filters.minPrice !== '' || filters.maxPrice !== '' || filters.inStockOnly

  return (
    <div className="flex gap-8">
      {/* Filter Sidebar */}
      <FilterSidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 md:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-sm hover:border-zinc-600 transition-colors"
            aria-label="Open filters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>

        {/* Desktop Sort Bar */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <p className="text-sm text-zinc-500">
            {hasActiveFilters
              ? `${sortedProducts.length} result${sortedProducts.length !== 1 ? 's' : ''}`
              : `${initialProducts.length} product${initialProducts.length !== 1 ? 's' : ''}`}
          </p>
          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>

        {/* Product Grid or Empty State */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-zinc-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-lg text-zinc-400 mb-6">No products found.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-black bg-white hover:bg-zinc-200 transition-colors rounded-sm"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
