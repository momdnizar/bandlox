import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Customer {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country?: string
}

interface CheckoutItem {
  id: string
  title: string
  price: number
  quantity: number
  variant?: string
}

interface CheckoutRequest {
  customer: Customer
  items: CheckoutItem[]
  subtotal: number
}

export async function POST(request: Request) {
  try {
    const body: CheckoutRequest = await request.json()

    const { customer, items, subtotal } = body

    // Always set country to India
    customer.country = 'India'

    // Validate required fields
    if (!customer.name || !customer.email || !customer.phone || !customer.address) {
      return NextResponse.json(
        { error: 'Missing required customer fields' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Build shipping address as JSONB for the actual schema
    const shippingAddress = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
    }

    // Create the order — using actual schema columns
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        total: subtotal,
        shipping_address: shippingAddress,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json(
        { error: 'Unable to place order. Please try again.' },
        { status: 500 }
      )
    }

    // Insert order items — using actual schema columns
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      // Attempt to clean up the order if items fail
      await supabase.from('orders').delete().eq('id', order.id)

      return NextResponse.json(
        { error: 'Unable to place order. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { orderId: order.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Unable to place order. Please try again.' },
      { status: 500 }
    )
  }
}