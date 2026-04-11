import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CircleContent } from '@/components/circle/CircleContent'

export const metadata: Metadata = {
  title: 'Rishtedar Circle — Club de Fidelidad',
  description:
    'Únete a Rishtedar Circle. Acumula puntos en cada visita, desbloquea beneficios exclusivos y recibe sorpresas en tu cumpleaños.',
  alternates: { canonical: '/circle' },
}

export default function CirclePage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen">
        <CircleContent />
      </main>
      <Footer />
    </>
  )
}
