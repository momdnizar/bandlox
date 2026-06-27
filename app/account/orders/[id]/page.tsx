import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetail from './OrderDetail'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { id } = await params

  // Fetch the order, ensuring it belongs to the authenticated user
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('email', user.email)
    .single()

  if (error || !order) {
    notFound()
  }

  // Fetch order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  return <OrderDetail order={order} items={(items ?? []) as OrderItem[]} />
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
  variant: string | null
}