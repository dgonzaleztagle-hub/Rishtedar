import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { OrdersView } from '@/components/dashboard/OrdersView'

export const metadata: Metadata = {
  title: 'Órdenes · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersView />
    </DashboardLayout>
  )
}
