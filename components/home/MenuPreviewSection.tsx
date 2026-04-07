'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Flame, Leaf, Wheat } from 'lucide-react'

const FEATURED_DISHES = [
  {
    id: '1',
    name: 'Butter Chicken',
    nameEs: 'Pollo en salsa de mantequilla',
    price: 13900,
    category: 'Platos principales',
    tags: ['gluten-free'],
    isSignature: true,
  },
  {
    id: '2',
    name: 'Lamb Rogan Josh',
    nameEs: 'Cordero al estilo kashmiri',
    price: 16900,
    category: 'Platos principales',
    tags: ['gluten-free', 'spicy'],
    isSignature: true,
  },
  {
    id: '3',
    name: 'Paneer Tikka',
    nameEs: 'Queso fresco asado en tandoor',
    price: 11900,
    category: 'Entradas',
    tags: ['vegetarian', 'gluten-free'],
    isSignature: false,
  },
  {
    id: '4',
    name: 'Biryani de Cordero',
    nameEs: 'Arroz basmati con cordero',
    price: 15900,
    category: 'Biryanis',
    tags: ['gluten-free'],
    isSignature: false,
  },
  {
    id: '5',
    name: 'Dal Makhani',
    nameEs: 'Lentejas negras cremosas',
    price: 9900,
    category: 'Vegetariano',
    tags: ['vegetarian'],
    isSignature: false,
  },
]

const TAG_MAP: Record<string, { label: string; icon: typeof Leaf; color: string }> = {
  vegetarian: { label: 'Veg', icon: Leaf, color: 'text-emerald-500' },
  'gluten-free': { label: 'Sin gluten', icon: Wheat, color: 'text-amber-500' },
  spicy: { label: 'Picante', icon: Flame, color: 'text-red-400' },
}

export function MenuPreviewSection() {
  return (
    <section className="bg-warm-950 py-0 overflow-hidden">

      {/* ── EDITORIAL SPLIT ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[700px]">

        {/* LEFT — stacked photos */}
        <div className="relative hidden md:grid grid-rows-2 min-h-[700px]">
          <div className="relative overflow-hidden">
            <Image
              src="/images/brand/Rectangle-14.png"
              alt="Platos Rishtedar"
              fill
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-warm-950/20" />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/images/brand/Rectangle-5.png"
              alt="Cocina india premium"
              fill
              className="object-cover"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-warm-950/30" />
          </div>
          {/* Gold vertical line */}
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-700/40 to-transparent" />
        </div>

        {/* RIGHT — editorial dish list */}
        <div className="flex flex-col justify-center px-6 sm:px-8 md:px-14 py-14 sm:py-20">

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-10"
          >
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-3">
              Lo que más pedimos
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl italic text-ivory leading-none mb-4">
              Platos<br />
              <span className="text-gold-gradient">destacados</span>
            </h2>
          </motion.div>

          {/* Dish list */}
          <div className="divide-y divide-warm-800/60">
            {FEATURED_DISHES.map((dish, i) => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <Link
                  href={`/order?item=${dish.id}`}
                  className="group flex items-center justify-between gap-4 py-5 hover:pl-2 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display text-xl italic text-ivory group-hover:text-gold-400 transition-colors truncate">
                        {dish.name}
                      </span>
                      {dish.isSignature && (
                        <Star size={10} className="text-gold-600 fill-gold-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-warm-500 text-xs">{dish.nameEs}</span>
                      <div className="flex gap-1.5">
                        {dish.tags.map(tag => {
                          const t = TAG_MAP[tag]
                          if (!t) return null
                          const Icon = t.icon
                          return (
                            <span key={tag} className={`${t.color} opacity-70`}>
                              <Icon size={10} />
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-display text-lg text-gold-500">
                      ${dish.price.toLocaleString('es-CL')}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-warm-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 border border-gold-600/60 text-gold-400 hover:bg-gold-600 hover:text-warm-950 px-7 py-3.5 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
            >
              Ver menú completo
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
