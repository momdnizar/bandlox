import { createClient } from '@/lib/supabase/server'

export interface SearchProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  stock: number
  description: string | null
  product_images: { url: string; position: number }[] | null
  categories: { name: string; slug: string } | null
}

export interface SearchSuggestion {
  type: 'product' | 'collection'
  label: string
  href: string
  image?: string
  price?: number
  compareAtPrice?: number | null
}

/**
 * Search products and collections with ranked results.
 *
 * Ranking priority:
 * 1. Exact product name matches (name ILIKE query)
 * 2. Partial product name matches (name ILIKE %query%)
 * 3. Category matches (variant values, category name)
 * 4. Description matches (description ILIKE %query%)
 *
 * @param query  - The search term
 * @param limit  - Max suggestions (default 8)
 * @returns      - Ranked suggestions
 */
export async function searchSuggestions(
  query: string,
  limit: number = 8
): Promise<SearchSuggestion[]> {
  const supabase = await createClient()
  const term = query.trim()

  if (!term) return []

  const pattern = `%${term}%`

  // 1. Exact product name matches
  const { data: exactMatches } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      stock,
      product_images (url, position)
    `)
    .ilike('name', term)
    .limit(limit)

  // 2. Partial product name matches
  const { data: partialMatches } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      stock,
      product_images (url, position)
    `)
    .ilike('name', pattern)
    .limit(limit)

  // 3. Description matches
  const { data: descriptionMatches } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      stock,
      product_images (url, position)
    `)
    .ilike('description', pattern)
    .limit(limit)

  // 4. Category / collection matches
  const { data: collectionData } = await supabase
    .from('categories')
    .select('name, slug')
    .ilike('name', pattern)
    .limit(limit)

  // Build ranked suggestions
  const suggestions: SearchSuggestion[] = []

  // Dedup helper
  const seenIds = new Set<string>()

  function addProduct(p: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    product_images: { url: string; position: number }[] | null
  }) {
    if (seenIds.has(p.id)) return
    seenIds.add(p.id)
    const image = p.product_images?.find((img) => img.position === 1)?.url ||
                  p.product_images?.[0]?.url
    suggestions.push({
      type: 'product',
      label: p.name,
      href: `/products/${p.slug}`,
      image,
      price: p.price,
      compareAtPrice: p.compare_at_price,
    })
  }

  // Priority 1: Exact matches first
  for (const p of exactMatches ?? []) addProduct(p)

  // Priority 2: Partial name matches
  for (const p of partialMatches ?? []) addProduct(p)

  // Priority 3: Description matches (fill remaining)
  const remaining = limit - suggestions.length
  for (const p of (descriptionMatches ?? []).slice(0, remaining)) {
    addProduct(p)
  }

  // Priority 4: Collection matches
  const collectionSpace = limit - suggestions.length
  for (const c of (collectionData ?? []).slice(0, collectionSpace)) {
    suggestions.push({
      type: 'collection',
      label: c.name,
      href: `/collections/${c.slug}`,
    })
  }

  return suggestions.slice(0, limit)
}

/**
 * Full search results for the /search page.
 * Returns paginated product results.
 */
export async function searchProducts(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  products: SearchProduct[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = await createClient()
  const term = query.trim()
  const pattern = `%${term}%`

  // Build ranked query using CASE for priority ordering
  // 1. Exact name match gets priority 0
  // 2. Partial name match gets priority 1
  // 3. Description match gets priority 2
  const { data: products, error, count } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      stock,
      description,
      product_images (url, position),
      categories!inner (name, slug)
    `, { count: 'exact', head: false })
    .or(`name.ilike.${pattern},description.ilike.${pattern},categories.name.ilike.${pattern}`)
    .order('name', { ascending: true }) // Default alphabetical within matching set
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    console.error('[search] Error:', error)
    return { products: [], total: 0, page, pageSize }
  }

  return {
    products: (products ?? []) as unknown as SearchProduct[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

/**
 * Convert search suggestions to a serializable format for the API.
 */
export type SerializableSuggestion = {
  type: 'product' | 'collection'
  label: string
  href: string
  image?: string
  price?: number
  compareAtPrice?: number | null
}

/**
 * Analytics: track a search event.
 */
export async function trackSearch(
  query: string,
  resultsCount: number,
  clickedProductId?: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('search_events')
    .insert({
      query: query.trim(),
      results_count: resultsCount,
      clicked_product_id: clickedProductId ?? null,
    })

  if (error) {
    console.error('[search/analytics] Failed to track search:', error)
  }
}