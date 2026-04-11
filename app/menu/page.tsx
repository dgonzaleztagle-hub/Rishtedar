import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PromoBanner } from '@/components/home/PromoBanner'
import { MenuCatalog } from '@/components/menu/MenuCatalog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Menú',
  description:
    'Explora nuestra carta de cocina india auténtica. Entradas, platos principales, biryanis, tandoor y postres. Opciones vegetarianas, veganas y sin gluten.',
  alternates: { canonical: '/menu' },
}

export default function MenuPage() {
  return (
    <>
      <PromoBanner />
      <Header />
      <main className="pt-20">
        <div className="bg-warm-950 py-20 md:py-28 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 100%, #c9952a 0%, transparent 60%)',
            }}
          />
          <div className="relative container mx-auto px-6">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-3">
              Cocina india auténtica
            </p>
            <h1 className="font-display text-5xl md:text-7xl italic text-ivory">
              Nuestra carta
            </h1>
            <p className="text-warm-300 mt-5 max-w-xl mx-auto text-lg">
              Cada plato es una historia. Especias seleccionadas, técnicas ancestrales y el sabor que nos define.
            </p>
          </div>
        </div>
        <Suspense>
          <MenuCatalog />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
