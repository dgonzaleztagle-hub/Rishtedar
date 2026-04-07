'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Leaf, Wheat, Flame } from 'lucide-react'
import { DEMO_MENU_ITEMS } from '@/lib/data/menu-demo'
import type { DietaryTag } from '@/types'

// ─── signature dishes shown on every location page ──────────────────────────

const SIGNATURE_IDS = ['item-013', 'item-012', 'item-003', 'item-051']
// Chicken Tikka Masala, Lamb Rogan Josh, Paneer Tikka, Gulab Jamun

const TAG_CONFIG: Record<DietaryTag, { label: string; color: string; icon?: React.ReactNode }> = {
  'vegan':       { label: 'Vegano',       color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'vegetarian':  { label: 'Vegetariano',  color: 'text-green-600 bg-green-50 border-green-200' },
  'gluten-free': { label: 'Sin gluten',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'spicy':       { label: 'Picante',      color: 'text-red-600 bg-red-50 border-red-200' },
  'halal':       { label: 'Halal',        color: 'text-teal-600 bg-teal-50 border-teal-200' },
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  locationName: string
  slug: string
}

export function LocationMenuPreview({ locationName, slug }: Props) {
  const dishes = SIGNATURE_IDS
    .map(id => DEMO_MENU_ITEMS.find(item => item.id === id))
    .filter(Boolean) as typeof DEMO_MENU_ITEMS

  return (
    <section className="bg-warm-50 py-20 border-y border-warm-200">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-600 text-[10px] tracking-[0.3em] uppercase font-medium mb-2">
              Menú destacado
            </p>
            <h2 className="font-display text-4xl md:text-5xl italic text-warm-950">
              Platos imprescindibles
            </h2>
          </div>
          <Link
            href={`/menu?local=${slug}`}
            className="hidden md:flex items-center gap-2 text-brand-700 hover:text-brand-800 text-xs tracking-widest uppercase font-medium transition-colors group"
          >
            Ver menú completo
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Dishes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishes.map((dish, i) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-warm-200 group hover:border-brand-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Image placeholder — unique gradient per dish */}
              <div className={`h-40 relative overflow-hidden ${DISH_GRADIENTS[i]}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl select-none">{DISH_EMOJIS[i]}</span>
                </div>
                {/* Price badge */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1">
                  <span className="text-gold-400 text-xs font-medium tracking-wider">
                    {formatPrice(dish.price)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display text-xl italic text-warm-950 mb-2 group-hover:text-brand-700 transition-colors">
                  {dish.name}
                </h3>
                <p className="text-warm-500 text-xs leading-relaxed line-clamp-2 mb-3">
                  {dish.description}
                </p>

                {/* Tags */}
                {dish.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dish.dietary_tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className={`text-[9px] tracking-wider uppercase font-medium px-2 py-0.5 border ${TAG_CONFIG[tag]?.color ?? 'text-warm-500 bg-warm-100 border-warm-200'}`}
                      >
                        {TAG_CONFIG[tag]?.label ?? tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href={`/menu?local=${slug}`}
            className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800 text-xs tracking-widest uppercase font-medium transition-colors group"
          >
            Ver menú completo
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  )
}

// ─── visual helpers ───────────────────────────────────────────────────────────

const DISH_GRADIENTS = [
  'bg-gradient-to-br from-orange-100 via-amber-100 to-orange-200',     // Chicken Tikka
  'bg-gradient-to-br from-red-100 via-rose-100 to-red-200',            // Lamb Rogan Josh
  'bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200',     // Paneer Tikka
  'bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100',        // Gulab Jamun
]

const DISH_EMOJIS = ['🍛', '🥘', '🍢', '🍮']
