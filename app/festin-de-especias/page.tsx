import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { DemoGamePage } from './DemoGamePage'

export const metadata: Metadata = {
  title: 'El Festin de Especias · Demo',
  description: 'Demo publica del minijuego semanal de Rishtedar para revision interna.',
  alternates: {
    canonical: '/festin-de-especias',
  },
}

export default function FestinDeEspeciasPage() {
  return (
    <>
      <Header />
      <DemoGamePage />
      <Footer />
    </>
  )
}
