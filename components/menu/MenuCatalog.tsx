'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Leaf, Wheat, Flame, ShoppingBag, Search, Filter, ChevronDown, X
} from 'lucide-react'
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS } from '@/lib/data/menu-demo'
import type { DietaryTag, Allergen } from '@/types'
import { formatCLP } from '@/lib/utils'

const DIETARY_OPTIONS: { tag: DietaryTag; label: string; icon: typeof Leaf; color: string }[] = [
  { tag: 'vegetarian', label: 'Vegetariano', icon: Leaf, color: 'text-emerald-600' },
  { tag: 'vegan', label: 'Vegano', icon: Leaf, color: 'text-emerald-700' },
  { tag: 'gluten-free', label: 'Sin gluten', icon: Wheat, color: 'text-amber-600' },
  { tag: 'spicy', label: 'Picante', icon: Flame, color: 'text-red-500' },
  { tag: 'halal', label: 'Halal', icon: Leaf, color: 'text-blue-600' },
]

const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  nuts: 'Frutos secos',
  dairy: 'Lácteos',
  shellfish: 'Mariscos',
  eggs: 'Huevo',
  soy: 'Soja',
}

export function MenuCatalog() {
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<Set<DietaryTag>>(new Set())
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  function toggleTag(tag: DietaryTag) {
    setActiveTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const filtered = useMemo(() => {
    return DEMO_MENU_ITEMS.filter(item => {
      if (!item.is_active) return false
      if (activeCat && item.category_id !== activeCat) return false
      if (activeTags.size > 0 && !Array.from(activeTags).every(t => item.dietary_tags.includes(t))) return false
      if (search) {
        const q = search.toLowerCase()
        return item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [activeCat, activeTags, search])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const cat of DEMO_CATEGORIES) {
      const items = filtered.filter(i => i.category_id === cat.id)
      if (items.length > 0) map.set(cat.id, items)
    }
    return map
  }, [filtered])

  const hasFilters = activeCat !== null || activeTags.size > 0 || search !== ''

  return (
    <div className="bg-ivory min-h-screen">
      {/* Sticky filter bar */}
      <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                placeholder="Buscar plato..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-warm-50 border border-warm-200 text-warm-800 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 flex-nowrap">
              <button
                onClick={() => setActiveCat(null)}
                className={`shrink-0 px-4 py-2 text-xs tracking-wider uppercase font-medium transition-all ${
                  activeCat === null
                    ? 'bg-brand-700 text-ivory'
                    : 'border border-warm-300 text-warm-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                Todo
              </button>
              {DEMO_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                  className={`shrink-0 px-4 py-2 text-xs tracking-wider uppercase font-medium transition-all ${
                    activeCat === cat.id
                      ? 'bg-brand-700 text-ivory'
                      : 'border border-warm-300 text-warm-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Diet filters toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 border text-xs tracking-wider uppercase font-medium transition-all ${
                activeTags.size > 0
                  ? 'border-brand-400 text-brand-700 bg-brand-50'
                  : 'border-warm-300 text-warm-600 hover:border-brand-300'
              }`}
            >
              <Filter size={13} />
              Filtros
              {activeTags.size > 0 && (
                <span className="bg-brand-700 text-ivory rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {activeTags.size}
                </span>
              )}
              <ChevronDown size={12} className={filtersOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>

          {/* Dietary filters row */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const active = activeTags.has(opt.tag)
                    return (
                      <button
                        key={opt.tag}
                        onClick={() => toggleTag(opt.tag)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all ${
                          active
                            ? `border-current ${opt.color} bg-current/10`
                            : 'border-warm-200 text-warm-500 hover:border-warm-400'
                        }`}
                      >
                        <Icon size={11} className={active ? opt.color : ''} />
                        {opt.label}
                      </button>
                    )
                  })}
                  {activeTags.size > 0 && (
                    <button
                      onClick={() => setActiveTags(new Set())}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700 border border-dashed border-warm-300"
                    >
                      <X size={11} />
                      Limpiar
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Menu content */}
      <div className="container mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-3xl italic text-warm-300 mb-3">Sin resultados</p>
            <p className="text-warm-400 text-sm mb-6">Prueba cambiando los filtros o la búsqueda</p>
            <button
              onClick={() => { setActiveCat(null); setActiveTags(new Set()); setSearch('') }}
              className="text-brand-700 text-sm underline underline-offset-4"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {Array.from(grouped.entries()).map(([catId, items]) => {
              const category = DEMO_CATEGORIES.find(c => c.id === catId)
              if (!category) return null
              return (
                <motion.section
                  key={catId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Category title */}
                  <div className="flex items-baseline gap-4 mb-8">
                    <h2 className="font-display text-4xl italic text-warm-950">
                      {category.name}
                    </h2>
                    <div className="flex-1 h-px bg-warm-200" />
                    <span className="text-warm-400 text-sm">{items.length} platos</span>
                  </div>

                  {/* Items grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map(item => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </motion.section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItemCard({ item }: { item: typeof DEMO_MENU_ITEMS[0] }) {
  return (
    <div className="bg-white border border-warm-200 p-6 hover:border-warm-300 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name + dietary tags */}
          <div className="flex items-start gap-2 mb-1.5 flex-wrap">
            <h3 className="font-medium text-warm-900 text-base">{item.name}</h3>
            <div className="flex gap-1 flex-wrap mt-0.5">
              {item.dietary_tags.map(tag => {
                const opt = DIETARY_OPTIONS.find(o => o.tag === tag)
                if (!opt) return null
                const Icon = opt.icon
                return (
                  <span
                    key={tag}
                    title={opt.label}
                    className={`${opt.color} shrink-0`}
                  >
                    <Icon size={13} />
                  </span>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <p className="text-warm-500 text-sm leading-relaxed mb-3 line-clamp-2">
            {item.description}
          </p>

          {/* Allergens */}
          {item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.allergens.map(a => (
                <span
                  key={a}
                  className="text-[10px] text-warm-400 bg-warm-50 border border-warm-200 px-1.5 py-0.5"
                >
                  {ALLERGEN_LABELS[a]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image placeholder */}
        <div className="w-20 h-20 bg-warm-100 shrink-0 flex items-center justify-center">
          <span className="text-warm-300 text-3xl">🍛</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-100">
        <span className="font-display text-2xl text-gold-600">{formatCLP(item.price)}</span>
        <Link
          href={`/order?item=${item.id}`}
          className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-ivory text-xs tracking-widest uppercase font-medium px-4 py-2 transition-colors"
        >
          <ShoppingBag size={12} />
          Agregar
        </Link>
      </div>
    </div>
  )
}
