import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendOrderConfirmation } from '@/lib/email/sendOrderConfirmation'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase is not configured.')
  }

  return createClient(url, key)
}

function getKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    throw new Error('Razorpay is not configured. Missing RAZORPAY_KEY_SECRET.')
  }
  return secret
}

interface VerifyRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: string
}

/**
 * Fetch order + items and send the confirmation email.
 * Updates email_sent / email_sent_at to prevent duplicate sends.
 *
 * This is deliberately non-blocking — failures are logged and swallowed
 * so they never interrupt the checkout success response.
 */
async function handleOrderConfirmationEmail(
  supabase: ReturnType<typeof getSupabaseClient>,
  orderId: string
) {
  // ── 1. Fetch order ──
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error(
      `[handleOrderConfirmationEmail] Order ${orderId} not found:`,
      orderError
    )
    return
  }

  // ── 2. Skip if already sent (idempotency) ──
  if (order.email_sent === true) {
    console.log(
      `[handleOrderConfirmationEmail] Email already sent for order ${orderId}, skipping.`
    )
    return
  }

  // ── 3. Fetch order items ──
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error(
      `[handleOrderConfirmationEmail] Failed to fetch items for order ${orderId}:`,
      itemsError
    )
    return
  }

  // ── 4. Build item list for email (fetch product images) ──
  const items = await Promise.all(
    orderItems.map(async (item: Record<string, unknown>) => {
      let image = ''

      if (item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('image')
          .eq('id', item.product_id)
          .single()

        if (product?.image) {
          image = product.image as string
        }
      }

      return {
        image,
        title: (item.product_name as string) ?? '',
        variant: (item.variant as string | null) ?? null,
        quantity: (item.quantity as number) ?? 1,
        price: (item.price as number) ?? 0,
      }
    })
  )

  // ── 5. Send email ──
  const orderNumber = orderId.slice(0, 8).toUpperCase()
  const subtotal = (order.subtotal as number) ?? 0
  const shipping = (order.shipping as number) ?? 0
  const total = subtotal + shipping

  const result = await sendOrderConfirmation({
    orderId,
    orderNumber,
    orderDate: new Date(order.created_at as string).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    paymentStatus: 'Paid',
    customerName: (order.customer_name as string) ?? '',
    customerEmail: (order.email as string) ?? '',
    customerPhone: (order.phone as string) ?? '',
    shippingAddress: (order.address as string) ?? '',
    shippingCity: (order.city as string) ?? '',
    shippingState: (order.state as string) ?? '',
    shippingPostalCode: (order.postal_code as string) ?? '',
    items,
    subtotal,
    shipping,
    total,
  })

  // ── 6. Mark email as sent (even if it partly failed — prevents retry floods) ──
  if (result.success) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error(
        `[handleOrderConfirmationEmail] Failed to update email_sent for order ${orderId}:`,
        updateError
      )
    } else {
      console.log(
        `[handleOrderConfirmationEmail] email_sent=true for order ${orderId}`
      )
    }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()

    const body: VerifyRequest = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body

    // ── Validate required fields ──
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      )
    }

    // ── Verify Razorpay signature ──
    const keySecret = getKeySecret()
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Invalid signature — mark payment as failed
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          razorpay_payment_id,
          razorpay_order_id,
        })
        .eq('id', order_id)
        .eq('razorpay_order_id', razorpay_order_id)

      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      )
    }

    // ── Verify order exists and matches ──
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, razorpay_order_id, payment_status, status')
      .eq('id', order_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Prevent double payment
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Payment has already been completed for this order' },
        { status: 400 }
      )
    }

    // ── Update order with payment details ──
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id,
        razorpay_order_id,
        payment_status: 'paid',
        payment_method: 'razorpay',
        paid_at: new Date().toISOString(),
        status: 'confirmed',
      })
      .eq('id', order_id)
      .eq('razorpay_order_id', razorpay_order_id)

    if (updateError) {
      console.error('Failed to update order payment status:', updateError)
      return NextResponse.json(
        { error: 'Unable to confirm payment. Please contact support.' },
        { status: 500 }
      )
    }

    // ── Send order confirmation email (non-blocking) ──
    handleOrderConfirmationEmail(supabase, order_id).catch((err) => {
      console.error(
        `[verify] Unhandled error in handleOrderConfirmationEmail for order ${order_id}:`,
        err
      )
    })

    // ── Return success ──
    return NextResponse.json({
      success: true,
      order_id,
      payment_status: 'paid',
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.' },
      { status: 500 }
    )
  }
}