'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, UtensilsCrossed } from 'lucide-react'
import { DEMO_MENU_ITEMS } from '@/lib/data/menu-demo'
import { LOCATIONS } from '@/lib/locations'
import { formatCLP } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function SearchFlow() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  // Sync if URL param changes (e.g. back/forward nav)
  useEffect(() => {
    const q = searchParams.get('q')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q !== null) setQuery(q)
  }, [searchParams])

  const results = useMemo(() => {
    if (!query || query.length < 2) return { items: [], locations: [] }
    const q = query.toLowerCase()

    const items = DEMO_MENU_ITEMS.filter(i =>
      i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)
    ).slice(0, 6)

    const locations = LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
    )

    return { items, locations }
  }, [query])

  const hasResults = results.items.length > 0 || results.locations.length > 0

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <h1 className="font-display text-5xl italic text-warm-950 mb-8 text-center">Buscar</h1>

      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar platos, locales..."
          className="w-full pl-12 pr-5 py-4 border-2 border-warm-200 focus:border-brand-400 text-warm-900 text-base placeholder:text-warm-400 focus:outline-none transition-colors bg-white"
        />
      </div>

      <AnimatePresence mode="wait">
        {query.length >= 2 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {!hasResults ? (
              <p className="text-center text-warm-400 py-8">Sin resultados para &ldquo;{query}&rdquo;</p>
            ) : (
              <div className="space-y-8">
                {results.locations.length > 0 && (
                  <div>
                    <p className="text-warm-500 text-xs tracking-widest uppercase mb-3">Locales</p>
                    <div className="space-y-2">
                      {results.locations.map(loc => (
                        <Link key={loc.id} href={`/locales/${loc.slug}`}
                          className="flex items-center gap-3 bg-white border border-warm-200 hover:border-brand-300 p-4 transition-all"
                        >
                          <MapPin size={16} className="text-brand-500 shrink-0" />
                          <div>
                            <p className="text-warm-800 font-medium">{loc.name}</p>
                            <p className="text-warm-500 text-sm">{loc.address}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.items.length > 0 && (
                  <div>
                    <p className="text-warm-500 text-xs tracking-widest uppercase mb-3">Platos</p>
                    <div className="space-y-2">
                      {results.items.map(item => (
                        <Link key={item.id} href={`/order?item=${item.id}`}
                          className="flex items-center justify-between gap-3 bg-white border border-warm-200 hover:border-brand-300 p-4 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <UtensilsCrossed size={16} className="text-brand-500 shrink-0" />
                            <div>
                              <p className="text-warm-800 font-medium">{item.name}</p>
                              <p className="text-warm-500 text-sm line-clamp-1">{item.description}</p>
                            </div>
                          </div>
                          <span className="text-gold-600 font-display text-lg shrink-0">{formatCLP(item.price)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {query.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-warm-300 text-base">Escribe para buscar platos o locales</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
