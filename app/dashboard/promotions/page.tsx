import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { PromotionsCMS } from '@/components/dashboard/PromotionsCMS'

export const metadata: Metadata = {
  title: 'Promociones · Dashboard',
  robots: { index: false, follow: false },
}

export default function PromotionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Promociones</h1>
          <p className="text-warm-500 text-sm mt-1">Gestiona descuentos activos y futuros</p>
        </div>
        <PromotionsCMS />
      </div>
    </DashboardLayout>
  )
}
