import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Información de Alérgenos — Rishtedar',
}

const ALLERGENS = [
  { name: 'Gluten', desc: 'Presente en naan, empanadas, pakoras y platos con masa de trigo.' },
  { name: 'Lácteos', desc: 'Presente en curry con base de ghee, paneer, crema y yogurt (dahi).' },
  { name: 'Frutos secos', desc: 'Presente en kormas, biryanis y salsas con base de cajú o almendra.' },
  { name: 'Mariscos', desc: 'Presente en platos con camarones (jheenga) y jaiba.' },
  { name: 'Huevo', desc: 'Presente en algunos panes y salsas mayonesa.' },
  { name: 'Soja', desc: 'Puede estar presente en trazas en algunos platos.' },
]

export default function AlergenosPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <div className="container mx-auto px-6 py-16 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-warm-500 hover:text-brand-700 text-sm mb-8 transition-colors"
          >
            ← Volver al inicio
          </Link>
          <p className="text-brand-600 text-[10px] tracking-[0.3em] uppercase mb-3">Información</p>
          <h1 className="font-display text-4xl sm:text-5xl italic text-warm-950 mb-4">
            Alérgenos
          </h1>
          <p className="text-warm-500 text-sm mb-10 leading-relaxed">
            En Rishtedar trabajamos con especias, lácteos, frutos secos y mariscos de manera habitual.
            Si tienes alguna alergia o intolerancia, infórmanos al hacer tu pedido o reserva.
            Nuestro equipo te orientará sobre los ingredientes de cada plato.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALLERGENS.map(a => (
              <div key={a.name} className="bg-white border border-warm-200 p-5">
                <h3 className="font-display text-xl italic text-warm-900 mb-2">{a.name}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-warm-400 text-xs mt-10 leading-relaxed">
            Esta información es orientativa. Aunque tomamos precauciones para evitar la contaminación cruzada,
            no podemos garantizar la ausencia total de trazas de cualquier alérgeno en nuestra cocina.
            Para alergias graves, consulta directamente con el equipo del local.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
