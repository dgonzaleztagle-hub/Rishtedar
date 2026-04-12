import { Metadata } from 'next'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardScannerView } from '@/components/dashboard/ScannerView'

export const metadata: Metadata = {
  title: 'Escáner Circle · Rishtedar Staff',
  robots: { index: false, follow: false },
}

export default function ScannerPage() {
  return (
    <DashboardLayout>
      <DashboardScannerView />
    </DashboardLayout>
  )
}
