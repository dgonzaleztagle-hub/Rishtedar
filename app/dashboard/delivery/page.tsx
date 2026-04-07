import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DeliveryView } from '@/components/dashboard/DeliveryView'

export const metadata: Metadata = {
  title: 'Delivery · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function DeliveryPage() {
  return (
    <DashboardLayout>
      <DeliveryView />
    </DashboardLayout>
  )
}
