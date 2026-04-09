'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, RotateCcw } from 'lucide-react'

// ─── Config ─────────────────────────────────────────────────────────────────

const W = 360
const H = 480
const PLAYER_R = 14
const FOOD_R = 16
const ENEMY_R = 14
const PLAYER_SPEED = 3.5
const FOOD_SCORE = 150
const WIN_SCORE = 1000
const SPAWN_INTERVAL = 1200  // ms entre nuevos items
const ENEMY_SPEED_BASE = 1.2

const FOOD_ITEMS  = ['🍛', '🫓', '🍗', '🥘', '🫕', '🍲']
const ENEMY_ITEMS = ['🥗', '🥦', '🍅', '🥕', '🥬']

// ─── Types ──────────────────────────────────────────────────────────────────

interface Particle { x: number; y: number; dx: number; dy: number; life: number; emoji: string }
interface Item { x: number; y: number; emoji: string; type: 'food' | 'enemy'; vx: number; vy: number; id: number }

interface Props {
  onGameEnd: (score: number, won: boolean) => void
  tokensLeft: number
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RishtedarGame({ onGameEnd, tokensLeft }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    score: 0,
    running: false,
    player: { x: W / 2, y: H - 60 },
    items: [] as Item[],
    particles: [] as Particle[],
    touch: { x: W / 2, y: H - 60 },
    mouse: { x: W / 2, y: H - 60 },
    lastSpawn: 0,
    idCounter: 0,
    animId: 0,
  })
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle')

  const spawnItem = useCallback(() => {
    const s = stateRef.current
    const isFood = Math.random() < 0.6
    const emoji = isFood
      ? FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)]
      : ENEMY_ITEMS[Math.floor(Math.random() * ENEMY_ITEMS.length)]
    const x = FOOD_R + Math.random() * (W - FOOD_R * 2)
    const speed = ENEMY_SPEED_BASE + Math.random() * 1.5
    s.items.push({ x, y: -FOOD_R, emoji, type: isFood ? 'food' : 'enemy', vx: (Math.random() - 0.5) * 1.2, vy: speed, id: s.idCounter++ })
  }, [])

  const addParticles = useCallback((x: number, y: number, emoji: string) => {
    const s = stateRef.current
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x, y, emoji,
        dx: (Math.random() - 0.5) * 5,
        dy: -Math.random() * 4 - 1,
        life: 1,
      })
    }
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    s.score = 0
    s.items = []
    s.particles = []
    s.player = { x: W / 2, y: H - 60 }
    s.lastSpawn = 0
    s.running = true
    setScore(0)
    setStatus('playing')
  }, [])

  const endGame = useCallback((won: boolean) => {
    const s = stateRef.current
    s.running = false
    cancelAnimationFrame(s.animId)
    setStatus(won ? 'won' : 'lost')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current

    // ── touch / mouse tracking ──
    const onTouch = (e: TouchEvent) => {
      const r = canvas.getBoundingClientRect()
      const scaleX = W / r.width
      const scaleY = H / r.height
      s.touch.x = (e.touches[0].clientX - r.left) * scaleX
      s.touch.y = (e.touches[0].clientY - r.top) * scaleY
    }
    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const scaleX = W / r.width
      const scaleY = H / r.height
      s.mouse.x = (e.clientX - r.left) * scaleX
      s.mouse.y = (e.clientY - r.top) * scaleY
    }
    canvas.addEventListener('touchmove', onTouch, { passive: true })
    canvas.addEventListener('mousemove', onMouse)

    let lastTime = 0

    const loop = (now: number) => {
      const dt = now - lastTime
      lastTime = now
      s.animId = requestAnimationFrame(loop)

      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#0d0d0d'
      ctx.fillRect(0, 0, W, H)

      // Gold grid pattern
      ctx.strokeStyle = 'rgba(201,149,42,0.05)'
      ctx.lineWidth = 1
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

      if (!s.running) return

      // ── Move player toward touch/mouse ──
      const target = s.touch.y < H - 1 ? s.touch : s.mouse
      const dx = target.x - s.player.x
      const dy = target.y - s.player.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > PLAYER_SPEED) {
        s.player.x += (dx / dist) * PLAYER_SPEED
        s.player.y += (dy / dist) * PLAYER_SPEED
      }
      s.player.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, s.player.x))
      s.player.y = Math.max(PLAYER_R, Math.min(H - PLAYER_R, s.player.y))

      // ── Spawn ──
      if (now - s.lastSpawn > SPAWN_INTERVAL) {
        spawnItem()
        s.lastSpawn = now
      }

      // ── Update items ──
      const levelMult = 1 + Math.floor(s.score / 500) * 0.15
      s.items = s.items.filter(item => {
        item.y += item.vy * levelMult
        item.x += item.vx
        if (item.x < FOOD_R || item.x > W - FOOD_R) item.vx *= -1

        // Collision
        const cdx = item.x - s.player.x
        const cdy = item.y - s.player.y
        const hit = Math.sqrt(cdx * cdx + cdy * cdy) < PLAYER_R + FOOD_R - 4

        if (hit) {
          if (item.type === 'food') {
            s.score += FOOD_SCORE
            setScore(s.score)
            addParticles(item.x, item.y, item.emoji)
            if (s.score >= WIN_SCORE) endGame(true)
            return false
          } else {
            endGame(false)
            return false
          }
        }

        // Off screen
        if (item.y > H + FOOD_R) return false
        return true
      })

      // ── Draw items ──
      ctx.font = `${FOOD_R * 2}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const item of s.items) {
        ctx.globalAlpha = 1
        ctx.fillText(item.emoji, item.x, item.y)
      }

      // ── Particles ──
      s.particles = s.particles.filter(p => {
        p.x += p.dx; p.y += p.dy; p.dy += 0.12; p.life -= 0.04
        if (p.life <= 0) return false
        ctx.globalAlpha = p.life
        ctx.font = '14px serif'
        ctx.fillText(p.emoji, p.x, p.y)
        return true
      })
      ctx.globalAlpha = 1

      // ── Player ──
      const grad = ctx.createRadialGradient(s.player.x, s.player.y, 2, s.player.x, s.player.y, PLAYER_R)
      grad.addColorStop(0, '#f5e642')
      grad.addColorStop(1, '#c9952a')
      ctx.beginPath()
      ctx.arc(s.player.x, s.player.y, PLAYER_R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = 'rgba(201,149,42,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()

      // ── Score ──
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(13,13,13,0.7)'
      ctx.fillRect(0, 0, W, 44)
      ctx.fillStyle = '#c9952a'
      ctx.font = '600 13px var(--font-inter, Inter, sans-serif)'
      ctx.textAlign = 'left'
      ctx.fillText(`${s.score} pts`, 14, 26)

      // Progress bar
      const prog = Math.min(s.score / WIN_SCORE, 1)
      ctx.fillStyle = 'rgba(201,149,42,0.15)'
      ctx.fillRect(0, 40, W, 4)
      ctx.fillStyle = '#c9952a'
      ctx.fillRect(0, 40, W * prog, 4)

      // Tokens
      ctx.fillStyle = 'rgba(201,149,42,0.6)'
      ctx.font = '11px var(--font-inter, Inter, sans-serif)'
      ctx.textAlign = 'right'
      ctx.fillText(`${tokensLeft} fichas`, W - 14, 26)
    }

    s.animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(s.animId)
      canvas.removeEventListener('touchmove', onTouch)
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [spawnItem, addParticles, endGame, tokensLeft])

  return (
    <div className="relative select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm mx-auto block touch-none rounded-sm border border-warm-800"
        style={{ aspectRatio: `${W}/${H}` }}
      />

      {/* Overlays */}
      <AnimatePresence>
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/90 rounded-sm"
          >
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-2">Rishtedar</p>
            <h2 className="font-display text-4xl italic text-ivory mb-3">El Festín</h2>
            <p className="text-warm-400 text-xs text-center max-w-[200px] mb-6 leading-relaxed">
              Come la comida india, evita los vegetales. Llega a 1.000 puntos para ganar.
            </p>
            <p className="text-warm-600 text-[10px] mb-5">
              {tokensLeft > 0 ? `${tokensLeft} intentos válidos disponibles` : 'Modo práctica — sin intentos rankeados'}
            </p>
            <button
              onClick={startGame}
              className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
            >
              Jugar
            </button>
          </motion.div>
        )}

        {(status === 'won' || status === 'lost') && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/92 rounded-sm px-6"
          >
            {status === 'won' ? (
              <>
                <Trophy size={32} className="text-gold-500 mb-3" />
                <h3 className="font-display text-3xl italic text-ivory mb-1">¡Ganaste!</h3>
                <p className="text-gold-400 text-xl font-medium mb-6">{score.toLocaleString('es-CL')} pts</p>
                {tokensLeft > 0 ? (
                  <>
                    <p className="text-warm-400 text-xs text-center mb-5 leading-relaxed max-w-[220px]">
                      ¿Quieres que este score cuente para el ranking semanal?
                      <br /><span className="text-warm-600">Te quedan {tokensLeft} intento{tokensLeft !== 1 ? 's' : ''}.</span>
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => onGameEnd(score, true)}
                        className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-5 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
                      >
                        Sí, usar intento
                      </button>
                      <button
                        onClick={startGame}
                        className="border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200 px-5 py-3 text-xs tracking-widest uppercase font-medium transition-colors flex items-center gap-2"
                      >
                        <RotateCcw size={12} />
                        Practicar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-warm-500 text-xs text-center mb-5 max-w-[200px]">
                      Ya usaste tus 3 intentos esta semana. Sigue practicando.
                    </p>
                    <button
                      onClick={startGame}
                      className="border border-warm-700 text-warm-400 px-6 py-3 text-xs tracking-widest uppercase font-medium flex items-center gap-2"
                    >
                      <RotateCcw size={12} />
                      Jugar de nuevo
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">😵</p>
                <h3 className="font-display text-3xl italic text-ivory mb-1">Game Over</h3>
                <p className="text-warm-400 text-sm mb-6">{score.toLocaleString('es-CL')} pts</p>
                <div className="flex gap-3">
                  <button
                    onClick={startGame}
                    className="bg-brand-700 hover:bg-brand-800 text-ivory px-6 py-3 text-xs tracking-widest uppercase font-medium flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw size={12} />
                    Intentar de nuevo
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
