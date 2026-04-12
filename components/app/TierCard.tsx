'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Crown, Star, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { TIER_THRESHOLDS } from '@/lib/loyalty/config'

// ─── Config ───────────────────────────────────────────────────────────────────

export const TIER_CONFIG = {
  bronze: { color: '#cd7f32', icon: Star,  label: 'Bronze', next: TIER_THRESHOLDS.silver },
  silver: { color: '#c0c0c0', icon: Zap,   label: 'Silver', next: TIER_THRESHOLDS.gold   },
  gold:   { color: '#c9952a', icon: Crown, label: 'Gold',   next: null                   },
} as const

const TIER_ACTIVE_BENEFITS: Record<'bronze' | 'silver' | 'gold', { icon: string; text: string }[]> = {
  bronze: [
    { icon: '🎮', text: '1 ficha del Festín / semana' },
    { icon: '🎂', text: '5% descuento en cumpleaños' },
    { icon: '🎁', text: 'Promociones exclusivas Circle' },
  ],
  silver: [
    { icon: '🎮', text: '2 fichas del Festín / semana' },
    { icon: '🎂', text: '10% descuento en cumpleaños' },
    { icon: '📅', text: 'Reservas prioritarias' },
    { icon: '🏷️', text: '5% descuento en delivery' },
  ],
  gold: [
    { icon: '🎮', text: '3 fichas del Festín / semana' },
    { icon: '🎂', text: '15% + postre gratis en cumpleaños' },
    { icon: '👑', text: 'Mesa preferente sin espera' },
    { icon: '🌟', text: 'Acceso a menús avant-première' },
  ],
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TierCardProps {
  points:      number
  tier:        'bronze' | 'silver' | 'gold'
  totalVisits: number
  loading:     boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TierCard({ points, tier, totalVisits, loading }: TierCardProps) {
  const cfg      = TIER_CONFIG[tier]
  const TierIcon = cfg.icon
  const progress = cfg.next ? Math.round((points / cfg.next) * 100) : 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative border p-5 overflow-hidden"
      style={{ borderColor: `${cfg.color}40`, background: 'linear-gradient(135deg, #1a1200 0%, #0d0d0d 70%)' }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${cfg.color} 0%, transparent 60%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TierIcon size={16} style={{ color: cfg.color }} />
            <span className="font-display text-xl italic" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <span className="text-warm-500 text-xs">
            {loading
              ? <Loader2 size={12} className="animate-spin inline" />
              : `${totalVisits} visitas`
            }
          </span>
        </div>

        <p className="font-display text-4xl italic text-ivory mb-1">
          {loading
            ? <span className="text-warm-700">···</span>
            : points.toLocaleString('es-CL')
          }
          <span className="text-warm-600 text-lg ml-1">pts</span>
        </p>

        {cfg.next && (
          <>
            <p className="text-warm-600 text-xs mb-2">
              {(cfg.next - points).toLocaleString('es-CL')} pts para {tier === 'bronze' ? 'Silver' : 'Gold'}
            </p>
            <div className="h-1 bg-warm-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})` }}
              />
            </div>
          </>
        )}

        {/* Active benefits */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: `${cfg.color}20` }}>
          <p className="text-warm-600 text-[10px] tracking-wider uppercase mb-2">Tus beneficios activos</p>
          <ul className="space-y-1.5">
            {TIER_ACTIVE_BENEFITS[tier].map(b => (
              <li key={b.text} className="flex items-center gap-2">
                <span className="text-sm leading-none">{b.icon}</span>
                <span className="text-warm-400 text-xs">{b.text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/circle"
            className="inline-flex items-center gap-1 mt-3 text-xs transition-colors"
            style={{ color: `${cfg.color}cc` }}
          >
            Ver todos los beneficios <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
