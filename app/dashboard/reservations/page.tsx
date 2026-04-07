import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ReservationsView } from '@/components/dashboard/ReservationsView'

export const metadata: Metadata = {
  title: 'Reservas · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <ReservationsView />
    </DashboardLayout>
  )
}
