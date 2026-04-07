import { Metadata } from 'next'
import { BranchLogin } from '@/components/dashboard/BranchLogin'

export const metadata: Metadata = {
  title: 'Acceso Staff · Rishtedar',
  robots: { index: false, follow: false },
}

export default function DashboardLoginPage() {
  return <BranchLogin />
}
