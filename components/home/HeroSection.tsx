'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { NearestLocationBadge } from './NearestLocationBadge'
import { ShoppingBag, CalendarCheck } from 'lucide-react'

const FADE_UP = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background — cinematic dark gradient (replace with real image once available) */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-950 via-[#1a0a04] to-brand-950">
        {/* Decorative spice pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #c9952a 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #91226f 0%, transparent 40%)`,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,149,42,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(201,149,42,0.5) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Gold accent line — top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">

        {/* Nearest location badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <NearestLocationBadge />
        </motion.div>

        {/* Sub-headline */}
        <motion.p
          variants={FADE_UP}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-gold-500 text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6"
        >
          Restaurante indio · Santiago & Miami
        </motion.p>

        {/* Main headline */}
        <motion.h1
          variants={FADE_UP}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.9, delay: 0.45 }}
          className="font-display text-[clamp(3.5rem,10vw,7rem)] leading-[1.0] italic text-ivory max-w-5xl mb-6"
        >
          Donde la India
          <br />
          <span className="text-gold-gradient">se sienta a la mesa</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={FADE_UP}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-warm-300 text-base md:text-lg max-w-xl leading-relaxed mb-12"
        >
          Especias ancestrales, recetas transmitidas por generaciones.
          Una experiencia gastronómica pensada para reunir y celebrar.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={FADE_UP}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <Link
            href="/order"
            className="flex-1 flex items-center justify-center gap-2.5 bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-ivory py-4 px-8 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
          >
            <ShoppingBag size={15} className="group-hover:scale-110 transition-transform" />
            Pedir ahora
          </Link>
          <Link
            href="/reservar"
            className="flex-1 flex items-center justify-center gap-2.5 border border-gold-600 text-gold-400 hover:bg-gold-600 hover:text-warm-950 py-4 px-8 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
          >
            <CalendarCheck size={15} className="group-hover:scale-110 transition-transform" />
            Reservar
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-warm-800/50 pt-10"
        >
          {[
            { value: '5', label: 'Locales' },
            { value: '15+', label: 'Años de experiencia' },
            { value: '60+', label: 'Platos en carta' },
            { value: '2', label: 'Países' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl italic text-gold-500">{stat.value}</p>
              <p className="text-warm-500 text-xs tracking-widest uppercase mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ivory to-transparent" />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-warm-500 text-[10px] tracking-widest uppercase">Explorar</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-gold-600/60 to-transparent"
        />
      </motion.div>
    </section>
  )
}
