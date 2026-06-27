import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Look up an order by ID + email.
 *
 * GET /api/orders/lookup?order_id=xxx&email=yyy
 *
 * Only returns the order if both the ID and email match.
 * Safe for unauthenticated access.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const email = searchParams.get('email')

    if (!orderId || !email) {
      return NextResponse.json(
        { error: 'order_id and email are required' },
        { status: 400 }
      )
    }

    // Normalise email
    const normalisedEmail = email.trim().toLowerCase()

    // Fetch order — only if email matches
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
          id,
          created_at,
          status,
          payment_status,
          subtotal,
          customer_name,
          email,
          tracking_number,
          courier_name,
          tracking_url,
          status_updated_at,
          order_items (
            id,
            product_name,
            price,
            quantity,
            variant
          )
        `
      )
      .eq('id', orderId)
      .eq('email', normalisedEmail)
      .maybeSingle()

    if (error) {
      console.error('[orders/lookup] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to look up order' },
        { status: 500 }
      )
    }

    if (!order) {
      // Don't reveal whether the order exists or the email is wrong
      return NextResponse.json(
        { error: 'Order not found. Please check your order ID and email.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('[orders/lookup] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to look up order' },
      { status: 500 }
    )
  }
}