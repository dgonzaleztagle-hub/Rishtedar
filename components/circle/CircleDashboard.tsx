'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Crown, Star, Zap, Gift, MapPin, Clock,
  ChevronRight, LogOut, QrCode,
} from 'lucide-react'

// ─── mock data (reemplazar con Supabase post-demo) ───────────────────────────

const MEMBER = {
  name: 'Vikram Sharma',
  email: 'vikram@rishtedar.cl',
  memberSince: 'Enero 2024',
  tier: 'Silver' as 'Bronze' | 'Silver' | 'Gold',
  points: 2850,
  nextTierPoints: 5000,
  nextTierName: 'Gold',
  favoriteLocal: 'Providencia',
  totalVisits: 19,
}

const VISITS = [
  { local: 'Providencia',  date: 'Hace 3 días',   points: 150, bonus: false },
  { local: 'Vitacura',     date: 'Hace 10 días',  points: 150, bonus: false },
  { local: 'La Dehesa',    date: 'Hace 18 días',  points: 200, bonus: true  },
  { local: 'Providencia',  date: 'Hace 25 días',  points: 150, bonus: false },
]

const REWARD = {
  title: '1 postre gratis',
  desc: 'Válido en cualquier local · Presenta tu QR al mesero',
  expiresIn: '15 días',
  code: 'CIRCLE-2850',
}

const TIER_CONFIG = {
  Bronze: { color: '#cd7f32', icon: Star,  next: 1000  },
  Silver: { color: '#c0c0c0', icon: Zap,   next: 5000  },
  Gold:   { color: '#c9952a', icon: Crown, next: null  },
}

const TIER_BENEFITS = {
  Bronze: ['Puntos por visita', 'Promociones exclusivas Circle'],
  Silver: ['Todo lo de Bronze', '5% descuento en cada visita', 'Prioridad en reservas', 'Puntos dobles los martes'],
  Gold:   ['Todo lo de Silver', 'Puntos dobles en tu cumpleaños', 'Acceso a menús exclusivos', 'Invitaciones a eventos especiales', 'Mesa preferente sin espera'],
}

// ─── QR visual (usando api pública) ──────────────────────────────────────────

function MemberQR({ code }: { code: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(code)}&bgcolor=0d0d0d&color=c9952a&margin=10`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qrUrl}
      alt="Tu QR Circle"
      width={180}
      height={180}
      className="mx-auto"
    />
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export function CircleDashboard() {
  const [qrExpanded, setQrExpanded] = useState(false)
  const tier = TIER_CONFIG[MEMBER.tier]
  const TierIcon = tier.icon
  const progress = tier.next ? Math.round((MEMBER.points / tier.next) * 100) : 100

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <p className="text-warm-500 text-xs tracking-widest uppercase mb-1">Rishtedar Circle</p>
          <h1 className="font-display text-3xl italic text-ivory leading-tight">
            Hola, {MEMBER.name.split(' ')[0]}
          </h1>
          <p className="text-warm-600 text-xs mt-1">Miembro desde {MEMBER.memberSince}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-warm-600 hover:text-warm-400 transition-colors text-xs mt-1"
        >
          <LogOut size={13} />
          Salir
        </Link>
      </motion.div>

      {/* ── TIER + POINTS CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative border border-warm-800 p-6 mb-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #0d0d0d 60%)' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 80% 0%, ${tier.color} 0%, transparent 60%)` }}
        />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} />

        <div className="relative">
          {/* Tier badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <TierIcon size={18} style={{ color: tier.color }} />
              <span className="font-display text-xl italic" style={{ color: tier.color }}>
                {MEMBER.tier}
              </span>
            </div>
            <div className="text-right">
              <p className="text-warm-500 text-[10px] tracking-widest uppercase">Visitas totales</p>
              <p className="font-display text-2xl italic text-ivory">{MEMBER.totalVisits}</p>
            </div>
          </div>

          {/* Points */}
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-0.5">Puntos acumulados</p>
                <p className="font-display text-4xl italic text-ivory">
                  {MEMBER.points.toLocaleString('es-CL')}
                  <span className="text-warm-600 text-lg ml-1">pts</span>
                </p>
              </div>
              {tier.next && (
                <div className="text-right">
                  <p className="text-warm-600 text-[10px] tracking-widest uppercase mb-0.5">Para {MEMBER.nextTierName}</p>
                  <p className="text-warm-400 text-sm">
                    {(tier.next - MEMBER.points).toLocaleString('es-CL')} pts más
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {tier.next && (
              <div className="h-1.5 bg-warm-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})` }}
                />
              </div>
            )}
          </div>

          {/* Local favorito */}
          <div className="flex items-center gap-1.5 text-warm-600 text-xs">
            <MapPin size={11} className="text-brand-500" />
            Local favorito: <span className="text-warm-400">{MEMBER.favoriteLocal}</span>
          </div>
        </div>
      </motion.div>

      {/* ── QR CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="border border-warm-800 bg-warm-900/40 mb-4 overflow-hidden"
      >
        <button
          onClick={() => setQrExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-900/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <QrCode size={16} className="text-gold-500" />
            <div className="text-left">
              <p className="text-ivory text-sm font-medium">Tu QR Circle</p>
              <p className="text-warm-500 text-xs">Muéstralo al llegar a cualquier local</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`text-warm-600 transition-transform duration-300 ${qrExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {qrExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-warm-800 px-5 py-6 text-center"
          >
            <div className="inline-block bg-[#0d0d0d] p-3 border border-warm-800 mb-4">
              <MemberQR code={REWARD.code} />
            </div>
            <p className="text-warm-400 text-xs mb-1">Código de miembro</p>
            <p className="font-mono text-gold-500 text-sm tracking-widest">{REWARD.code}</p>
          </motion.div>
        )}
      </motion.div>

      {/* ── RECOMPENSA ACTIVA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="border border-gold-700/40 bg-gold-900/20 p-5 mb-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gold-900/40 border border-gold-700/40 flex items-center justify-center shrink-0">
            <Gift size={16} className="text-gold-500" />
          </div>
          <div className="flex-1">
            <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-1">Recompensa desbloqueada</p>
            <p className="text-ivory text-sm font-medium">{REWARD.title}</p>
            <p className="text-warm-400 text-xs mt-0.5 leading-relaxed">{REWARD.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-warm-600 text-[10px] tracking-widest uppercase">Vence en</p>
            <p className="text-gold-400 text-xs font-medium">{REWARD.expiresIn}</p>
          </div>
        </div>
      </motion.div>

      {/* ── ÚLTIMAS VISITAS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="border border-warm-800 bg-warm-900/30 mb-4"
      >
        <div className="px-5 py-4 border-b border-warm-800">
          <p className="text-warm-400 text-[10px] tracking-widest uppercase flex items-center gap-2">
            <Clock size={11} />
            Últimas visitas
          </p>
        </div>
        <div className="divide-y divide-warm-800/50">
          {VISITS.map((v, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <MapPin size={12} className="text-brand-500 shrink-0" />
                <div>
                  <p className="text-warm-200 text-sm">{v.local}</p>
                  <p className="text-warm-600 text-xs">{v.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {v.bonus && (
                  <span className="text-[9px] tracking-wider uppercase text-gold-600 bg-gold-900/30 border border-gold-800/40 px-1.5 py-0.5">
                    ×2
                  </span>
                )}
                <span className="text-emerald-400 text-sm font-medium">+{v.points}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── BENEFICIOS ACTIVOS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="border border-warm-800 bg-warm-900/30 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <TierIcon size={14} style={{ color: tier.color }} />
          <p className="text-[10px] tracking-widest uppercase" style={{ color: tier.color }}>
            Beneficios {MEMBER.tier}
          </p>
        </div>
        <ul className="space-y-2">
          {TIER_BENEFITS[MEMBER.tier].map(b => (
            <li key={b} className="flex items-center gap-2.5 text-warm-400 text-xs">
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: tier.color }} />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-warm-800">
          <Link
            href="/circle"
            className="text-warm-600 hover:text-warm-400 text-[10px] tracking-widest uppercase transition-colors flex items-center gap-1.5"
          >
            Ver todos los niveles
            <ChevronRight size={11} />
          </Link>
        </div>
      </motion.div>

    </div>
  )
}
