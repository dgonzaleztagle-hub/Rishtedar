import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, ArrowLeft, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

import { LocationHero } from '@/components/locales/LocationHero'
import { LocationMenuPreview } from '@/components/locales/LocationMenuPreview'
import { getLocationBySlug, LOCATIONS, DAYS_ES } from '@/lib/locations'
import type { WeeklyHours } from '@/types'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return LOCATIONS.map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const loc = getLocationBySlug(slug)
  if (!loc) return {}
  return {
    title: `${loc.name} — Restaurante Indio Premium`,
    description: `Visita ${loc.name} en ${loc.address}. Reserva tu mesa o pide delivery. Cocina india auténtica en ${loc.country === 'CL' ? 'Santiago, Chile' : 'Miami, FL'}.`,
    alternates: { canonical: `/locales/${slug}` },
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

const DAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const

function getTodayKey() {
  return DAY_KEYS[new Date().getDay()]
}

function isOpenNow(hours: WeeklyHours): boolean {
  const today = getTodayKey()
  const str = hours[today]
  if (!str) return false
  const m = str.match(/(\d{1,2}):(\d{2})[\u2013\-](\d{1,2}):(\d{2})/)
  if (!m) return false
  const [, oh, om, ch, cm] = m.map(Number)
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= oh * 60 + om && mins < ch * 60 + cm
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function LocalePage({ params }: Props) {
  const { slug } = await params
  const loc = getLocationBySlug(slug)
  if (!loc) notFound()

  // ── Miami: página simple hasta que tengan dominio propio ──────────────────
  if (loc.country === 'US') {
    return (
      <>
        <Header />
        <main className="pt-20 min-h-screen bg-warm-950 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-4">Internacional</p>
            <h1 className="font-display text-5xl sm:text-6xl italic text-ivory mb-4">
              Rishtedar Miami
            </h1>
            <p className="text-warm-400 text-sm leading-relaxed mb-3">
              Wynwood, Miami, FL
            </p>
            <p className="text-warm-500 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
              Nuestra experiencia llega a Miami. Visita nuestro sitio local para reservas, menú y más información.
            </p>
            <span
              className="inline-flex items-center gap-2.5 bg-brand-700/50 text-ivory/60 px-10 py-4 text-xs tracking-widest uppercase font-medium cursor-not-allowed select-none"
              aria-disabled="true"
            >
              <ExternalLink size={13} />
              Ver sitio Miami
              <span className="text-brand-400/70 text-[9px] normal-case tracking-normal ml-1">(próximamente)</span>
            </span>
            <div className="mt-8">
              <Link
                href="/locales"
                className="flex items-center justify-center gap-1.5 text-warm-600 hover:text-warm-400 transition-colors text-sm"
              >
                <ArrowLeft size={13} />
                Ver todos los locales
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const today = getTodayKey()
  const todayHours = loc.hours_json[today] ?? 'Cerrado hoy'
  const open = isOpenNow(loc.hours_json)
  const days = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const

  return (
    <>
<>
      <Header />

      <main className="pt-20 min-h-screen bg-ivory">

        {/* Breadcrumb */}
        <div className="bg-warm-950 border-b border-warm-800">
          <div className="container mx-auto px-6 py-3 flex items-center gap-3 text-xs text-warm-500">
            <Link href="/locales" className="flex items-center gap-1.5 hover:text-gold-500 transition-colors">
              <ArrowLeft size={12} />
              Todos los locales
            </Link>
            <span>/</span>
            <span className="text-warm-300">{loc.name.replace('Rishtedar ', '')}</span>
          </div>
        </div>

        {/* Hero */}
        <LocationHero loc={loc} open={open} todayHours={todayHours} />

        {/* Info strip */}
        <div className="bg-warm-950 py-12">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-900 border border-warm-800 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-gold-500" />
                </div>
                <div>
                  <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-1">Dirección</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-warm-200 text-sm hover:text-gold-400 transition-colors flex items-start gap-1.5 group"
                  >
                    {loc.address}
                    <ExternalLink size={10} className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-900 border border-warm-800 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-gold-500" />
                </div>
                <div>
                  <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-1">Teléfono</p>
                  <a href={`tel:${loc.phone}`} className="text-warm-200 text-sm hover:text-gold-400 transition-colors">
                    {loc.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-900 border border-warm-800 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-gold-500" />
                </div>
                <div>
                  <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-1">Email</p>
                  <a href={`mailto:${loc.email}`} className="text-warm-200 text-sm hover:text-gold-400 transition-colors break-all">
                    {loc.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-ivory py-16">
          <div className="container mx-auto px-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Clock size={16} className="text-brand-600" />
              <h2 className="font-display text-3xl italic text-warm-950">Horarios</h2>
            </div>

            <div className="bg-white border border-warm-200 divide-y divide-warm-100">
              {days.map(d => {
                const isToday = d === today
                return (
                  <div
                    key={d}
                    className={`flex items-center justify-between px-6 py-3.5 ${
                      isToday ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium w-16 sm:w-24 ${isToday ? 'text-brand-700' : 'text-warm-700'}`}>
                        {DAYS_ES[d]}
                      </span>
                      {isToday && (
                        <span className={`text-[10px] tracking-widest uppercase font-medium px-2 py-0.5 ${
                          open
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-warm-200 text-warm-600'
                        }`}>
                          {open ? 'Abierto ahora' : 'Cerrado ahora'}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm ${isToday ? 'text-brand-700 font-medium' : 'text-warm-500'}`}>
                      {loc.hours_json[d] ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Menu preview */}
        <LocationMenuPreview locationName={loc.name.replace('Rishtedar ', '')} slug={loc.slug} />

        {/* Final CTA */}
        <div className="bg-warm-950 py-20">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-3">
              {loc.name.replace('Rishtedar ', '')}
            </p>
            <h2 className="font-display text-4xl md:text-5xl italic text-ivory mb-3">
              ¿Listo para vivir la experiencia?
            </h2>
            <p className="text-warm-400 mb-10 max-w-md mx-auto">
              Reserva tu mesa o haz tu pedido directamente desde aquí, sin intermediarios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/reservar?local=${loc.id}`}
                className="flex items-center gap-3 bg-brand-700 hover:bg-brand-800 text-ivory px-10 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
              >
                Reservar mesa
              </Link>
              <Link
                href={`/order?local=${loc.id}`}
                className="flex items-center gap-3 border border-gold-600 text-gold-400 hover:bg-gold-600 hover:text-warm-950 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-all duration-300"
              >
                Pedir delivery
              </Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </>
  )
}
