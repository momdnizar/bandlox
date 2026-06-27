'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Suggestion {
  type: 'product' | 'collection'
  label: string
  href: string
  image?: string
  price?: number
  compareAtPrice?: number | null
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow transition
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSuggestions([])
      setSelectedIndex(-1)
      setHasSearched(false)
    }
  }, [isOpen])

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}&limit=8`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Navigate to selected suggestion
        router.push(suggestions[selectedIndex].href)
        onClose()
      } else if (query.trim()) {
        // Navigate to search results page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        onClose()
      }
    }
  }

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay to prevent immediate close from the trigger click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const productSuggestions = suggestions.filter((s) => s.type === 'product')
  const collectionSuggestions = suggestions.filter((s) => s.type === 'collection')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-zinc-800">
          <svg
            className="ml-4 w-5 h-5 text-zinc-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none px-4 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search products"
            aria-expanded={suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined
            }
          />
          <button
            onClick={onClose}
            className="mr-2 p-2 text-zinc-500 hover:text-white transition-colors"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Suggestions */}
        <div
          id="search-suggestions"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="p-6 text-center">
              <div className="inline-block w-5 h-5 border border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && hasSearched && query.trim() && suggestions.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-zinc-500">No products found</p>
              <p className="mt-1 text-xs text-zinc-600">
                Try a different search term
              </p>
            </div>
          )}

          {/* Product suggestions */}
          {productSuggestions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                Products
              </p>
              {productSuggestions.map((suggestion, index) => (
                <Link
                  key={`product-${suggestion.href}`}
                  href={suggestion.href}
                  onClick={onClose}
                  id={`search-item-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${
                    selectedIndex === index
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {/* Thumbnail */}
                  {suggestion.image && (
                    <div className="relative w-10 h-10 shrink-0 bg-zinc-900 rounded-sm overflow-hidden">
                      <Image
                        src={suggestion.image}
                        alt={`${suggestion.label?.trim() || 'Search result'} thumbnail`}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{suggestion.label}</p>
                    {suggestion.price !== undefined && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-zinc-400">
                          ₹{suggestion.price.toLocaleString('en-IN')}
                        </span>
                        {suggestion.compareAtPrice && (
                          <span className="text-xs text-zinc-600 line-through">
                            ₹{suggestion.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Collection suggestions */}
          {collectionSuggestions.length > 0 && (
            <div className="p-2 border-t border-zinc-800">
              <p className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                Collections
              </p>
              {collectionSuggestions.map((suggestion, index) => {
                const globalIndex = productSuggestions.length + index
                return (
                  <Link
                    key={`collection-${suggestion.href}`}
                    href={suggestion.href}
                    onClick={onClose}
                    id={`search-item-${globalIndex}`}
                    role="option"
                    aria-selected={selectedIndex === globalIndex}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${
                      selectedIndex === globalIndex
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <div className="w-10 h-10 shrink-0 bg-zinc-900 rounded-sm flex items-center justify-center">
                      <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      </svg>
                    </div>
                    <p className="text-sm truncate">{suggestion.label}</p>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Search all results footer */}
          {query.trim() && !isLoading && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="block border-t border-zinc-800 p-3 text-center text-xs text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              View all results for "{query.trim()}"
            </Link>
          )}

          {/* Initial hint */}
          {!hasSearched && !query.trim() && (
            <div className="p-6 text-center">
              <p className="text-sm text-zinc-500">
                Type to search products and collections
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
