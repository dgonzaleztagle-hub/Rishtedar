'use client'

import { useActivePromotion } from '@/hooks/useActivePromotion'
import { Tag, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function PromoBanner({ businessId }: { businessId?: string }) {
  const { promotion, loading } = useActivePromotion(businessId)
  const [dismissed, setDismissed] = useState(false)

  if (loading || !promotion || dismissed) return null

  const value =
    promotion.discount_type === 'percent'
      ? `${promotion.discount_value}% OFF`
      : `$${promotion.discount_value.toLocaleString('es-CL')} OFF`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-brand-800 text-ivory overflow-hidden"
      >
        <div className="container mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Tag size={13} className="text-gold-400 shrink-0" />
            <p className="text-xs sm:text-sm truncate">
              <span className="text-gold-400 font-medium">{value}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="hidden sm:inline truncate">{promotion.title}</span>
              {promotion.applicable_to === 'delivery_only' && (
                <span className="hidden md:inline text-warm-300 text-xs ml-2">solo delivery</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/order"
              className="text-[10px] sm:text-xs tracking-widest uppercase text-gold-400 hover:text-gold-300 transition-colors font-medium whitespace-nowrap"
            >
              Pedir →
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-warm-400 hover:text-warm-200 transition-colors"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
