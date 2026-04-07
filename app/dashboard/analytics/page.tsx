import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AnalyticsView } from '@/components/dashboard/AnalyticsView'

export const metadata: Metadata = {
  title: 'Analytics · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsView />
    </DashboardLayout>
  )
}
