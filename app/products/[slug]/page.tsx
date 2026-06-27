import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductDetailClient from './ProductDetailClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface ProductImage {
  id: string
  url: string
  position: number
}

interface ProductVariant {
  id: string
  name: string
  value: string
  stock: number
  price_adjustment: number
}

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  stock: number
  category_id: string
  product_images: ProductImage[]
  product_variants: ProductVariant[]
}

interface RelatedProduct {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price: number | null
  stock: number
  product_images: ProductImage[]
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('slug', slug)
    .single()

  const productName = product?.title || 'Product'

  return {
    title: `${productName} — Bandlox`,
    description: `Discover ${productName} — premium handcrafted jewelry piece.`,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  console.log("slug", slug)

  // Fetch product with images and variants
  // NOTE: product_variants table exists but is empty.
  // Using (*) to avoid referencing non-existent columns like price_adjustment.
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        url,
        position
      ),
      product_variants (
        id,
        name,
        value,
        stock
      )
    `
    )
    .eq('slug', slug)
    .single()

  console.log("product", product)
  console.log("error", error)

  if (error || !product) {
    console.error('[product] Query failed for slug:', slug, 'error:', error?.message)
    notFound()
  }

  const typedProduct = product as unknown as Product

  // Fetch related products (same category, exclude current)
  const { data: relatedProductsData } = await supabase
    .from('products')
    .select(
      `
      id,
      title,
      slug,
      price,
      compare_at_price,
      stock,
      product_images (
        id,
        url,
        position
      )
    `
    )
    .eq('category_id', typedProduct.category_id)
    .neq('id', typedProduct.id)
    .limit(4)

  const relatedProducts = (relatedProductsData as unknown as RelatedProduct[]) || []

  // Sort images by position
  const sortedImages = [...(typedProduct.product_images || [])].sort(
    (a, b) => a.position - b.position
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-zinc-500">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/collections" className="hover:text-white transition-colors">
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-zinc-300 truncate">{typedProduct.title}</li>
          </ol>
        </nav>

        {/* Product Detail Client */}
        <ProductDetailClient
          product={typedProduct}
          sortedImages={sortedImages}
          relatedProducts={relatedProducts}
        />

        {/* Product Description */}
        {typedProduct.description && (
          <section className="mt-20 md:mt-28 border-t border-zinc-800 pt-12 md:pt-16">
            <div className="max-w-3xl">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-6">
                Description
              </h2>
              <div className="text-base md:text-lg text-zinc-300 leading-relaxed whitespace-pre-line">
                {typedProduct.description}
              </div>
            </div>
          </section>
        )}

        {/* Additional Details Grid */}
        <section className="mt-16 md:mt-24 border-t border-zinc-800 pt-12 md:pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col gap-2 p-4 border border-zinc-800 rounded-sm">
              <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                Premium Craftsmanship
              </span>
              <span className="text-sm text-zinc-400">
                Handcrafted with precision and care.
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4 border border-zinc-800 rounded-sm">
              <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                Hypoallergenic Materials
              </span>
              <span className="text-sm text-zinc-400">
                Safe for sensitive skin.
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4 border border-zinc-800 rounded-sm">
              <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                Secure Checkout
              </span>
              <span className="text-sm text-zinc-400">
                Encrypted payment processing.
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4 border border-zinc-800 rounded-sm">
              <span className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                Worldwide Shipping
              </span>
              <span className="text-sm text-zinc-400">
                Free delivery on orders above ₹999.
              </span>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-zinc-800 pt-12 md:pt-16">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.slug}`}
                  className="group relative flex flex-col bg-black rounded-sm overflow-hidden transition-all duration-500 border border-zinc-800 hover:border-zinc-600"
                  aria-label={`View ${relatedProduct.title}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
                    <img
                      src={
                        relatedProduct.product_images?.find((img) => img.position === 1)
                          ?.url ||
                        relatedProduct.product_images?.[0]?.url ||
                        '/placeholder.svg'
                      }
                      alt={`${relatedProduct.title} - Bandlox`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {relatedProduct.compare_at_price &&
                      relatedProduct.compare_at_price > relatedProduct.price && (
                        <span className="absolute top-3 left-3 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white bg-black border border-zinc-600">
                          Sale
                        </span>
                      )}
                    {relatedProduct.stock <= 0 && (
                      <span className="absolute top-3 left-3 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white bg-black border border-zinc-600">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 p-4">
                    <h3 className="font-medium text-sm text-white truncate">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {relatedProduct.compare_at_price &&
                      relatedProduct.compare_at_price > relatedProduct.price ? (
                        <>
                          <span className="text-sm text-white font-medium">
                            ₹{relatedProduct.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-sm text-zinc-500 line-through">
                            ₹{relatedProduct.compare_at_price.toLocaleString('en-IN')}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-white font-medium">
                          ₹{relatedProduct.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}