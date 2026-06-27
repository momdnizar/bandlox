'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface ProductImage {
  url: string
  position: number
}

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  stock: number
  product_images: ProductImage[]
}

export default function ProductCard({ product }: { product: Product }) {
  const productTitle = product.title?.trim() || 'Bandlox product'
  const [imgSrc, setImgSrc] = useState<string>(
    product.product_images?.find((img) => img.position === 1)?.url ||
      product.product_images?.[0]?.url ||
      '/placeholder.svg'
  )

  const secondImage =
    product.product_images?.find((img) => img.position === 2)?.url ||
    product.product_images?.[1]?.url ||
    null

  const isSale =
    product.compare_at_price !== null && product.compare_at_price > product.price
  const isSoldOut = product.stock <= 0

  const handleMouseEnter = () => {
    if (secondImage) {
      setImgSrc(secondImage)
    }
  }

  const handleMouseLeave = () => {
    setImgSrc(
      product.product_images?.find((img) => img.position === 1)?.url ||
        product.product_images?.[0]?.url ||
        '/placeholder.svg'
    )
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col bg-black rounded-sm overflow-hidden transition-all duration-500 ease-out border border-zinc-800 hover:border-zinc-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]"
      aria-label={`View ${productTitle}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
        <Image
          src={imgSrc || '/placeholder.svg'}
          alt={`${productTitle} product image`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isSale && (
            <span className="px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white bg-black border border-zinc-600">
              Sale
            </span>
          )}
          {isSoldOut && (
            <span className="px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white bg-black border border-zinc-600">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-medium text-sm text-white truncate">
          {productTitle}
        </h3>

        <div className="flex items-center gap-2">
          {isSale ? (
            <>
              <span className="text-sm text-white font-medium">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-zinc-500 line-through">
                ₹{product.compare_at_price!.toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <span className="text-sm text-white font-medium">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
