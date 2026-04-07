'use client'

import { useNearestLocation } from '@/hooks/useNearestLocation'
import { formatDistance } from '@/lib/utils'
import { MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function NearestLocationBadge() {
  const { location, distance, loading } = useNearestLocation()

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-warm-300 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Detectando ubicación...
      </span>
    )
  }

  if (!location) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Link
        href={`/locales/${location.slug}`}
        className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-gold-700/40 px-4 py-2 hover:border-gold-500/60 transition-all group"
      >
        <MapPin size={14} className="text-gold-400" />
        <span className="text-warm-200 text-sm">
          Tu local más cercano:{' '}
          <span className="text-gold-400 font-medium">
            {location.name.replace('Rishtedar ', '')}
          </span>
          {distance !== null && (
            <span className="text-warm-400 ml-1.5">
              ({formatDistance(distance)})
            </span>
          )}
        </span>
        <span className="text-warm-500 group-hover:text-gold-400 transition-colors text-xs ml-1">→</span>
      </Link>
    </motion.div>
  )
}
