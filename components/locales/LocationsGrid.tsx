'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, ShoppingBag, CalendarCheck, ExternalLink } from 'lucide-react'
import { LOCATIONS, DAYS_ES } from '@/lib/locations'
import type { Business } from '@/types'

function HoursTable({ hours }: { hours: Business['hours_json'] }) {
  const days = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const
  const today = (['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const)[new Date().getDay()]

  return (
    <div className="space-y-1.5">
      {days.map(d => (
        <div
          key={d}
          className={`flex items-center justify-between text-sm ${d === today ? 'text-gold-600 font-medium' : 'text-warm-500'}`}
        >
          <span className="w-24">{DAYS_ES[d]}</span>
          <span>{hours[d] ?? '—'}</span>
          {d === today && <span className="text-[10px] text-gold-600 ml-2 uppercase tracking-wider">Hoy</span>}
        </div>
      ))}
    </div>
  )
}

export function LocationsGrid() {
  const santiago = LOCATIONS.filter(l => l.country === 'CL' && l.is_active)
  const miami = LOCATIONS.filter(l => l.country === 'US' && l.is_active)

  return (
    <div className="bg-ivory py-16 md:py-24">
      <div className="container mx-auto px-6 space-y-20">
        {/* Santiago */}
        <div>
          <h2 className="font-display text-4xl italic text-warm-900 mb-10 pb-4 border-b border-warm-200">
            Santiago, Chile
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {santiago.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white border border-warm-200"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-warm-100 to-warm-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-5xl italic text-warm-300">
                      {loc.name.replace('Rishtedar ', '')}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-700 text-ivory text-[10px] tracking-widest uppercase font-medium px-3 py-1">
                      🇨🇱 Santiago
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-display text-3xl italic text-warm-950 mb-5">
                    {loc.name.replace('Rishtedar ', '')}
                  </h3>

                  {/* Contact info */}
                  <div className="space-y-2 mb-6">
                    <a
                      href={`https://maps.google.com/?q=${loc.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-warm-600 hover:text-brand-700 text-sm transition-colors group"
                    >
                      <MapPin size={15} className="mt-0.5 shrink-0 text-brand-500" />
                      <span>{loc.address}</span>
                      <ExternalLink size={11} className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a
                      href={`tel:${loc.phone}`}
                      className="flex items-center gap-3 text-warm-600 hover:text-brand-700 text-sm transition-colors"
                    >
                      <Phone size={15} className="shrink-0 text-brand-500" />
                      {loc.phone}
                    </a>
                    <a
                      href={`mailto:${loc.email}`}
                      className="flex items-center gap-3 text-warm-600 hover:text-brand-700 text-sm transition-colors"
                    >
                      <Mail size={15} className="shrink-0 text-brand-500" />
                      {loc.email}
                    </a>
                  </div>

                  {/* Hours */}
                  <div className="border-t border-warm-100 pt-5 mb-6">
                    <div className="flex items-center gap-2 text-warm-500 text-xs tracking-widest uppercase mb-3">
                      <Clock size={12} />
                      Horarios
                    </div>
                    <HoursTable hours={loc.hours_json} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mb-3">
                    <Link
                      href={`/reservar?local=${loc.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory py-3 text-xs tracking-widest uppercase font-medium transition-colors"
                    >
                      <CalendarCheck size={13} />
                      Reservar
                    </Link>
                    <Link
                      href={`/order?local=${loc.id}`}
                      className="flex-1 flex items-center justify-center gap-2 border border-warm-300 hover:border-brand-400 text-warm-700 hover:text-brand-700 py-3 text-xs tracking-widest uppercase font-medium transition-all"
                    >
                      <ShoppingBag size={13} />
                      Pedir
                    </Link>
                  </div>
                  <Link
                    href={`/locales/${loc.slug}`}
                    className="flex items-center justify-center gap-1.5 text-warm-400 hover:text-brand-700 text-xs tracking-widest uppercase font-medium py-2 transition-colors group"
                  >
                    Ver local completo
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Miami */}
        <div>
          <h2 className="font-display text-4xl italic text-warm-900 mb-10 pb-4 border-b border-warm-200">
            Miami, Florida
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {miami.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white border border-warm-200"
              >
                <div className="h-48 bg-gradient-to-br from-[#fdf3fb] to-[#f8e6f4] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-5xl italic text-brand-200">
                      Miami
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-700 text-ivory text-[10px] tracking-widest uppercase font-medium px-3 py-1">
                      🇺🇸 Miami, FL
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-display text-3xl italic text-warm-950 mb-5">
                    Wynwood
                  </h3>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-3 text-warm-600 text-sm">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-brand-500" />
                      <span>{loc.address}</span>
                    </div>
                    <a
                      href={`tel:${loc.phone}`}
                      className="flex items-center gap-3 text-warm-600 hover:text-brand-700 text-sm transition-colors"
                    >
                      <Phone size={15} className="shrink-0 text-brand-500" />
                      {loc.phone}
                    </a>
                  </div>

                  <div className="border-t border-warm-100 pt-5 mb-6">
                    <div className="flex items-center gap-2 text-warm-500 text-xs tracking-widest uppercase mb-3">
                      <Clock size={12} />
                      Horarios
                    </div>
                    <HoursTable hours={loc.hours_json} />
                  </div>

                  <div className="flex gap-3 mb-3">
                    <Link
                      href={`/reservar?local=${loc.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory py-3 text-xs tracking-widest uppercase font-medium transition-colors"
                    >
                      <CalendarCheck size={13} />
                      Reservar
                    </Link>
                    <Link
                      href={`/order?local=${loc.id}`}
                      className="flex-1 flex items-center justify-center gap-2 border border-warm-300 hover:border-brand-400 text-warm-700 hover:text-brand-700 py-3 text-xs tracking-widest uppercase font-medium transition-all"
                    >
                      <ShoppingBag size={13} />
                      Pedir
                    </Link>
                  </div>
                  <Link
                    href={`/locales/${loc.slug}`}
                    className="flex items-center justify-center gap-1.5 text-warm-400 hover:text-brand-700 text-xs tracking-widest uppercase font-medium py-2 transition-colors group"
                  >
                    Ver local completo
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
