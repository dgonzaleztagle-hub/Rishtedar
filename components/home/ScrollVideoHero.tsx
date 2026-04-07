'use client'

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { NearestLocationBadge } from './NearestLocationBadge'
import { ShoppingBag, CalendarCheck } from 'lucide-react'

// 240 frames @ 30fps extraídos con el pipeline ScrollDrivenVideoWow
const TOTAL_FRAMES = 240
const FRAMES = Array.from({ length: TOTAL_FRAMES }, (_, i) =>
  `/hero-frames/frame_${String(i + 1).padStart(4, '0')}.webp`
)

export function ScrollVideoHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const imgMap       = useRef<Map<string, HTMLImageElement>>(new Map())
  const loaded       = useRef<Set<number>>(new Set())
  const curFrame     = useRef(0)
  const rafId        = useRef(0)

  // Draw a specific frame onto the canvas (cover behaviour)
  const drawFrame = useCallback((idx: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imgMap.current.get(FRAMES[idx])
    if (!img?.complete) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // object-fit: cover
    const ia = img.width / img.height
    const ca = canvas.width / canvas.height
    let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0
    if (ia > ca) { dw = canvas.height * ia; dx = (canvas.width - dw) / 2 }
    else         { dh = canvas.width / ia;  dy = (canvas.height - dh) / 2 }
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // Preload a window of frames around `center`
  const preload = useCallback((center: number, radius = 20) => {
    const start = Math.max(0, center - radius)
    const end   = Math.min(TOTAL_FRAMES - 1, center + radius)
    for (let i = start; i <= end; i++) {
      if (loaded.current.has(i)) continue
      const img = new Image()
      img.src = FRAMES[i]
      img.onload = () => {
        imgMap.current.set(FRAMES[i], img)
        loaded.current.add(i)
        // Repaint if this is the current frame
        if (i === curFrame.current) drawFrame(i)
      }
    }
  }, [drawFrame])

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      drawFrame(curFrame.current)
    }
    resize()
    window.addEventListener('resize', resize)
    preload(0, 40) // eager-load first 40 frames
    return () => window.removeEventListener('resize', resize)
  }, [drawFrame, preload])

  // Scroll → frame mapping
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return
        const rect     = el.getBoundingClientRect()
        const maxScroll = el.offsetHeight - window.innerHeight
        const progress  = Math.max(0, Math.min(1, -rect.top / maxScroll))
        const frame     = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES))

        if (frame !== curFrame.current) {
          curFrame.current = frame
          drawFrame(frame)
          preload(frame)
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [drawFrame, preload])

  return (
    /* 300vh de recorrido — el usuario "scrubea" los 8s del video */
    <div ref={containerRef} style={{ height: '300vh' }}>

      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ── CANVAS (frame-by-frame) ──────────────────────────────── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Scrim cinemático */}
        <div className="absolute inset-0 bg-gradient-to-b from-warm-950/55 via-warm-950/20 to-warm-950/65" />

        {/* Línea dorada superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/60 to-transparent" />

        {/* ── OVERLAY DE CONTENIDO ────────────────────────────────── */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pt-24">

          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <NearestLocationBadge />
          </div>

          <p
            className="text-gold-500 text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            Restaurante indio · Santiago & Miami
          </p>

          <h1
            className="font-display text-[clamp(3.5rem,10vw,7rem)] leading-[1.0] italic text-ivory max-w-5xl mb-6 animate-fade-in"
            style={{ animationDelay: '0.55s' }}
          >
            Donde la India
            <br />
            <span className="text-gold-gradient">se sienta a la mesa</span>
          </h1>

          <p
            className="text-warm-200/80 text-base md:text-lg max-w-xl leading-relaxed mb-12 animate-fade-in"
            style={{ animationDelay: '0.7s' }}
          >
            Especias ancestrales, recetas transmitidas por generaciones.
            Una experiencia gastronómica pensada para reunir y celebrar.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 w-full max-w-sm animate-fade-in"
            style={{ animationDelay: '0.85s' }}
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
              className="flex-1 flex items-center justify-center gap-2.5 border border-gold-600/80 text-gold-400 hover:bg-gold-600 hover:text-warm-950 py-4 px-8 text-xs tracking-widest uppercase font-medium transition-all duration-300 group"
            >
              <CalendarCheck size={15} className="group-hover:scale-110 transition-transform" />
              Reservar
            </Link>
          </div>

          <div
            className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-4 border-t border-warm-700/40 pt-8 animate-fade-in"
            style={{ animationDelay: '1.1s' }}
          >
            {[
              { value: '5',   label: 'Locales' },
              { value: '15+', label: 'Años de experiencia' },
              { value: '60+', label: 'Platos en carta' },
              { value: '2',   label: 'Países' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl italic text-gold-500">{stat.value}</p>
                <p className="text-warm-400 text-[10px] tracking-widest uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fade inferior hacia la página */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ivory to-transparent" />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in"
          style={{ animationDelay: '1.8s' }}
        >
          <span className="text-warm-400 text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gold-600/60 to-transparent animate-pulse" />
        </div>

      </div>
    </div>
  )
}
