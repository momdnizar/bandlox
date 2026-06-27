'use client'

import { useState, useEffect, useRef } from 'react'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const options: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((opt) => opt.value === value)?.label || 'Featured'

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (option: SortOption) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-sm hover:border-zinc-600 transition-colors min-w-[160px]"
        aria-label="Sort products"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Sort options"
          className="absolute top-full right-0 mt-1 w-full min-w-[200px] bg-zinc-950 border border-zinc-800 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-30 py-1"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={value === option.value}>
              <button
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${
                    value === option.value
                      ? 'text-white bg-zinc-900'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }
                `}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}