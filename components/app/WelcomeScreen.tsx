'use client'

import Link from 'next/link'
import { UtensilsCrossed, ShoppingBag } from 'lucide-react'

interface WelcomeScreenProps {
  onActivate: () => void
}

export function WelcomeScreen({ onActivate }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center mb-5">
        <UtensilsCrossed size={20} className="text-gold-400" />
      </div>
      <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-2">Rishtedar</p>
      <h1 className="font-display text-4xl italic text-ivory mb-3">Bienvenido</h1>
      <p className="text-warm-400 text-sm leading-relaxed max-w-xs mb-8">
        Acumula puntos, sigue tus pedidos y compite en el ranking semanal.
      </p>
      <button
        onClick={onActivate}
        className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
      >
        Activar mi Circle
      </button>
      <Link href="/order" className="mt-4 text-warm-600 hover:text-warm-400 text-sm transition-colors flex items-center gap-1.5">
        <ShoppingBag size={13} />
        Pedir sin registro
      </Link>
    </div>
  )
}
