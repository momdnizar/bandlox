import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountDashboard from './AccountDashboard'

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, status, subtotal')
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  return (
    <AccountDashboard
      user={user}
      orders={(orders ?? []) as Order[]}
    />
  )
}

export type Order = {
  id: string
  created_at: string
  status: string
  subtotal: number
}