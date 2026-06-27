import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CollectionClient from './CollectionClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .single()

  const categoryName = categories?.name || slug.charAt(0).toUpperCase() + slug.slice(1)

  return {
    title: `${categoryName} — Bandlox`,
    description: `Discover premium handcrafted ${categoryName.toLowerCase()} pieces.`,
  }
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch category
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!category) {
    notFound()
  }

  // Fetch products belonging to this category
  const { data: products } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        url,
        position
      ),
      categories (
        name,
        slug
      )
    `
    )
    .eq('category_id', category.id)

  const typedProducts = (products as unknown as Product[]) || []

  const productCount = typedProducts.length

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Collection Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white">
            {category.name}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl">
            Discover premium handcrafted pieces.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-zinc-500 tracking-wide">
            {productCount} {productCount === 1 ? 'Product' : 'Products'}
          </p>
        </div>

        {/* Client-side interactive area */}
        <CollectionClient
          products={typedProducts}
          categoryName={category.name}
          productCount={productCount}
        />
      </div>
    </div>
  )
}
