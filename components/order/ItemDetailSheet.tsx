'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Leaf, Wheat, Flame } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatCLP } from '@/lib/utils'
import type { MenuItem } from '@/types'

// ─── per-category visual identity ────────────────────────────────────────────

export const CATEGORY_STYLES: Record<string, { gradient: string; emoji: string }> = {
  'cat-entradas':    { gradient: 'from-[#3d1800] via-[#6b2d00] to-[#1a0a00]', emoji: '🥗' },
  'cat-principales': { gradient: 'from-[#2d0005] via-[#5c0010] to-[#1a0005]', emoji: '🍛' },
  'cat-tandoor':     { gradient: 'from-[#3d1500] via-[#7c2a00] to-[#1a0800]', emoji: '🔥' },
  'cat-biryani':     { gradient: 'from-[#2a1a00] via-[#5c3a00] to-[#1a0f00]', emoji: '🍚' },
  'cat-vegetariano': { gradient: 'from-[#002a10] via-[#005520] to-[#001508]', emoji: '🌿' },
  'cat-postres':     { gradient: 'from-[#2d0020] via-[#5c0040] to-[#1a0015]', emoji: '🍮' },
  'cat-bebidas':     { gradient: 'from-[#001a2d] via-[#003a5c] to-[#000f1a]', emoji: '☕' },
}

const DEFAULT_STYLE = { gradient: 'from-warm-950 via-warm-900 to-warm-950', emoji: '🍽️' }

const DIETARY_LABELS: Record<string, { label: string; icon: typeof Leaf; color: string }> = {
  vegetarian:   { label: 'Vegetariano',  icon: Leaf,  color: 'text-emerald-400 bg-emerald-900/40 border-emerald-800' },
  vegan:        { label: 'Vegano',       icon: Leaf,  color: 'text-emerald-300 bg-emerald-900/40 border-emerald-700' },
  'gluten-free':{ label: 'Sin gluten',   icon: Wheat, color: 'text-amber-400 bg-amber-900/40 border-amber-800' },
  spicy:        { label: 'Picante',      icon: Flame, color: 'text-red-400 bg-red-900/40 border-red-800' },
}

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten', nuts: 'Frutos secos', dairy: 'Lácteos',
  shellfish: 'Mariscos', eggs: 'Huevo', soy: 'Soja',
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  item: MenuItem | null
  onClose: () => void
}

export function ItemDetailSheet({ item, onClose }: Props) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore(s => s.addItem)
  const existingCartItem = useCartStore(s =>
    item ? s.items.find(i => i.menu_item.id === item.id) : undefined
  )

  const style = item ? (CATEGORY_STYLES[item.category_id] ?? DEFAULT_STYLE) : DEFAULT_STYLE

  function handleAdd() {
    if (!item) return
    addItem(item, qty)
    onClose()
  }

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Sheet — slides from bottom on mobile, centers on desktop */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-6"
            onClick={e => e.target === e.currentTarget && onClose()}
          >
            <div
              className="relative w-full md:max-w-lg bg-warm-950 md:rounded-none overflow-hidden"
              style={{ maxHeight: '92vh' }}
            >
              {/* ── Hero image area ── */}
              <div
                className="relative h-52 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${style.gradient.replace('from-', '').replace(' via-', ', ').replace(' to-', ', ')})` }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {/* Use the raw gradient string for inline style */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, var(--from) 0%, var(--via) 50%, var(--to) 100%)`,
                      }}
                    />
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />
                    <span className="relative text-7xl select-none" role="img">
                      {style.emoji}
                    </span>
                  </>
                )}
                {/* Price badge */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5">
                  <span className="font-display text-xl text-gold-400">
                    {formatCLP(item.price)}
                  </span>
                </div>
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm flex items-center justify-center text-warm-300 hover:text-ivory transition-colors"
                >
                  <X size={16} />
                </button>
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 bg-black/40 backdrop-blur-sm text-warm-300">
                    {item.category_id.replace('cat-', '').replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* ── Content ── */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 208px)' }}>
                {/* Name */}
                <h2 className="font-display text-3xl italic text-ivory mb-2 leading-tight">
                  {item.name}
                </h2>

                {/* Description */}
                {item.description && (
                  <p className="text-warm-400 text-sm leading-relaxed mb-5">
                    {item.description}
                  </p>
                )}

                {/* Dietary tags */}
                {item.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.dietary_tags.map(tag => {
                      const info = DIETARY_LABELS[tag]
                      if (!info) return null
                      const Icon = info.icon
                      return (
                        <span
                          key={tag}
                          className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 border ${info.color}`}
                        >
                          <Icon size={10} />
                          {info.label}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Allergens */}
                {item.allergens.length > 0 && (
                  <p className="text-warm-600 text-xs mb-5">
                    <span className="text-warm-500">Alérgenos: </span>
                    {item.allergens.map(a => ALLERGEN_LABELS[a] ?? a).join(', ')}
                  </p>
                )}

                <div className="h-px bg-warm-800 mb-5" />

                {/* Qty + CTA */}
                <div className="flex items-center gap-4">
                  {/* Qty selector */}
                  <div className="flex items-center gap-3 bg-warm-900 border border-warm-800 px-1 py-1">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center text-warm-400 hover:text-ivory transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-display text-lg text-ivory w-6 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-8 h-8 flex items-center justify-center text-warm-400 hover:text-ivory transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAdd}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-brand-700 hover:bg-brand-800 text-ivory py-3.5 text-xs tracking-widest uppercase font-medium transition-colors"
                  >
                    <ShoppingBag size={14} />
                    {existingCartItem
                      ? `Agregar ${qty} más · ${formatCLP(item.price * qty)}`
                      : `Agregar · ${formatCLP(item.price * qty)}`
                    }
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
