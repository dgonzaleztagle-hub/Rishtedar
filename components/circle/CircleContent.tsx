'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Star, Gift, Crown, Zap, ArrowRight,
  QrCode, Smartphone, Wallet,
} from 'lucide-react'

// ─── tiers ───────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Bronze',
    range: '0 – 999 pts',
    color: '#cd7f32',
    bg: 'from-[#2a1500] to-[#1a0e00]',
    border: 'border-[#cd7f3240]',
    icon: Star,
    badge: null,
    benefits: [
      { icon: '✦', text: '1 punto por cada $1.000 gastado' },
      { icon: '🎮', text: '1 ficha del Festín por semana' },
      { icon: '🎂', text: 'Descuento 5% en tu cumpleaños' },
      { icon: '🎁', text: 'Acceso a promociones exclusivas Circle' },
      { icon: '📧', text: 'Oferta especial de bienvenida' },
    ],
  },
  {
    name: 'Silver',
    range: '1.000 – 4.999 pts',
    color: '#c0c0c0',
    bg: 'from-[#1a1a1a] to-[#0f0f0f]',
    border: 'border-[#c0c0c040]',
    icon: Zap,
    badge: 'Más popular',
    featured: true,
    benefits: [
      { icon: '✦', text: '1 punto por cada $1.000 gastado' },
      { icon: '🎮', text: '2 fichas del Festín por semana' },
      { icon: '🎂', text: 'Descuento 10% en tu cumpleaños' },
      { icon: '📅', text: 'Reservas con prioridad (hasta 48h antes)' },
      { icon: '🏷️', text: '5% de descuento en pedidos delivery' },
    ],
  },
  {
    name: 'Gold',
    range: '5.000+ pts',
    color: '#c9952a',
    bg: 'from-[#2a1a00] to-[#150d00]',
    border: 'border-[#c9952a40]',
    icon: Crown,
    badge: 'Exclusivo',
    benefits: [
      { icon: '✦', text: '1 punto por cada $1.000 gastado' },
      { icon: '🎮', text: '3 fichas del Festín por semana' },
      { icon: '🎂', text: 'Descuento 15% + postre gratis en cumpleaños' },
      { icon: '👑', text: 'Mesa preferente sin espera' },
      { icon: '🌟', text: 'Acceso a menús avant-première exclusivos' },
      { icon: '🎉', text: 'Invitaciones a cenas y eventos especiales' },
    ],
  },
]

// ─── how it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Visita',
    desc: 'Escanea el QR en cualquier local Rishtedar al llegar o al pagar.',
    icon: QrCode,
  },
  {
    num: '02',
    title: 'Acumula',
    desc: 'Suma puntos automáticamente. Recíbelos en tu billetera digital.',
    icon: Wallet,
  },
  {
    num: '03',
    title: 'Disfruta',
    desc: 'Canjea beneficios, sube de nivel y recibe recompensas exclusivas.',
    icon: Gift,
  },
]

// ─── component ───────────────────────────────────────────────────────────────

export function CircleContent() {

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-warm-950 relative overflow-hidden py-24 md:py-32">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, #c9952a18 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#c9952a 1px, transparent 1px), linear-gradient(90deg, #c9952a 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/50 to-transparent" />

        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-gold-700/40 bg-gold-900/20">
              <Crown size={12} className="text-gold-500" />
              <span className="text-gold-500 text-[10px] tracking-[0.3em] uppercase font-medium">
                Programa de Fidelidad
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl italic text-ivory leading-none mb-4">
              Rishtedar<br />
              <span className="text-gold-gradient">Circle</span>
            </h1>

            <p className="text-warm-400 text-base sm:text-lg max-w-lg mx-auto mt-6 mb-10 leading-relaxed">
              Cada visita tiene su recompensa. Acumula puntos, sube de nivel
              y vive una experiencia cada vez más exclusiva.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/app"
                className="flex items-center gap-2.5 bg-gold-600 hover:bg-gold-500 text-warm-950 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
              >
                Activar mi Circle
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/app"
                className="flex items-center gap-2.5 border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-all duration-300"
              >
                Ya soy miembro
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 mt-8 text-emerald-400 text-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Programa activo en 4 locales
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-ivory py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-brand-600 text-[10px] tracking-[0.3em] uppercase mb-3">Así funciona</p>
            <h2 className="font-display text-4xl sm:text-5xl italic text-warm-950">3 pasos simples</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-warm-950 border border-warm-800 mb-5">
                    <Icon size={22} className="text-gold-500" />
                    <span className="absolute -top-2 -right-2 font-display text-xs italic text-gold-600 bg-ivory px-1">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl italic text-warm-950 mb-2">{step.title}</h3>
                  <p className="text-warm-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Google Wallet badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 text-warm-500 text-sm"
          >
            <Smartphone size={16} className="text-warm-400" />
            <span>Compatible con</span>
            <span className="flex items-center gap-2">
              <span className="bg-warm-900 text-warm-300 text-xs px-3 py-1 border border-warm-800">
                Google Wallet
              </span>
              <span className="bg-warm-100 text-warm-600 text-xs px-3 py-1 border border-warm-200">
                Apple Wallet
                <span className="text-[9px] ml-1 opacity-60">próximamente</span>
              </span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── TIERS ────────────────────────────────────────────────────── */}
      <section className="bg-warm-950 py-20 md:py-24 border-t border-warm-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-3">Niveles</p>
            <h2 className="font-display text-4xl sm:text-5xl italic text-ivory">Sube de nivel</h2>
            <p className="text-warm-500 text-sm mt-3 max-w-md mx-auto">
              Mientras más visitas, más exclusivos son tus beneficios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier, i) => {
              const Icon = tier.icon
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`relative border p-8 ${tier.border} ${tier.featured ? 'ring-1 ring-warm-600' : ''}`}
                  style={{ background: `linear-gradient(160deg, var(--tw-gradient-stops))` }}
                >
                  {/* Gradient bg via inline style */}
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(160deg, ${tier.bg.replace('from-', '').replace(' to-', ', ').replace(/\[|\]/g, '')})` }}
                  />
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warm-800 border border-warm-700 px-3 py-0.5">
                      <span className="text-warm-300 text-[9px] tracking-widest uppercase">Más popular</span>
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <Icon size={20} style={{ color: tier.color }} />
                      <span className="text-warm-600 text-xs">{tier.range}</span>
                    </div>
                    <h3
                      className="font-display text-3xl italic mb-1 leading-none"
                      style={{ color: tier.color }}
                    >
                      {tier.name}
                    </h3>
                    {'badge' in tier && tier.badge && (
                      <span className="inline-block text-[9px] tracking-widest uppercase px-2 py-0.5 border mb-4"
                        style={{ borderColor: `${tier.color}40`, color: tier.color }}>
                        {tier.badge}
                      </span>
                    )}
                    {!('badge' in tier && tier.badge) && <div className="mb-4" />}
                    <ul className="space-y-2.5">
                      {tier.benefits.map(b => (
                        <li key={b.text} className="flex items-start gap-2.5">
                          <span className="text-sm shrink-0 mt-0.5 leading-none">{b.icon}</span>
                          <span className="text-warm-400 text-xs leading-relaxed">{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="bg-ivory py-20">
        <div className="container mx-auto px-6 text-center max-w-xl">
          <h2 className="font-display text-4xl sm:text-5xl italic text-warm-950 mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-warm-500 text-sm mb-8">
            El registro es gratuito y tarda menos de un minuto.
            Tu primera visita ya cuenta.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 bg-brand-700 hover:bg-brand-800 text-ivory px-12 py-4 text-xs tracking-widest uppercase font-medium transition-colors group"
          >
            Activar mi Circle
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  )
}
