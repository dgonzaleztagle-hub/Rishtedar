import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { KPICards } from '@/components/dashboard/KPICards'
import { LiveOrdersFeed } from '@/components/dashboard/LiveOrdersFeed'
import { ReservationsToday } from '@/components/dashboard/ReservationsToday'
import { RevenueChart } from '@/components/dashboard/RevenueChart'

export const metadata: Metadata = {
  title: 'Dashboard · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Vista general</h1>
          <p className="text-warm-500 text-sm mt-1">Actualización en tiempo real</p>
        </div>
        <KPICards />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <ReservationsToday />
          </div>
        </div>
        <LiveOrdersFeed />
      </div>
    </DashboardLayout>
  )
}
