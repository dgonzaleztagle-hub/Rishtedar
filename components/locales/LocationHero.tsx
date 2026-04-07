'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CalendarCheck, ShoppingBag } from 'lucide-react'
import type { Business } from '@/types'

// ─── per-location visual identity ───────────────────────────────────────────

const THEMES: Record<string, {
  bg: string        // CSS gradient string for the hero background
  accent: string    // hex color for decorative lines/rings
  tag: string       // label shown in badge
  description: string
}> = {
  'providencia': {
    bg: 'linear-gradient(135deg, #1a0800 0%, #3d1800 40%, #6b2d00 70%, #1a0a02 100%)',
    accent: '#c9952a',
    tag: '🇨🇱 Providencia · Santiago',
    description: 'Nuestro primer local. El corazón de Rishtedar en el barrio más cosmopolita de Santiago.',
  },
  'vitacura': {
    bg: 'linear-gradient(135deg, #130010 0%, #3a0830 40%, #6b1455 70%, #130a12 100%)',
    accent: '#91226f',
    tag: '🇨🇱 Vitacura · Santiago',
    description: 'Elegancia y autenticidad india en el corazón del barrio más sofisticado de la capital.',
  },
  'la-reina': {
    bg: 'linear-gradient(135deg, #001510 0%, #003020 40%, #005535 70%, #001a10 100%)',
    accent: '#10b981',
    tag: '🇨🇱 La Reina · Santiago',
    description: 'Un espacio íntimo rodeado de naturaleza, donde los sabores de India cobran vida.',
  },
  'la-dehesa': {
    bg: 'linear-gradient(135deg, #1a0500 0%, #451500 40%, #7c2a00 70%, #1a0800 100%)',
    accent: '#f97316',
    tag: '🇨🇱 La Dehesa · Lo Barnechea',
    description: 'La experiencia Rishtedar al oriente de Santiago, en el corazón de Lo Barnechea.',
  },
  'miami-wynwood': {
    bg: 'linear-gradient(135deg, #0d0020 0%, #250050 40%, #450080 70%, #100020 100%)',
    accent: '#a855f7',
    tag: '🇺🇸 Wynwood · Miami, FL',
    description: 'Where the flavors of India meet the vibrant energy of Wynwood. Our first international location.',
  },
}

const DEFAULT_THEME = THEMES['providencia']

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  loc: Business
  open: boolean
  todayHours: string
}

export function LocationHero({ loc, open, todayHours }: Props) {
  const theme = THEMES[loc.slug] ?? DEFAULT_THEME
  const shortName = loc.name.replace('Rishtedar ', '')

  return (
    <section
      className="relative min-h-[480px] sm:min-h-[520px] md:min-h-[580px] flex items-end overflow-hidden"
      style={{ background: theme.bg }}
    >
      {/* Decorative mandala ring pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, ${theme.accent} 0%, transparent 60%),
            repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 29deg, ${theme.accent} 30deg, transparent 31deg)
          `,
          backgroundSize: '600px 600px',
          backgroundPosition: 'center center',
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${theme.accent} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.accent} 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Accent color top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${theme.accent} 30%, ${theme.accent} 70%, transparent 100%)` }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative container mx-auto px-6 pb-16 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tag + open status */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-[10px] tracking-widest uppercase font-medium px-3 py-1.5"
              style={{ background: `${theme.accent}22`, color: theme.accent, border: `1px solid ${theme.accent}44` }}
            >
              {theme.tag}
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-medium px-3 py-1.5 ${
              open
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                : 'bg-warm-900/40 text-warm-400 border border-warm-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-warm-500'}`} />
              {open ? `Abierto · ${todayHours}` : `Cerrado · Abre ${todayHours}`}
            </span>
          </div>

          {/* Name */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl italic text-ivory leading-none mb-4 tracking-tight">
            {shortName}
          </h1>

          {/* Description */}
          <p className="text-warm-300 text-base md:text-lg max-w-lg mb-10 leading-relaxed">
            {theme.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/reservar?local=${loc.id}`}
              className="flex items-center gap-2.5 bg-brand-700 hover:bg-brand-800 text-ivory px-8 py-3.5 text-xs tracking-widest uppercase font-medium transition-colors"
            >
              <CalendarCheck size={14} />
              Reservar mesa
            </Link>
            <Link
              href={`/order?local=${loc.id}`}
              className="flex items-center gap-2.5 text-xs tracking-widest uppercase font-medium px-8 py-3.5 transition-all duration-300 hover:opacity-80"
              style={{
                border: `1px solid ${theme.accent}`,
                color: theme.accent,
              }}
            >
              <ShoppingBag size={14} />
              Pedir delivery
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative accent circle (top-right) */}
      <div
        className="absolute top-12 right-16 w-64 h-64 rounded-full opacity-5 pointer-events-none hidden lg:block"
        style={{ border: `60px solid ${theme.accent}` }}
      />
      <div
        className="absolute top-28 right-32 w-32 h-32 rounded-full opacity-5 pointer-events-none hidden lg:block"
        style={{ border: `30px solid ${theme.accent}` }}
      />
    </section>
  )
}
