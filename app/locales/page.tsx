import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

import { LocationsGrid } from '@/components/locales/LocationsGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuestros Locales',
  description:
    'Visítanos en Providencia, Vitacura, La Reina, La Dehesa (Santiago) o en Wynwood, Miami. Reserva tu mesa o pide delivery desde tu local más cercano.',
  alternates: { canonical: '/locales' },
}

export default function LocalesPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Page hero */}
        <div className="bg-warm-950 py-14 sm:py-20 md:py-28 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 100%, #c9952a 0%, transparent 60%)',
            }}
          />
          <div className="relative container mx-auto px-6">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-3">
              Santiago & Miami
            </p>
            <h1 className="font-display text-3xl sm:text-5xl md:text-7xl italic text-ivory">
              Nuestros locales
            </h1>
            <p className="text-warm-300 mt-4 max-w-xl mx-auto text-base sm:text-lg">
              Cinco espacios pensados para que te sientas en casa, con la esencia de India en cada detalle.
            </p>
          </div>
        </div>
        <LocationsGrid />
      </main>
      <Footer />
    </>
  )
}
