'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const BENEFITS = [
  { num: '2×', label: 'Puntos en tu\ncumpleaños' },
  { num: '5%', label: 'Descuento\ncada 10 visitas' },
  { num: '1°', label: 'Acceso a menús\nexclusivos' },
]

export function FidelizacionSection() {
  return (
    <section className="bg-warm-950 relative overflow-hidden">

      {/* Gold top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-700/50 to-transparent" />

      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">

        {/* LEFT — photo */}
        <div className="relative hidden md:block min-h-[600px]">
          <Image
            src="/images/brand/Rectangle-18.png"
            alt="Experiencia Rishtedar"
            fill
            className="object-cover opacity-70"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-warm-950/80" />
        </div>

        {/* RIGHT — content */}
        <div className="flex flex-col justify-center px-6 sm:px-8 md:px-16 py-16 sm:py-20 relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-3">
              Club de Fidelidad
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl italic text-ivory leading-none mb-6">
              Rishtedar<br />
              <span className="text-gold-gradient">Circle</span>
            </h2>
            <p className="text-warm-400 text-sm leading-relaxed max-w-sm mb-10">
              Cada visita suma. Acumula puntos, desbloquea beneficios exclusivos
              y recibe sorpresas en tu cumpleaños.
            </p>
          </motion.div>

          {/* Benefits — numbers as design element */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-6 sm:gap-10 mb-12 border-t border-warm-800 pt-8"
          >
            {BENEFITS.map((b) => (
              <div key={b.num}>
                <p className="font-display text-4xl italic text-gold-500 leading-none mb-1">{b.num}</p>
                <p className="text-warm-500 text-xs leading-tight whitespace-pre-line">{b.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/circle"
              className="inline-flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-4 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
            >
              Unirme al Circle
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200 px-8 py-4 text-xs tracking-widest uppercase font-medium transition-all duration-300"
            >
              Ya soy miembro
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
