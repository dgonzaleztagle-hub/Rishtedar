import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { CircleDashboard } from '@/components/circle/CircleDashboard'

export const metadata: Metadata = {
  title: 'Mi Circle — Rishtedar',
  robots: { index: false, follow: false },
}

export default function CircleDashboardPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-warm-950">
        <CircleDashboard />
      </main>
    </>
  )
}
