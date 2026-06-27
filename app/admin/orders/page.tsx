import OrdersClient from './OrdersClient'

export const metadata = {
  title: 'Orders | Bandlox Admin',
  description: 'Manage Bandlox orders',
}

export default function AdminOrdersPage() {
  return <OrdersClient />
}