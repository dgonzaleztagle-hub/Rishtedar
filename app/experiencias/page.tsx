import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowRight } from 'lucide-react'
import { EXPERIENCES } from '@/lib/data/experiences'

export const metadata: Metadata = {
  title: 'Experiencias · Rishtedar',
  description: 'Más que un restaurante. Rituales, clases, festivales y noches de cultura india en Santiago.',
  alternates: { canonical: '/experiencias' },
}

export default function ExperienciasPage() {
  return (
    <>
      <Header />
      <main className="bg-warm-950 pt-28 md:pt-36">

        {/* Hero */}
        <div className="container mx-auto px-6 pb-16 md:pb-20">
          <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-4">
            Más que un restaurante
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl italic text-ivory leading-none mb-6">
            Vive la India
          </h1>
          <p className="text-warm-400 text-sm leading-relaxed max-w-md">
            Cada visita es una puerta a la cultura india. Rituales, talleres,
            festivales y noches que van mucho más allá del plato.
          </p>
        </div>

        {/* Grid de experiencias */}
        <div className="container mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-warm-800">
            {EXPERIENCES.map((exp) => (
              <Link
                key={exp.slug}
                href={`/experiencias/${exp.slug}`}
                className="group relative block overflow-hidden bg-warm-950 aspect-[4/5]"
              >
                <Image
                  src={exp.heroPhoto}
                  alt={exp.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-950 via-warm-950/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-7">
                  <p className="text-gold-500 text-[10px] tracking-[0.25em] uppercase mb-2">
                    {exp.tag}
                  </p>
                  <h2 className="font-display text-3xl italic text-ivory leading-tight mb-2">
                    {exp.title}
                  </h2>
                  <p className="text-warm-400 text-xs leading-relaxed mb-4 max-w-xs opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {exp.description}
                  </p>
                  <div className="flex items-center gap-2 text-gold-400 text-[10px] tracking-widest uppercase">
                    Descubrir
                    <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA eventos privados */}
        <div className="border-t border-warm-800 py-20">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-4">
              ¿Tienes un evento especial?
            </p>
            <h3 className="font-display text-3xl md:text-5xl italic text-ivory mb-5">
              Diseñamos experiencias a medida
            </h3>
            <p className="text-warm-500 text-sm leading-relaxed max-w-sm mx-auto mb-8">
              Cumpleaños, cenas privadas, catering corporativo o una noche temática completa.
              Cuéntanos tu idea.
            </p>
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-warm-950 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-colors group"
            >
              Contactar al equipo
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
