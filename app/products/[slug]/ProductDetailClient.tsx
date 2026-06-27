'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'
import QuantitySelector from '@/components/QuantitySelector'

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

interface Props {
  product: Product
  sortedImages: ProductImage[]
  relatedProducts: RelatedProduct[]
}

export default function ProductDetailClient({
  product,
  sortedImages,
}: Props) {
  const variants = useMemo(
    () => product.product_variants || [],
    [product.product_variants]
  )
  const firstAvailableVariant = useMemo(
    () => variants.find((variant) => variant.stock > 0) || null,
    [variants]
  )

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    firstAvailableVariant
  )
  const [quantity, setQuantity] = useState(1)
  const [purchaseMessage, setPurchaseMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [processingAction, setProcessingAction] = useState<
    'add-to-cart' | 'buy-now' | null
  >(null)

  const hasVariants = variants.length > 0

  const isSale =
    product.compare_at_price !== null && product.compare_at_price > product.price

  const discountPercent = isSale
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
      )
    : 0

  // ──────────────────────────────────────────────────────────────
  // Safe number helpers — guard against null/undefined/NaN
  // ──────────────────────────────────────────────────────────────
  const toFiniteNumber = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    return fallback
  }

  // Resolve stock: DB may have `in_stock` (boolean) instead of `stock` (int).
  // `product` may have `in_stock` from a `SELECT *` query. If `stock` is
  // null/undefined and `in_stock` is true, default to a high value.
  const productStock = typeof (product as any).stock === 'number'
    ? (product as any).stock
    : (product as any).in_stock === true
    ? 9999  // in stock but no count — treat as high availability
    : 0

  // Stock & price logic — no variant selected ≠ sold out
  const rawStock = selectedVariant
    ? selectedVariant.stock
    : hasVariants
    ? Math.max(...variants.map((v) => toFiniteNumber(v.stock, 0)), 0)
    : productStock

  const effectiveStock = toFiniteNumber(rawStock, 0)

  // price_adjustment may be undefined if DB query doesn't fetch it
  const rawPriceAdjustment = selectedVariant ? selectedVariant.price_adjustment : 0
  const priceAdjustment = toFiniteNumber(rawPriceAdjustment, 0)
  const effectivePrice = product.price + priceAdjustment

  // Safe quantity — guard against NaN from stock computation
  const rawSafeQuantity = hasVariants && !selectedVariant
    ? Math.max(1, quantity)
    : Math.min(
        Math.max(1, quantity),
        Math.max(1, effectiveStock)
      )
  const safeQuantity = toFiniteNumber(rawSafeQuantity, 1)

  // Sold out only when there is genuinely no stock available
  const isSoldOut = selectedVariant
    ? toFiniteNumber(selectedVariant.stock, 0) <= 0
    : hasVariants
    ? variants.every((v) => toFiniteNumber(v.stock, 0) <= 0)
    : productStock <= 0

  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
    setPurchaseMessage(null)
  }, [])

  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const replaceCart = useCartStore((state) => state.replaceCart)
  const openCart = useCartStore((state) => state.openCart)
  const cartItems = useCartStore((state) => state.items)

  // ─────────────────────────────
  // Build cart item from current selection
  // ─────────────────────────────
  const buildCartItem = useCallback(() => {
    const image =
      sortedImages.find((img) => img.position === 1)?.url ||
      sortedImages[0]?.url ||
      '/placeholder.svg'

    const variantString = selectedVariant
      ? `${selectedVariant.name}: ${selectedVariant.value}`
      : undefined

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      image,
      price: effectivePrice,
      quantity: safeQuantity,
      variant: variantString,
      availableStock: effectiveStock,
    }
  }, [
    product.id,
    product.slug,
    product.title,
    sortedImages,
    effectivePrice,
    selectedVariant,
    safeQuantity,
    effectiveStock,
  ])

  const validatePurchase = useCallback(
    (action: 'add-to-cart' | 'buy-now') => {
      if (processingAction) {
        return 'Please wait while we finish the current action.'
      }

      if (hasVariants) {
        if (!selectedVariant) {
          // Get the variant group names to show a specific message
          const groupNames = [...new Set(variants.map((v) => v.name))]
          if (groupNames.length === 1) {
            return `Please select a ${groupNames[0].toLowerCase()}`
          }
          return 'Please select a variant'
        }

        const variantExists = variants.some(
          (variant) => variant.id === selectedVariant.id
        )
        if (!variantExists) {
          return 'Selected variant is no longer available.'
        }

        if (toFiniteNumber(selectedVariant.stock, 0) <= 0) {
          return 'Selected variant is out of stock.'
        }
      }

      if (effectiveStock <= 0) {
        return 'Out of Stock'
      }

      if (!Number.isInteger(safeQuantity) || safeQuantity < 1) {
        return 'Please choose at least 1 item.'
      }

      if (safeQuantity > effectiveStock) {
        return `Only ${effectiveStock} available. Please reduce quantity.`
      }

      if (action === 'add-to-cart') {
        const item = buildCartItem()
        const existingQuantity =
          cartItems.find(
            (cartItem) =>
              cartItem.id === item.id && cartItem.variant === item.variant
          )?.quantity || 0

        if (existingQuantity + safeQuantity > effectiveStock) {
          return `Only ${effectiveStock} available. You already have ${existingQuantity} in cart.`
        }
      }

      return null
    },
    [
      processingAction,
      hasVariants,
      selectedVariant,
      variants,
      effectiveStock,
      safeQuantity,
      buildCartItem,
      cartItems,
    ]
  )

  // ─────────────────────────────
  // Add To Cart — opens drawer
  // ─────────────────────────────
  const handleAddToCart = useCallback(() => {
    console.log('ADD TO CART CLICK')
    const validationError = validatePurchase('add-to-cart')
    if (validationError) {
      setPurchaseMessage({ type: 'error', text: validationError })
      return
    }

    setProcessingAction('add-to-cart')
    setPurchaseMessage(null)

    try {
      const item = buildCartItem()
      addItem(item)
      openCart()
      setPurchaseMessage({ type: 'success', text: 'Added to cart.' })
    } catch (error) {
      setPurchaseMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to add this item to cart.',
      })
    } finally {
      setProcessingAction(null)
    }
  }, [validatePurchase, buildCartItem, addItem, openCart])

  // ─────────────────────────────
  // Buy Now — replace cart, redirect, no drawer
  // ─────────────────────────────
  const handleBuyNow = useCallback(() => {
    console.log('BUY NOW CLICK')
    const validationError = validatePurchase('buy-now')
    if (validationError) {
      setPurchaseMessage({ type: 'error', text: validationError })
      return
    }

    setProcessingAction('buy-now')
    setPurchaseMessage(null)

    try {
      const item = buildCartItem()
      replaceCart(item)
      router.push('/checkout')
    } catch (error) {
      setPurchaseMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to prepare checkout.',
      })
      setProcessingAction(null)
    }
  }, [validatePurchase, buildCartItem, replaceCart, router])

  const isPurchasing = processingAction !== null
  // Do not disable buttons when variant not selected —
  // validation message guides the user instead
  const isPurchaseDisabled = isSoldOut || isPurchasing

  // Variant names for the "required" hint
  const variantGroupNames = hasVariants
    ? [...new Set(variants.map((v) => v.name))]
    : []

  // ─────────────────────────────
  // Sticky Mobile Purchase Bar
  // ─────────────────────────────
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)

  useEffect(() => {
    const titleEl = titleRef.current
    if (!titleEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when title is NOT intersecting (scrolled past)
        setShowStickyBar(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(titleEl)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Main Product Area */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
        {/* Gallery */}
        <div className="w-full lg:w-[55%] xl:w-[60%]">
          <ProductGallery images={sortedImages} productName={product.title} />
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          {/* Product Title — observed for sticky bar trigger */}
          <h1
            ref={titleRef}
            className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.08em] text-white"
          >
            {product.title}
          </h1>

          {/* Pricing */}
          <div className="flex items-center gap-3 flex-wrap">
            {isSale ? (
              <>
                <span className="text-2xl md:text-3xl font-medium text-white">
                  ₹{Number.isFinite(effectivePrice) ? effectivePrice.toLocaleString('en-IN') : product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xl md:text-2xl text-zinc-500 line-through">
                  ₹{Number.isFinite(product.compare_at_price! + priceAdjustment) ? (product.compare_at_price! + priceAdjustment).toLocaleString('en-IN') : product.compare_at_price!.toLocaleString('en-IN')}
                </span>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-red-400 border border-red-900/50 bg-red-950/30">
                  {discountPercent}% OFF
                </span>
              </>
            ) : (
              <span className="text-2xl md:text-3xl font-medium text-white">
                ₹{Number.isFinite(effectivePrice) ? effectivePrice.toLocaleString('en-IN') : product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isSoldOut ? 'bg-red-500' : 'bg-green-500'
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-sm font-medium uppercase tracking-[0.1em] ${
                isSoldOut ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {isSoldOut ? 'Sold Out' : 'In Stock'}
            </span>
          </div>

          <hr className="border-zinc-800" />

          {/* Variant Selector */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="flex flex-col gap-2">
              <VariantSelector
                variants={product.product_variants}
                selectedVariant={selectedVariant}
                onVariantChange={handleVariantChange}
              />
              {/* Visual hint when variant is required but not selected */}
              {!selectedVariant && !isSoldOut && (
                <p className="text-xs text-amber-400/80 tracking-wide mt-1">
                  Select a{' '}
                  {variantGroupNames.length === 1
                    ? variantGroupNames[0].toLowerCase()
                    : 'variant'}{' '}
                  to purchase
                </p>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          {!isSoldOut && (
            <QuantitySelector
              quantity={safeQuantity}
              maxQuantity={hasVariants && !selectedVariant ? 99 : effectiveStock}
              onQuantityChange={(nextQuantity) => {
                const clamped = Math.min(
                  Math.max(1, toFiniteNumber(nextQuantity, 1)),
                  Math.max(1, effectiveStock)
                )
                setQuantity(Number.isFinite(clamped) ? clamped : 1)
              }}
            />
          )}

          {purchaseMessage && (
            <p
              className={`text-sm ${
                purchaseMessage.type === 'success'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
              role="status"
              aria-live="polite"
            >
              {purchaseMessage.text}
            </p>
          )}

          {/* ─────────── CTA Buttons Area ─────────── */}
          {/* Always show CTA buttons unless truly sold out */}
          {!isSoldOut && (
            <div className="flex flex-col gap-3">
              {/* Desktop: side-by-side | Mobile: stacked */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Buy Now — visually dominant */}
                <button
                  onClick={handleBuyNow}
                  disabled={isPurchaseDisabled}
                  className="w-full min-h-[48px] py-4 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-600 active:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30 hover:shadow-amber-800/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label="Buy this product now"
                >
                  {processingAction === 'buy-now' ? 'Processing...' : 'Buy Now'}
                </button>

                {/* Add To Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isPurchaseDisabled}
                  className="w-full min-h-[48px] py-4 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-500 disabled:border-zinc-800 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label="Add to cart"
                >
                  {processingAction === 'add-to-cart' ? 'Adding...' : 'Add To Cart'}
                </button>
              </div>

              {/* ─────────── Trust Badges ─────────── */}
              <div className="flex flex-col gap-2 py-3 border-t border-zinc-800 mt-1">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <span className="text-xs text-zinc-400 tracking-wide">
                    Secure Checkout
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                  <span className="text-xs text-zinc-400 tracking-wide">
                    Fast Shipping Across India
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg
                    className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z"
                    />
                  </svg>
                  <span className="text-xs text-zinc-400 tracking-wide">
                    Order Confirmation via Email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sold Out state — single disabled button */}
          {isSoldOut && (
            <button
              disabled
              className="w-full min-h-[48px] py-4 px-6 text-sm font-semibold uppercase tracking-[0.2em] bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
              aria-label="This product is sold out"
            >
              Out of Stock
            </button>
          )}

          {/* Product Details Summary */}
          <div className="flex flex-col gap-3 text-sm text-zinc-400 mt-2">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Premium handcrafted quality</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>Free shipping on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>30-day easy returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Sticky Mobile Purchase Bar ───────── */}
      {/* Only visible on screens < 1024px (lg breakpoint) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Price */}
          <div className="flex-1 min-w-0">
            <span className="text-lg sm:text-xl font-semibold text-white">
              ₹{Number.isFinite(effectivePrice) ? effectivePrice.toLocaleString('en-IN') : product.price.toLocaleString('en-IN')}
            </span>
            {isSale && (
              <span className="ml-2 text-sm text-zinc-500 line-through">
                ₹{Number.isFinite(product.compare_at_price! + priceAdjustment) ? (product.compare_at_price! + priceAdjustment).toLocaleString('en-IN') : product.compare_at_price!.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            disabled={isPurchaseDisabled}
            className="flex-shrink-0 min-h-[48px] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-600 active:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label="Buy this product now"
          >
            {processingAction === 'buy-now' ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </>
  )
}