import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

import { ReservationForm } from '@/components/reservar/ReservationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar mesa',
  description:
    'Reserva tu mesa en Rishtedar. Disponibilidad en tiempo real para Providencia, Vitacura, La Reina, La Dehesa y Miami. Confirmación inmediata.',
  alternates: { canonical: '/reservar' },
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string }>
}) {
  const { local } = await searchParams

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <div className="bg-warm-950 py-14 sm:py-20 md:py-28 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 100%, #c9952a 0%, transparent 60%)' }}
          />
          <div className="relative container mx-auto px-6">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-3">
              Confirma tu lugar
            </p>
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl italic text-ivory">Reservar mesa</h1>
            <p className="text-warm-300 mt-4 max-w-xl mx-auto text-base sm:text-lg">
              Confirmación instantánea. Te enviaremos un email con todos los detalles.
            </p>
          </div>
        </div>
        <ReservationForm initialLocal={local} />
      </main>
      <Footer />
    </>
  )
}
