import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MenuView } from '@/components/dashboard/MenuView'

export const metadata: Metadata = {
  title: 'Menú · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function MenuAdminPage() {
  return (
    <DashboardLayout>
      <MenuView />
    </DashboardLayout>
  )
}
