'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, User, Search } from 'lucide-react'
import { useCartStore, selectItemCount } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'
import SearchModal from '@/components/search/SearchModal'

export default function Header() {
  const toggleCart = useCartStore((state) => state.toggleCart)
  const itemCount = useCartStore(selectItemCount)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-lg md:text-xl font-bold tracking-[0.15em] uppercase text-white hover:text-zinc-300 transition-colors"
            >
              Bandlox
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  onFocus={() => setSearchOpen(true)}
                  readOnly
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              <Link
                href="/collections"
                className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                Collections
              </Link>
              <Link
                href="/about"
                className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
              >
                About
              </Link>
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Right side: Search (mobile) + Order Status (mobile) + Auth (mobile) + Cart */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile track order */}
              <Link
                href="/order-status"
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Track Order"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </Link>

              {/* Mobile auth link */}
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Login"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
                aria-label={`Open shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-black bg-white rounded-full" aria-hidden="true">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
