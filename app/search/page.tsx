import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { trackSearch } from '@/lib/search'

interface ProductImage {
  url: string
  position: number
}

interface SearchProduct {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price: number | null
  stock: number
  description: string | null
  product_images: ProductImage[] | null
  categories: { name: string; slug: string } | null
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: 'Search | Bandlox',
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() || ''

  if (!query) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-zinc-400">Enter a search term to find products.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-black bg-white hover:bg-zinc-200 transition-colors rounded-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const pattern = `%${query}%`

  const { data: products, error, count } = await supabase
    .from('products')
    .select(`
      id,
      title,
      slug,
      price,
      compare_at_price,
      stock,
      description,
      product_images (url, position),
      categories!inner (name, slug)
    `, { count: 'exact', head: false })
    .or(`title.ilike.${pattern},description.ilike.${pattern},categories.name.ilike.${pattern}`)
    .order('title', { ascending: true })
    .limit(40)

  // Track the search event (fire and forget)
  if (query) {
    trackSearch(query, count ?? 0).catch(() => {})
  }

  const productsList = (products ?? []) as unknown as SearchProduct[]
  const total = count ?? 0

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-[0.1em] uppercase text-white">
          Search Results
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {total > 0
            ? `${total} result${total !== 1 ? 's' : ''} for "${query}"`
            : `No results for "${query}"`}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!error && total === 0 && (
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
          <p className="text-lg text-zinc-400 mb-2">No products found</p>
          <p className="text-sm text-zinc-600 mb-8">
            Try searching for &ldquo;rings&rdquo;, &ldquo;chains&rdquo;, or &ldquo;bracelets&rdquo;
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-black bg-white hover:bg-zinc-200 transition-colors rounded-sm"
          >
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {!error && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
      {productsList.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                product_images: product.product_images ?? [],
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
