'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { RishtedarGame } from '@/components/pwa/RishtedarGame'

export function DemoGamePage() {
  return (
    <main className="bg-warm-950 pt-28 md:pt-36">
      <section className="container mx-auto px-6 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-warm-500 transition-colors hover:text-gold-500"
        >
          <ArrowLeft size={14} />
          <span className="text-[10px] uppercase tracking-[0.28em]">Volver a Rishtedar</span>
        </Link>
      </section>

      <section className="container mx-auto px-6 pb-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold-600">
            Demo Privada
          </p>
          <h1 className="font-display text-5xl italic leading-none text-ivory md:text-7xl">
            El Festin de Especias
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-warm-400 md:text-base">
            Una muestra directa del minijuego semanal de Rishtedar. Aqui se puede jugar de inmediato, sin registro,
            para revisar arte, sensacion general y lectura del flujo de cocina.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-gold-700/50 bg-gold-900/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-gold-500">
            Modo Demo · Sin Registro
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-warm-800 bg-warm-900/60 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-warm-300">
            <Sparkles size={12} />
            Revision de gameplay y arte
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10 md:px-6 md:pb-14">
        <RishtedarGame onGameEnd={() => {}} tokensLeft={0} />
      </section>
    </main>
  )
}
