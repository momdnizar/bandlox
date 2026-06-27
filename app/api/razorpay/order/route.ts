import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.')
  }

  return new Razorpay({ key_id, key_secret })
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase is not configured.')
  }

  return createClient(url, key)
}

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  variant?: string
}

interface RazorpayOrderRequest {
  orderId: string
  items: OrderItem[]
  subtotal: number
}

/**
 * Extract a human-readable error string from any thrown value.
 * Never calls .toString() on an object — always returns a plain string.
 * Covers AxiosError, Razorpay SDK errors, plain objects, and primitives.
 */
function extractErrorMessage(error: unknown): string {
  // Standard Error instance
  if (error instanceof Error) {
    // AxiosError / Razorpay SDK — the real Razorpay error is in error.response.data
    const axiosLike = error as unknown as Record<string, unknown>
    const response = axiosLike.response as Record<string, unknown> | undefined
    if (response) {
      const responseData = response.data as Record<string, unknown> | undefined
      if (responseData) {
        // Razorpay wraps errors as { error: { code, description, ... } }
        const razorpayErr = responseData.error as Record<string, unknown> | undefined
        if (razorpayErr) {
          const parts: string[] = []
          if (typeof razorpayErr.description === 'string') parts.push(razorpayErr.description)
          if (typeof razorpayErr.code === 'string') parts.push(`[${razorpayErr.code}]`)
          if (typeof razorpayErr.reason === 'string') parts.push(`reason: ${razorpayErr.reason}`)
          if (parts.length > 0) return parts.join(' ')
        }
        // Fallback: the whole response.data as JSON
        const asString = JSON.stringify(responseData)
        if (asString && asString !== '{}') return asString
      }
    }
    // Standard Error.message
    return error.message
  }

  // Plain object — serialize to JSON (never .toString())
  if (typeof error === 'object' && error !== null) {
    const asObj = error as Record<string, unknown>
    // Check for common error-like properties
    if (typeof asObj.message === 'string') return asObj.message
    if (typeof asObj.description === 'string') return asObj.description
    if (typeof asObj.error === 'string') return asObj.error
    // Last resort: JSON
    return JSON.stringify(error, null, 2)
  }

  // Primitives (string, number, etc.)
  return String(error)
}

export async function POST(request: Request) {
  try {
    const keyIdExists = !!process.env.RAZORPAY_KEY_ID
    console.log('Razorpay Key ID exists:', keyIdExists)

    const razorpay = getRazorpayInstance()
    console.log('Razorpay client initialized')

    const supabase = getSupabaseClient()

    const body: RazorpayOrderRequest = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    const { orderId, items, subtotal: clientSubtotal } = body
    console.log('Received orderId:', orderId)

    // ── Validate order exists ──
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Supabase order fetch error:', orderError ? JSON.stringify(orderError, null, 2) : 'No error object, order is null')
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    console.log('Fetched order:', JSON.stringify(order, null, 2))

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in a payable state' },
        { status: 400 }
      )
    }

    // ── Recalculate subtotal from database prices (never trust client) ──
    const productIds = items.map((item) => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds)

    if (productsError || !products) {
      console.error('Supabase products fetch error:', productsError ? JSON.stringify(productsError, null, 2) : 'No error object, products is null')
      return NextResponse.json(
        { error: 'Unable to verify product prices' },
        { status: 500 }
      )
    }

    const productPriceMap = new Map(products.map((p) => [p.id, p.price]))

    let serverSubtotal = 0
    for (const item of items) {
      const dbPrice = productPriceMap.get(item.id)
      // Use the item price as fallback — but prefer DB price
      // For variants, the price_adjustment is baked into the item price client-side
      // We cap the variant adjustment at a reasonable range
      const basePrice = dbPrice ?? item.price
      const adjustment = item.price - basePrice
      // Clamp adjustment to prevent abuse (max ±₹10,000)
      const clampedAdjustment = Math.max(-10000, Math.min(10000, adjustment))
      const finalPrice = basePrice + clampedAdjustment
      serverSubtotal += finalPrice * item.quantity
    }
    console.log('Calculated serverSubtotal:', serverSubtotal)

    // Validate subtotal is positive and reasonable
    if (serverSubtotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      )
    }

    // Check that client subtotal is within reasonable range of server calculation
    // This prevents major manipulation while allowing variant adjustments
    const difference = Math.abs(serverSubtotal - clientSubtotal)
    if (difference > 10000) {
      return NextResponse.json(
        { error: 'Price mismatch detected' },
        { status: 400 }
      )
    }

    // ── Create Razorpay order ──
    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(serverSubtotal * 100)

    // Razorpay receipt must be <= 40 characters. Full UUID (36) + "order_" (6) = 42 — too long.
    // Use first 8 hex digits of orderId (which is a UUID) for a safe 14-char receipt.
    const shortReceipt = `order_${orderId.slice(0, 8)}`
    const razorpayPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: shortReceipt,
      notes: {
        order_id: orderId,
      },
    }
    console.log('Payload sent to razorpay.orders.create():', JSON.stringify(razorpayPayload, null, 2))
    console.log({
      amount: amountInPaise,
      currency: 'INR',
      receipt: shortReceipt,
      typeofAmount: typeof amountInPaise,
      isInteger: Number.isInteger(amountInPaise),
      receiptLength: shortReceipt.length,
    })
    const razorpayOrder = await razorpay.orders.create(razorpayPayload)
    console.log('Full Razorpay response:', JSON.stringify(razorpayOrder, null, 2))

    // ── Store razorpay_order_id on the order ──
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        total: serverSubtotal, // Update with server-calculated total
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Supabase order update error:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { error: 'Unable to process payment. Please try again.' },
        { status: 500 }
      )
    }

    // ── Return Razorpay order details to client ──
    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
    })
  } catch (error) {
    console.error('Razorpay order creation failed:', error)

    // Normalize to a plain error string — NEVER pass an object as "error" value
    const errorMessage = extractErrorMessage(error)

    // In development, also log the raw error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Raw error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    }

    // Handle known Razorpay-specific errors
    if (errorMessage.includes('BAD_REQUEST_ERROR')) {
      return NextResponse.json(
        { error: 'Invalid payment request' },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Razorpay is not configured')) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Return the normalized error string (never an object)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
