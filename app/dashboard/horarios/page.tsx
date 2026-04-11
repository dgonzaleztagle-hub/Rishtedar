import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { HorariosView } from '@/components/dashboard/HorariosView'

export const metadata: Metadata = {
  title: 'Horarios — Dashboard Rishtedar',
  robots: { index: false, follow: false },
}

export default function HorariosPage() {
  return (
    <DashboardLayout>
      <HorariosView />
    </DashboardLayout>
  )
}
