'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Clock } from 'lucide-react'
import { LOCATIONS } from '@/lib/locations'
import type { Business } from '@/types'

function getTodayHours(loc: Business): string {
  const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const
  const today = days[new Date().getDay()]
  return loc.hours_json[today] ?? 'Cerrado'
}

export function LocationsSection() {
  const active = LOCATIONS.filter(l => l.is_active)

  return (
    <section className="bg-ivory overflow-hidden">

      {/* ── FEATURE PHOTO ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden"
      >
        <Image
          src="/images/brand/Rectangle-17.png"
          alt="Ambiente Rishtedar"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Dark gradient at bottom to blend into ivory */}
        <div className="absolute inset-0 bg-gradient-to-b from-warm-950/30 via-transparent to-ivory" />

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-gold-400 text-[10px] tracking-[0.3em] uppercase mb-3"
          >
            Dónde encontrarnos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="font-display text-3xl sm:text-5xl md:text-7xl italic text-ivory"
          >
            Nuestros locales
          </motion.h2>
        </div>
      </motion.div>

      {/* ── LOCATIONS LIST ──────────────────────────────────────── */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="divide-y divide-warm-200">
          {active.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href={`/locales/${loc.slug}`}
                className="group flex items-center gap-4 md:gap-10 py-5 md:py-8 hover:pl-2 md:hover:pl-4 transition-all duration-300"
              >
                {/* Number */}
                <span className="font-display text-2xl sm:text-4xl md:text-6xl italic text-warm-200 group-hover:text-brand-200 transition-colors shrink-0 w-10 sm:w-16 md:w-24 text-right leading-none">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Divider */}
                <div className="w-px h-12 bg-warm-300 group-hover:bg-brand-300 transition-colors shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                    <h3 className="font-display text-2xl md:text-3xl italic text-warm-900 group-hover:text-brand-700 transition-colors leading-tight">
                      {loc.name.replace('Rishtedar ', '')}
                    </h3>
                    <span className="text-[9px] tracking-widest uppercase border border-warm-300 text-warm-400 px-2 py-0.5 w-fit mt-1 md:mt-0">
                      {loc.country === 'US' ? '🇺🇸 Miami, FL' : '🇨🇱 Santiago'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
                    <span className="flex items-center gap-1.5 text-warm-500 text-xs">
                      <MapPin size={11} className="text-brand-400" />
                      {loc.address}
                    </span>
                    <span className="flex items-center gap-1.5 text-warm-500 text-xs">
                      <Clock size={11} className="text-gold-500" />
                      Hoy: {getTodayHours(loc)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="shrink-0 flex items-center gap-4 md:gap-6">
                  {loc.country === 'CL' && (
                    <button
                      onClick={e => { e.preventDefault(); window.location.href = '/reservar?local=' + loc.id }}
                      className="hidden md:block text-[10px] tracking-widest uppercase text-ivory bg-brand-700 hover:bg-brand-600 px-5 py-2.5 transition-colors"
                    >
                      Reservar
                    </button>
                  )}
                  <ArrowRight
                    size={16}
                    className="text-warm-300 group-hover:text-brand-700 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Ver todos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex justify-end"
        >
          <Link
            href="/locales"
            className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800 text-xs tracking-widest uppercase font-medium transition-colors group"
          >
            Ver todos los locales
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

    </section>
  )
}
