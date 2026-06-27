'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

interface ProductImage {
  id: string
  url: string
  position: number
}

interface Props {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const productTitle = productName?.trim() || 'Bandlox product'

  const hasImages = images.length > 0
  const mainImage = hasImages
    ? images[activeIndex]?.url || images[0]?.url
    : '/placeholder.svg'

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      {/* Main Image — capped height on desktop */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-zinc-950 lg:max-h-[700px]">
        <Image
          src={mainImage}
          alt={`${productTitle} product image ${activeIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover transition-opacity duration-500"
          priority={activeIndex === 0}
          loading={activeIndex === 0 ? 'eager' : 'lazy'}
        />
        {!hasImages && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-zinc-600 text-sm uppercase tracking-[0.1em]">
              No Image Available
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasImages && images.length > 1 && (
        <div
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-thin"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1} of ${images.length}`}
              className={`relative w-14 h-18 sm:w-16 sm:h-20 flex-shrink-0 overflow-hidden rounded-sm border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                index === activeIndex
                  ? 'border-white opacity-100'
                  : 'border-zinc-800 opacity-60 hover:opacity-90'
              }`}
            >
              <Image
                src={image.url}
                alt={`${productTitle} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
