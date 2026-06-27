import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutResumeClient from './CheckoutResumeClient'

interface ResumeCheckoutPageProps {
  searchParams: Promise<{ orderId?: string }>
}

/**
 * Resume Checkout Page
 *
 * Loads an abandoned order and passes it to the client component
 * which restores the cart and redirects to checkout.
 *
 * If the order is already paid, redirects to /checkout/success.
 */
export default async function ResumeCheckoutPage({
  searchParams,
}: ResumeCheckoutPageProps) {
  const { orderId } = await searchParams

  if (!orderId) {
    redirect('/checkout')
  }

  const supabase = await createClient()

  // Fetch the order with its items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[resume-checkout] Order not found:', orderId, orderError)
    redirect('/checkout')
  }

  // If already paid, redirect to success
  if (order.payment_status === 'paid' || order.payment_status === 'completed') {
    redirect(`/checkout/success?orderId=${orderId}`)
  }

  // Fetch order items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error('[resume-checkout] Order items not found:', orderId, itemsError)
    redirect('/checkout')
  }

  // Transform items to the CartItem format expected by the client
  const items = orderItems.map((item) => ({
    id: item.product_id,
    slug: item.product_name.toLowerCase().replace(/\s+/g, '-'),
    title: item.product_name,
    image: '', // Will be populated by the client if available
    price: item.price,
    quantity: item.quantity,
    variant: item.variant || undefined,
  }))

  // Pre-fill customer data for the checkout form
  const customerData = {
    name: order.customer_name || '',
    email: order.email || '',
    phone: order.phone || '',
    address: order.address || '',
    city: order.city || '',
    state: order.state || '',
    postal_code: order.postal_code || '',
  }

  return (
    <CheckoutResumeClient
      orderId={order.id}
      items={items}
      customerData={customerData}
    />
  )
}