import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LoyaltyConfigView } from '@/components/dashboard/LoyaltyConfigView'

export const metadata: Metadata = {
  title: 'Loyalty & Premios · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function LoyaltyPage() {
  return (
    <DashboardLayout>
      <LoyaltyConfigView />
    </DashboardLayout>
  )
}
