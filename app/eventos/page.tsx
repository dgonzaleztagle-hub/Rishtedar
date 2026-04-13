import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Experiencias y eventos',
  description:
    'Celebra con nosotros. Catering, cenas especiales, grupos y experiencias únicas de cocina india en Rishtedar.',
  alternates: { canonical: '/eventos' },
}

const EVENTS = [
  {
    id: 'grupos',
    title: 'Grupos y celebraciones',
    subtitle: 'Desde 10 personas',
    description:
      'Organizamos tu cena de empresa, cumpleaños o evento social con atención dedicada. Menús personalizados, decoración especial y sommelier de especias.',
    details: ['Mesas desde 10 personas', 'Menú personalizable', 'Bebidas incluidas (opcional)', 'Coordinación completa'],
  },
  {
    id: 'catering',
    title: 'Catering',
    subtitle: 'Llevamos Rishtedar a tu evento',
    description:
      'Llevamos nuestra cocina a tu evento. Matrimonios, eventos corporativos, lanzamientos de producto. Cocina india premium donde tú necesites.',
    details: ['Eventos desde 20 personas', 'Cobertura Santiago y Miami', 'Horno tandoor móvil disponible', 'Personal de servicio incluido'],
  },
  {
    id: 'cenas',
    title: 'Cenas especiales',
    subtitle: 'Menús de degustación',
    description:
      'Para aniversarios, propuestas y momentos únicos. Menú de 7 tiempos con maridaje de vinos, mesa reservada y ambientación exclusiva.',
    details: ['Menú degustación 7 tiempos', 'Maridaje de vinos disponible', 'Decoración personalizada', 'Reserva con 48h de anticipación'],
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños',
    subtitle: 'Celebra con los tuyos',
    description:
      'Haz tu cumpleaños especial. Pastel de cumpleaños incluido, canción en hindi, decoración de globos y foto grupal de recuerdo.',
    details: ['Pastel incluido para el cumpleañero', 'Decoración especial', 'Mínimo 6 personas', 'Reserva anticipada requerida'],
  },
]

export default function EventosPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <div className="bg-warm-950 py-20 md:py-28 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 100%, #c9952a 0%, transparent 60%)' }}
          />
          <div className="relative container mx-auto px-6">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-3">
              Más que cenar
            </p>
            <h1 className="font-display text-5xl md:text-7xl italic text-ivory">
              Experiencias
            </h1>
            <p className="text-warm-300 mt-5 max-w-xl mx-auto text-lg">
              Cada momento merece una historia. Deja que Rishtedar sea el escenario.
            </p>
          </div>
        </div>

        {/* Events grid */}
        <section className="bg-ivory py-20 md:py-28">
          <div className="container mx-auto px-6 space-y-16">
            {EVENTS.map((evt, i) => (
              <div
                key={evt.id}
                id={evt.id}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
              >
                {/* Image placeholder */}
                <div className="w-full md:w-1/2 aspect-video bg-gradient-to-br from-warm-200 to-warm-300 flex items-center justify-center">
                  <span className="font-display text-5xl italic text-warm-400">{evt.title}</span>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2">
                  <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-2">{evt.subtitle}</p>
                  <h2 className="font-display text-4xl md:text-5xl italic text-warm-950 mb-4">{evt.title}</h2>
                  <p className="text-warm-500 text-base leading-relaxed mb-6">{evt.description}</p>
                  <ul className="space-y-2 mb-8">
                    {evt.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-sm text-warm-700">
                        <div className="w-1 h-1 rounded-full bg-gold-600 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:eventos@rishtedar.com"
                    className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory px-8 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
                  >
                    Consultar disponibilidad →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
