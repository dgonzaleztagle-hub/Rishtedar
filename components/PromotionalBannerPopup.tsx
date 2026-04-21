'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Promotion } from '@/types'

export function PromotionalBannerPopup() {
  const [banner, setBanner] = useState<Promotion | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/banners/active')
        const list: Promotion[] = await res.json()
        if (!list?.length) return

        const today = new Date().toISOString().split('T')[0]

        const unseen = list.filter(p => {
          const key = `banner_shown_${p.id}`
          return localStorage.getItem(key) !== today
        })
        if (!unseen.length) return

        const pick = unseen[Math.floor(Math.random() * unseen.length)]
        localStorage.setItem(`banner_shown_${pick.id}`, today)
        setBanner(pick)
        setVisible(true)
      } catch {
        // silencioso
      }
    }
    load()
  }, [])

  if (!banner || !visible) return null

  const bg          = banner.background_color ?? '#91226f'
  const color       = banner.text_color       ?? '#ffffff'
  const font        = banner.font_family      ?? 'Yatra One'
  const size        = banner.font_size        ?? 28
  const pad         = banner.banner_padding   ?? 24
  const radius      = banner.border_radius    ?? 8
  const hasImg      = !!banner.image_url
  const overlayOpacity = (banner.overlay_opacity ?? 60) / 100

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4"
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-md w-full shadow-2xl overflow-hidden"
            style={{
              borderRadius: `${radius}px`,
              minHeight: '220px',
              backgroundColor: bg,   // ← base sólida, garantiza que nunca sea transparente
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Capa 1: imagen de fondo (encima del color base) */}
            {hasImg && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${banner.image_url}')` }}
              />
            )}

            {/* Capa 2: color sobre la imagen, opacidad controlada por el admin */}
            {hasImg && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: bg,
                  opacity: overlayOpacity,
                }}
              />
            )}

            {/* Botón cerrar */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/25 hover:bg-black/40 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} style={{ color }} />
            </button>

            {/* Contenido */}
            <div
              className="relative z-10"
              style={{ padding: `${pad}px`, fontFamily: font, color }}
            >
              <h2
                className="font-bold leading-tight"
                style={{ fontSize: `${size}px` }}
              >
                {banner.title}
              </h2>

              {banner.description && (
                <p
                  className="mt-2 leading-snug opacity-90"
                  style={{ fontSize: `${Math.max(13, size - 8)}px` }}
                >
                  {banner.description}
                </p>
              )}

              <button
                onClick={() => setVisible(false)}
                className="mt-6 w-full py-2.5 rounded font-semibold text-sm uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  color,
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
