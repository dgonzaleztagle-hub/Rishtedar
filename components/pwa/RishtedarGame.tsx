'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw } from 'lucide-react'

// ─── Canvas constants ─────────────────────────────────────────────────────────
const W = 360
const H = 480
const RAIL_Y       = 195   // belt center y
const TABLE_Y      = 355   // table surface center y
const DISH_R       = 24    // plate circle radius
const ALIGN_THR    = 58    // px alignment tolerance
const MAX_LIVES    = 3
const PREVIEW_QUEUE_SIZE = 4   // dishes to pre-generate ahead

// ─── Game data ────────────────────────────────────────────────────────────────
const DISHES        = ['🍛', '🍗', '🥘', '🍲', '🍜', '🥙']
const SERVICE_NAMES = ['Desayuno', 'Almuerzo', 'Cena']

interface DayConfig { tables: number; speed: number; dishesPerService: number; patienceDrain: number; beltSpacing: number }
const DAY_CONFIG: DayConfig[] = [
  { tables: 2, speed: 1.2, dishesPerService: 5,  patienceDrain: 0.028, beltSpacing: 180 },
  { tables: 3, speed: 1.8, dishesPerService: 7,  patienceDrain: 0.040, beltSpacing: 140 },
  { tables: 3, speed: 2.6, dishesPerService: 9,  patienceDrain: 0.054, beltSpacing: 105 },
]

function getTablePositions(n: number): number[] { return n === 2 ? [100, 260] : [65, 180, 295] }
function randomDish(exclude?: string): string {
  const pool = DISHES.filter(d => d !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RailDish { id: number; x: number; emoji: string; spawnAnim: number }
interface Table    { x: number; order: string; patience: number; hitFlash: number; missFlash: number; warnPulse: number }
interface Floater  { id: number; x: number; y: number; text: string; alpha: number; color: string; vy: number }
interface CoinJump { id: number; x: number; y: number; vy: number; alpha: number; rotation: number }
type Phase     = 'idle' | 'playing' | 'service-break' | 'day-end' | 'game-over'
type ChefState = 'idle' | 'spawn' | 'combo' | 'angry'

interface Props { onGameEnd: (score: number, counted: boolean) => void; tokensLeft: number }

// ─── Component ────────────────────────────────────────────────────────────────
export function RishtedarGame({ onGameEnd, tokensLeft }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtx  = useRef<AudioContext | null>(null)

  const gs = useRef({
    phase: 'idle' as Phase,
    day: 0, service: 0, score: 0, combo: 0, maxCombo: 0,
    lives: MAX_LIVES, servesThisService: 0, totalServes: 0,
    serviceScore: 0, serviceMaxCombo: 0,
    progressPenalty: 0,
    dishQueue: [] as string[],    // pre-generated upcoming dishes
    dishes:   [] as RailDish[],
    tables:   [] as Table[],
    floaters: [] as Floater[],
    coins:    [] as CoinJump[],
    idCounter: 0, floatCounter: 0, coinCounter: 0,
    animId: 0, lastTick: 0,
    beltOffset: 0,
    shakeTime: 0, shakeMag: 0,
    flashGreen: 0, flashRed: 0, comboFlash: 0,
    chefState: 'idle' as ChefState,
    chefTimer: 0, chefBounce: 0,
    chefX: 30, chefY: 0,          // wandering position (chefY set on startService)
    chefTargetX: 30, chefTargetY: 0,
    chefWanderTimer: 0,
    penaltyFlash: 0,              // red flash on progress bar when penalty hits
  })

  const [phase,      setPhase]      = useState<Phase>('idle')
  const [score,      setScore]      = useState(0)
  const [day,        setDay]        = useState(0)
  const [service,    setService]    = useState(0)
  const [breakStats, setBreakStats] = useState({ score: 0, combo: 0, serves: 0 })

  // ── Audio ──────────────────────────────────────────────────────────────────
  const playSound = useCallback((type: 'coin' | 'error') => {
    try {
      if (typeof window === 'undefined') return
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ac = audioCtx.current
      if (ac.state === 'suspended') ac.resume()

      if (type === 'coin') {
        const note = (freq: number, t: number, dur: number) => {
          const osc = ac.createOscillator(); const g = ac.createGain()
          osc.type = 'square'; osc.frequency.value = freq
          g.gain.setValueAtTime(0.14, ac.currentTime + t)
          g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + dur)
          osc.connect(g); g.connect(ac.destination)
          osc.start(ac.currentTime + t); osc.stop(ac.currentTime + t + dur)
        }
        note(988,  0,    0.09)   // B5 — first ping
        note(1319, 0.07, 0.16)   // E6 — rising coin
      } else {
        // Error: descending sawtooth buzz
        const osc = ac.createOscillator(); const g = ac.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, ac.currentTime)
        osc.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.13)
        g.gain.setValueAtTime(0.18, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15)
        osc.connect(g); g.connect(ac.destination)
        osc.start(); osc.stop(ac.currentTime + 0.15)
      }
    } catch { /* audio unavailable — silently ignore */ }
  }, [])

  // ── Spawn helpers ──────────────────────────────────────────────────────────
  const spawnFloater = useCallback((x: number, y: number, text: string, color: string) => {
    const s = gs.current
    s.floaters.push({ id: s.floatCounter++, x, y, text, alpha: 1, color, vy: -1.5 })
  }, [])

  const spawnCoin = useCallback((x: number, y: number) => {
    const s = gs.current
    s.coins.push({
      id: s.coinCounter++,
      x: x + (Math.random() - 0.5) * 22,
      y,
      vy: -7.5 - Math.random() * 2,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
    })
  }, [])

  // ── Table factory ──────────────────────────────────────────────────────────
  const buildTables = useCallback((count: number): Table[] =>
    getTablePositions(count).map(x => ({
      x, order: randomDish(), patience: 1, hitFlash: 0, missFlash: 0, warnPulse: 0,
    })), [])

  const setGsPhase = useCallback((p: Phase) => { gs.current.phase = p; setPhase(p) }, [])

  // ── Service lifecycle ──────────────────────────────────────────────────────
  const startService = useCallback((d: number, svc: number) => {
    const s = gs.current
    s.day = d; s.service = svc
    s.dishes = []; s.floaters = []; s.coins = []
    s.tables = buildTables(DAY_CONFIG[Math.min(d, DAY_CONFIG.length - 1)].tables)
    s.servesThisService = 0; s.serviceScore = 0; s.serviceMaxCombo = 0
    s.progressPenalty = 0
    // Pre-generate dish queue
    s.dishQueue = Array.from({ length: PREVIEW_QUEUE_SIZE }, () => DISHES[Math.floor(Math.random() * DISHES.length)])
    s.lastTick = performance.now(); s.beltOffset = 0
    s.chefState = 'idle'; s.chefTimer = 0; s.chefBounce = 0
    s.chefX = 30; s.chefY = RAIL_Y - 58
    s.chefTargetX = 30; s.chefTargetY = RAIL_Y - 58
    s.chefWanderTimer = 0; s.penaltyFlash = 0
    s.shakeTime = 0; s.flashGreen = 0; s.flashRed = 0
    setDay(d); setService(svc); setGsPhase('playing')
  }, [buildTables, setGsPhase])

  const startGame = useCallback(() => {
    const s = gs.current
    s.score = 0; s.combo = 0; s.maxCombo = 0; s.lives = MAX_LIVES; s.totalServes = 0
    setScore(0); startService(0, 0)
  }, [startService])

  const endService = useCallback(() => {
    const s = gs.current
    setBreakStats({ score: s.serviceScore, combo: s.serviceMaxCombo, serves: s.servesThisService })
    setGsPhase('service-break')
  }, [setGsPhase])

  const nextService = useCallback(() => {
    const s = gs.current
    const nextSvc = s.service + 1
    if (nextSvc >= 3) {
      if (s.day + 1 >= DAY_CONFIG.length) setGsPhase('game-over')
      else setGsPhase('day-end')
    } else startService(s.day, nextSvc)
  }, [startService, setGsPhase])

  const nextDay = useCallback(() => { startService(gs.current.day + 1, 0) }, [startService])

  // ── Tap handler ────────────────────────────────────────────────────────────
  const handleTap = useCallback((tapX: number) => {
    const s = gs.current
    if (s.phase !== 'playing') return

    let nearestIdx = -1, minDist = 999
    s.tables.forEach((t, i) => { const d = Math.abs(t.x - tapX); if (d < minDist) { minDist = d; nearestIdx = i } })
    if (nearestIdx === -1 || minDist > 95) return

    const table   = s.tables[nearestIdx]
    const aligned = s.dishes.find(d => d.emoji === table.order && Math.abs(d.x - table.x) < ALIGN_THR)

    if (aligned) {
      // ✅ Correct
      const pts = 100 * (s.combo + 1)
      s.score += pts; s.serviceScore += pts; s.combo++
      s.serviceMaxCombo = Math.max(s.serviceMaxCombo, s.combo)
      s.maxCombo        = Math.max(s.maxCombo, s.combo)
      s.servesThisService++; s.totalServes++
      s.dishes    = s.dishes.filter(d => d.id !== aligned.id)
      table.order = randomDish(table.order); table.patience = 1; table.hitFlash = 520
      s.flashGreen = 140; s.comboFlash = 460
      s.chefState  = s.combo >= 3 ? 'combo' : 'spawn'
      s.chefTimer  = 650

      spawnCoin(table.x, TABLE_Y - 16)
      spawnFloater(table.x + 26, TABLE_Y - 50, pts >= 300 ? `+${pts} 🔥` : `+${pts}`, s.combo >= 3 ? '#fbbf24' : '#4ade80')
      if (s.combo >= 5) spawnFloater(table.x, TABLE_Y - 74, `×${s.combo} COMBO!`, '#f59e0b')
      playSound('coin')
      setScore(s.score)

      const cfg = DAY_CONFIG[Math.min(s.day, DAY_CONFIG.length - 1)]
      if (s.servesThisService >= cfg.dishesPerService) endService()
    } else {
      // ❌ Miss — deduct points (min 0)
      const penalty = 50
      s.score = Math.max(0, s.score - penalty)
      s.combo = 0; table.missFlash = 420
      s.flashRed = 95; s.shakeTime = 230; s.shakeMag = 5
      s.chefState = 'angry'; s.chefTimer = 520
      spawnFloater(table.x, TABLE_Y - 50, `−${penalty}`, '#ef4444')
      playSound('error')
      setScore(s.score)
    }
  }, [endService, spawnFloater, spawnCoin, playSound])

  // ── Render loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = gs.current

    const onCanvasClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      handleTap((e.clientX - r.left) * (W / r.width))
    }
    const onCanvasTouch = (e: TouchEvent) => {
      e.preventDefault()
      const r = canvas.getBoundingClientRect()
      handleTap((e.changedTouches[0].clientX - r.left) * (W / r.width))
    }
    canvas.addEventListener('click', onCanvasClick)
    canvas.addEventListener('touchend', onCanvasTouch, { passive: false })

    const loop = (now: number) => {
      s.animId = requestAnimationFrame(loop)
      const dt = Math.min(now - s.lastTick, 50)
      s.lastTick = now

      // ── Background ─────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)
      const bgG = ctx.createLinearGradient(0, 0, 0, H)
      bgG.addColorStop(0, '#0f0c07'); bgG.addColorStop(1, '#060402')
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(201,149,42,0.022)'; ctx.lineWidth = 1
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

      if (s.phase !== 'playing') return

      const cfg = DAY_CONFIG[Math.min(s.day, DAY_CONFIG.length - 1)]

      // ── Timers ─────────────────────────────────────────────────────────
      if (s.shakeTime    > 0) s.shakeTime    -= dt
      if (s.flashGreen   > 0) s.flashGreen   -= dt
      if (s.flashRed     > 0) s.flashRed     -= dt
      if (s.comboFlash   > 0) s.comboFlash   -= dt
      if (s.penaltyFlash > 0) s.penaltyFlash -= dt
      if (s.chefTimer    > 0) { s.chefTimer  -= dt; if (s.chefTimer <= 0) s.chefState = 'idle' }
      s.beltOffset  = (s.beltOffset + cfg.speed * (dt / 16)) % 20
      s.chefBounce  = (s.chefBounce + dt * 0.003) % (Math.PI * 2)

      // ── Chef wandering within kitchen zone ──────────────────────────────
      s.chefWanderTimer -= dt
      if (s.chefWanderTimer <= 0) {
        // Kitchen zone: x 20..W-20, y 58..RAIL_Y-50
        s.chefTargetX = 20 + Math.random() * (W - 40)
        s.chefTargetY = 58 + Math.random() * (RAIL_Y - 50 - 58)
        s.chefWanderTimer = 1800 + Math.random() * 1400
      }
      const chefLerp = 1 - Math.pow(0.018, dt / 16)
      s.chefX += (s.chefTargetX - s.chefX) * chefLerp
      s.chefY += (s.chefTargetY - s.chefY) * chefLerp

      // ── Screen shake translate ──────────────────────────────────────────
      const sm = s.shakeTime > 0 ? s.shakeMag * (s.shakeTime / 230) : 0
      const ox = sm > 0 ? (Math.random() - 0.5) * sm * 2 : 0
      const oy = sm > 0 ? (Math.random() - 0.5) * sm * 2 : 0
      ctx.save(); ctx.translate(ox, oy)

      // ── Move dishes ────────────────────────────────────────────────────
      for (const d of s.dishes) { d.x += cfg.speed * (dt / 16); if (d.spawnAnim > 0) d.spawnAnim -= dt }

      // ── Detect wasted dishes (exits right edge, matched a table order) ─
      const wasted = s.dishes.filter(d => d.x >= W + DISH_R + 10)
      for (const d of wasted) {
        if (s.tables.some(t => t.order === d.emoji)) {
          s.progressPenalty = Math.min(s.progressPenalty + 0.8, s.servesThisService)
          s.score = Math.max(0, s.score - 75)
          spawnFloater(W - 50, RAIL_Y - 22, '−75 ¡Se fue!', '#fb923c')
          s.flashRed     = 55
          s.penaltyFlash = 600
          setScore(s.score)
        }
      }
      s.dishes = s.dishes.filter(d => d.x < W + DISH_R + 10)

      // ── Spawn dishes from queue — position-based, spacing per day ─────
      const leftmost = s.dishes.reduce((m, d) => Math.min(m, d.x), W + 9999)
      if (leftmost > cfg.beltSpacing - DISH_R * 2) {
        // Pull from front of queue, refill back
        if (s.dishQueue.length === 0) s.dishQueue.push(DISHES[Math.floor(Math.random() * DISHES.length)])
        const nextEmoji = s.dishQueue.shift()!
        s.dishQueue.push(DISHES[Math.floor(Math.random() * DISHES.length)])
        while (s.dishQueue.length < PREVIEW_QUEUE_SIZE)
          s.dishQueue.push(DISHES[Math.floor(Math.random() * DISHES.length)])
        s.dishes.push({ id: s.idCounter++, x: -DISH_R, emoji: nextEmoji, spawnAnim: 270 })
        if (s.chefState === 'idle') { s.chefState = 'spawn'; s.chefTimer = Math.max(s.chefTimer, 340) }
      }

      // ── Patience decay ─────────────────────────────────────────────────
      for (const t of s.tables) {
        t.patience -= (dt / 1000) * cfg.patienceDrain
        if (t.hitFlash  > 0) t.hitFlash  -= dt
        if (t.missFlash > 0) t.missFlash -= dt
        t.warnPulse = t.patience < 0.3 ? (t.warnPulse + dt * 0.009) % (Math.PI * 2) : 0

        if (t.patience <= 0) {
          t.patience = 1; t.missFlash = 500; t.order = randomDish()
          s.combo = 0; s.lives = Math.max(0, s.lives - 1)
          s.shakeTime = 400; s.shakeMag = 7; s.flashRed = 170
          s.chefState = 'angry'; s.chefTimer = 720
          spawnFloater(t.x, TABLE_Y - 50, '−1 vida 💔', '#ef4444')
          if (s.lives <= 0) { ctx.restore(); setGsPhase('game-over'); return }
        }
      }

      // ── Floater physics ────────────────────────────────────────────────
      for (const f of s.floaters) { f.y += f.vy * (dt / 16); f.alpha -= (dt / 1000) * 1.9 }
      s.floaters = s.floaters.filter(f => f.alpha > 0)

      // ── Coin jump physics ──────────────────────────────────────────────
      for (const c of s.coins) {
        c.vy += 0.40 * (dt / 16)       // gravity
        c.y  += c.vy * (dt / 16)
        c.rotation += 0.13 * (dt / 16)
        c.alpha -= (dt / 1000) * 2.3
      }
      s.coins = s.coins.filter(c => c.alpha > 0)

      // ════════════════ DRAW ════════════════

      // Kitchen ambience
      ctx.fillStyle = 'rgba(38,20,4,0.10)'
      ctx.fillRect(0, 48, W, RAIL_Y - 42)

      // ── NEXT preview panel (Tetris-style, top-right of kitchen) ───────
      {
        const PW = 58, PH = 80
        const PX = W - PW - 8, PY = 54
        const PR = 14  // mini plate radius

        // Panel background
        ctx.fillStyle = 'rgba(12,7,2,0.82)'
        ctx.beginPath(); ctx.roundRect(PX, PY, PW, PH, 5); ctx.fill()
        ctx.strokeStyle = 'rgba(201,149,42,0.32)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.roundRect(PX, PY, PW, PH, 5); ctx.stroke()

        // "NEXT" label
        ctx.fillStyle = 'rgba(201,149,42,0.60)'
        ctx.font = 'bold 8px var(--font-inter,Inter,sans-serif)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('NEXT', PX + PW / 2, PY + 8)

        // Divider
        ctx.strokeStyle = 'rgba(201,149,42,0.15)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(PX + 6, PY + 15); ctx.lineTo(PX + PW - 6, PY + 15); ctx.stroke()

        // Draw next 2 dishes from queue
        const preview = s.dishQueue.slice(0, 2)
        preview.forEach((emoji, i) => {
          const py = PY + 26 + i * 36
          const alpha = i === 0 ? 1 : 0.55

          ctx.save()
          ctx.globalAlpha = alpha

          // Mini plate
          ctx.beginPath(); ctx.arc(PX + PW / 2, py, PR + 3, 0, Math.PI * 2)
          ctx.fillStyle = '#f4efe6'; ctx.fill()
          ctx.strokeStyle = i === 0 ? 'rgba(201,149,42,0.75)' : 'rgba(175,148,112,0.30)'
          ctx.lineWidth = i === 0 ? 2 : 1; ctx.stroke()

          // Emoji
          ctx.font = `${PR * 1.65}px serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(emoji, PX + PW / 2, py + 1)
          ctx.restore()
        })
      }

      // ── Chef character ─────────────────────────────────────────────────
      {
        const cx = s.chefX, cy = s.chefY
        const bounce = s.chefState === 'idle' ? Math.sin(s.chefBounce) * 3 : 0
        const scale  = s.chefState === 'spawn' ? 1 + (s.chefTimer / 340) * 0.28
                     : s.chefState === 'combo' ? 1 + (s.chefTimer / 650) * 0.42
                     : s.chefState === 'angry' ? 1 + Math.sin(s.chefBounce * 8) * 0.08
                     : 1
        const chefEmoji = s.chefState === 'angry' ? '😤' : s.chefState === 'combo' ? '🤩' : '👨‍🍳'

        ctx.save()
        ctx.translate(cx, cy + bounce)
        ctx.scale(scale, scale)
        // Backdrop circle so emoji is readable on dark canvas
        ctx.beginPath(); ctx.arc(0, 2, 20, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(30,16,4,0.72)'; ctx.fill()
        if (s.chefState === 'combo') { ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 22 }
        if (s.chefState === 'angry') { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 14 }
        ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(chefEmoji, 0, 2)
        ctx.shadowBlur = 0
        ctx.restore()

        // Steam wisps — visible opacity
        const sw = 0.32 + 0.22 * Math.sin(s.chefBounce * 2.1)
        ctx.fillStyle = `rgba(220,210,200,${sw})`
        ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('☁', cx + 18, cy - 16 + bounce * 0.5)
        ctx.fillStyle = `rgba(220,210,200,${sw * 0.7})`
        ctx.font = '10px serif'
        ctx.fillText('☁', cx + 28, cy - 28 + Math.sin(s.chefBounce + 1.1) * 2)
      }

      // ── Belt shadow ────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, RAIL_Y - 37, W, 74)

      // Belt rubber body
      ctx.fillStyle = '#15100a'
      ctx.fillRect(0, RAIL_Y - 33, W, 66)

      // Animated diagonal stripes
      ctx.save()
      ctx.beginPath(); ctx.rect(0, RAIL_Y - 33, W, 66); ctx.clip()
      ctx.strokeStyle = 'rgba(255,255,255,0.038)'; ctx.lineWidth = 9
      for (let bx = -30 + s.beltOffset; bx < W + 30; bx += 20) {
        ctx.beginPath(); ctx.moveTo(bx - 30, RAIL_Y - 33); ctx.lineTo(bx + 30, RAIL_Y + 33); ctx.stroke()
      }
      ctx.restore()

      // Metallic belt edges
      const mkEdge = (y0: number, y1: number) => {
        const g = ctx.createLinearGradient(0, y0, 0, y1)
        g.addColorStop(0, 'rgba(201,149,42,0.72)'); g.addColorStop(1, 'rgba(201,149,42,0.07)')
        return g
      }
      ctx.fillStyle = mkEdge(RAIL_Y - 39, RAIL_Y - 31); ctx.fillRect(0, RAIL_Y - 39, W, 8)
      ctx.fillStyle = mkEdge(RAIL_Y + 39, RAIL_Y + 31); ctx.fillRect(0, RAIL_Y + 31, W, 8)

      // Rivets
      ctx.fillStyle = 'rgba(201,149,42,0.40)'
      for (let rx = 18; rx < W; rx += 36) {
        ctx.beginPath(); ctx.arc(rx, RAIL_Y - 30, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(rx, RAIL_Y + 30, 3, 0, Math.PI * 2); ctx.fill()
      }

      // Kitchen label (offset right of chef)
      ctx.fillStyle = 'rgba(201,149,42,0.18)'; ctx.font = '9px sans-serif'
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText('◀ COCINA', 60, RAIL_Y - 20)

      // ── Dishes on belt ─────────────────────────────────────────────────
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const d of s.dishes) {
        const isAligned = s.tables.some(t => t.order === d.emoji && Math.abs(d.x - t.x) < ALIGN_THR)
        const pop = d.spawnAnim > 0 ? 1 + (d.spawnAnim / 270) * 0.30 : 1

        ctx.save()
        ctx.translate(d.x, RAIL_Y); ctx.scale(pop, pop)
        // Drop shadow
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4
        // Porcelain plate
        ctx.beginPath(); ctx.arc(0, 0, DISH_R + 4, 0, Math.PI * 2)
        ctx.fillStyle = isAligned ? '#fffef7' : '#f4efe6'; ctx.fill()
        ctx.strokeStyle = isAligned ? 'rgba(201,149,42,0.95)' : 'rgba(175,148,112,0.40)'
        ctx.lineWidth = isAligned ? 2.5 : 1.5; ctx.stroke()
        // Inner rim
        ctx.beginPath(); ctx.arc(0, 0, DISH_R - 2, 0, Math.PI * 2)
        ctx.strokeStyle = isAligned ? 'rgba(201,149,42,0.28)' : 'rgba(175,148,112,0.12)'
        ctx.lineWidth = 0.8; ctx.stroke()
        // Reset shadow
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
        // Glow if aligned
        if (isAligned) { ctx.shadowColor = '#c9952a'; ctx.shadowBlur = 22 }
        // Food emoji
        ctx.font = `${DISH_R * 1.7}px serif`; ctx.fillText(d.emoji, 0, 1)
        ctx.restore()
      }

      // ── Dashed connector lines ─────────────────────────────────────────
      ctx.setLineDash([3, 5]); ctx.lineWidth = 1
      for (const t of s.tables) {
        const isHit  = t.hitFlash  > 0
        const isMiss = t.missFlash > 0
        const isWarn = t.patience < 0.3
        ctx.strokeStyle = isHit  ? 'rgba(74,222,128,0.45)'
                        : isMiss ? 'rgba(239,68,68,0.45)'
                        : isWarn ? `rgba(251,146,60,${0.18 + 0.18 * Math.sin(t.warnPulse)})`
                        : 'rgba(201,149,42,0.11)'
        ctx.beginPath(); ctx.moveTo(t.x, RAIL_Y + 40); ctx.lineTo(t.x, TABLE_Y - 46); ctx.stroke()
      }
      ctx.setLineDash([])

      // ── Tables (compact layout) ────────────────────────────────────────
      const TW = 68, TH = 30

      for (const t of s.tables) {
        const isHit  = t.hitFlash  > 0
        const isMiss = t.missFlash > 0
        const isWarn = t.patience < 0.3
        const wp     = isWarn ? Math.sin(t.warnPulse) : 0

        // Legs
        ctx.fillStyle = '#1a1008'
        ctx.fillRect(t.x - TW / 2 + 5,   TABLE_Y + TH / 2,     7, 18)
        ctx.fillRect(t.x + TW / 2 - 12,  TABLE_Y + TH / 2,     7, 18)

        // Table surface
        const tg = ctx.createLinearGradient(t.x, TABLE_Y - TH / 2, t.x, TABLE_Y + TH / 2)
        if (isHit) {
          tg.addColorStop(0, 'rgba(74,222,128,0.42)'); tg.addColorStop(1, 'rgba(34,197,94,0.18)')
        } else if (isMiss) {
          tg.addColorStop(0, 'rgba(239,68,68,0.42)');  tg.addColorStop(1, 'rgba(185,28,28,0.18)')
        } else if (isWarn) {
          tg.addColorStop(0, `rgba(235,95,35,${0.28 + 0.22 * wp})`)
          tg.addColorStop(1, `rgba(155,45,8,${0.14  + 0.10 * wp})`)
        } else {
          tg.addColorStop(0, '#2c1c0c'); tg.addColorStop(1, '#1c1008')
        }
        ctx.fillStyle   = tg
        ctx.strokeStyle = isHit  ? 'rgba(74,222,128,0.90)'
                        : isMiss ? 'rgba(239,68,68,0.90)'
                        : isWarn ? `rgba(251,146,60,${0.52 + 0.42 * wp})`
                        : 'rgba(201,149,42,0.45)'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.roundRect(t.x - TW / 2, TABLE_Y - TH / 2, TW, TH, 4)
        ctx.fill(); ctx.stroke()

        // Order emoji on table — clearly readable ghost, flashes solid on correct serve
        const ghostAlpha = isHit ? Math.max(0.72, t.hitFlash / 520) : 0.72
        ctx.save()
        ctx.globalAlpha = ghostAlpha
        if (isHit) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 12 }
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(t.order, t.x, TABLE_Y - 1)
        ctx.shadowBlur = 0
        ctx.restore()

        // Customer — right above table (compact)
        ctx.font = '17px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(
          isHit ? '😄' : (isMiss || isWarn) ? '😤' : '🧑',
          t.x, TABLE_Y - TH / 2 - 16
        )

        // Hit/miss marker
        if (isHit) {
          ctx.fillStyle = '#4ade80'; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 8
          ctx.font = 'bold 12px sans-serif'; ctx.fillText('✓', t.x + TW / 2 + 5, TABLE_Y - TH / 2 - 16)
          ctx.shadowBlur = 0
        } else if (isMiss) {
          ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8
          ctx.font = 'bold 12px sans-serif'; ctx.fillText('✗', t.x + TW / 2 + 5, TABLE_Y - TH / 2 - 16)
          ctx.shadowBlur = 0
        }

        // Patience bar
        const bw = TW, bh = 5
        const pbx = t.x - bw / 2, pby = TABLE_Y + TH / 2 + 5
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        ctx.beginPath(); ctx.roundRect(pbx, pby, bw, bh, 2); ctx.fill()
        const pColor = t.patience > 0.5 ? '#4ade80' : t.patience > 0.25 ? '#fb923c' : '#ef4444'
        ctx.fillStyle = pColor
        if (isWarn) { ctx.shadowColor = pColor; ctx.shadowBlur = 7 }
        ctx.beginPath(); ctx.roundRect(pbx, pby, bw * Math.max(0, t.patience), bh, 2); ctx.fill()
        ctx.shadowBlur = 0

        // TAP hint
        ctx.fillStyle = 'rgba(201,149,42,0.26)'; ctx.font = '8px sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('TAP', t.x, TABLE_Y + TH / 2 + 17)
      }

      // ── Coin jumps 🪙 ──────────────────────────────────────────────────
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const c of s.coins) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, c.alpha)
        ctx.translate(c.x, c.y); ctx.rotate(c.rotation)
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14
        ctx.font = '18px serif'; ctx.fillText('🪙', 0, 0)
        ctx.restore()
      }

      // ── Floating text ──────────────────────────────────────────────────
      for (const f of s.floaters) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, f.alpha)
        ctx.fillStyle = f.color; ctx.shadowColor = f.color; ctx.shadowBlur = 10
        ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(f.text, f.x, f.y)
        ctx.restore()
      }

      // ── Screen flash overlays ──────────────────────────────────────────
      if (s.flashGreen > 0) {
        ctx.fillStyle = `rgba(74,222,128,${(s.flashGreen / 140) * 0.10})`
        ctx.fillRect(-10, -10, W + 20, H + 20)
      }
      if (s.flashRed > 0) {
        ctx.fillStyle = `rgba(239,68,68,${(s.flashRed / 170) * 0.22})`
        ctx.fillRect(-10, -10, W + 20, H + 20)
      }

      ctx.restore() // end screen shake

      // ── HUD ────────────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(7,4,2,0.96)'; ctx.fillRect(0, 0, W, 48)
      ctx.strokeStyle = 'rgba(201,149,42,0.20)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(W, 48); ctx.stroke()

      // Score
      ctx.fillStyle = '#c9952a'; ctx.font = '600 14px var(--font-inter,Inter,sans-serif)'
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(`${s.score.toLocaleString('es-CL')} pts`, 12, 17)

      // Day + service
      ctx.fillStyle = '#636363'; ctx.font = '11px var(--font-inter,Inter,sans-serif)'
      ctx.textAlign = 'center'
      ctx.fillText(`Día ${s.day + 1} · ${SERVICE_NAMES[s.service]}`, W / 2, 17)

      // Combo counter
      if (s.combo > 1) {
        const cs = s.comboFlash > 0 ? 1 + (s.comboFlash / 460) * 0.34 : 1
        ctx.save()
        ctx.translate(W - 14, 17); ctx.scale(cs, cs)
        const cc = s.combo >= 5 ? '#fbbf24' : s.combo >= 3 ? '#fb923c' : '#c9952a'
        if (s.combo >= 3) { ctx.shadowColor = cc; ctx.shadowBlur = 14 }
        ctx.fillStyle = cc; ctx.font = `bold ${Math.min(17, 11 + s.combo)}px sans-serif`
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
        ctx.fillText(`×${s.combo}${s.combo >= 5 ? '🔥' : ''}`, 0, 0)
        ctx.restore()
      }

      // Lives
      ctx.shadowBlur = 0
      for (let i = 0; i < MAX_LIVES; i++) {
        ctx.globalAlpha = i < s.lives ? 1 : 0.11
        if (i < s.lives && s.lives === 1) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = s.flashRed > 0 ? 14 : 5 }
        ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('❤️', 14 + i * 17, 35)
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0

      // ── Service timeline — bottom panel ────────────────────────────────
      const TL_H   = 28                        // timeline panel height
      const TL_Y   = H - TL_H                  // top of panel
      const BAR_Y  = TL_Y + 9                  // bar top inside panel
      const BAR_H  = 10
      const BAR_X  = 64, BAR_W = W - 76

      const effectiveProg = Math.min(1, Math.max(0, (s.servesThisService - s.progressPenalty) / cfg.dishesPerService))
      const isPenalty = s.penaltyFlash > 0

      // Panel background
      ctx.fillStyle = 'rgba(7,4,2,0.92)'
      ctx.fillRect(0, TL_Y, W, TL_H)
      ctx.strokeStyle = 'rgba(201,149,42,0.18)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, TL_Y); ctx.lineTo(W, TL_Y); ctx.stroke()

      // Label left
      ctx.fillStyle = isPenalty ? '#fb923c' : 'rgba(201,149,42,0.55)'
      ctx.font = `${isPenalty ? 'bold ' : ''}9px var(--font-inter,Inter,sans-serif)`
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(SERVICE_NAMES[s.service], 8, TL_Y + TL_H / 2)

      // Serves counter right
      const netServes = Math.max(0, Math.round(s.servesThisService - s.progressPenalty))
      ctx.fillStyle = isPenalty ? '#fb923c' : 'rgba(201,149,42,0.55)'
      ctx.font = `bold 9px var(--font-inter,Inter,sans-serif)`
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.fillText(`${netServes}/${cfg.dishesPerService}`, W - 6, TL_Y + TL_H / 2)

      // Bar track
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.beginPath(); ctx.roundRect(BAR_X, BAR_Y, BAR_W, BAR_H, 4); ctx.fill()

      // Milestone tick marks
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      for (let i = 1; i < cfg.dishesPerService; i++) {
        const tx = BAR_X + (i / cfg.dishesPerService) * BAR_W
        ctx.fillRect(tx - 0.5, BAR_Y, 1, BAR_H)
      }

      // Filled bar
      const barColor = isPenalty ? '#ef4444'
                     : effectiveProg > 0.75 ? '#4ade80'
                     : '#c9952a'
      if (isPenalty) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10 }
      ctx.fillStyle = barColor
      ctx.beginPath(); ctx.roundRect(BAR_X, BAR_Y, Math.max(0, BAR_W * effectiveProg), BAR_H, 4); ctx.fill()
      ctx.shadowBlur = 0

      // Penalty retraction pulse — red overlay on bar track
      if (isPenalty) {
        ctx.fillStyle = `rgba(239,68,68,${(s.penaltyFlash / 600) * 0.38})`
        ctx.beginPath(); ctx.roundRect(BAR_X, BAR_Y, BAR_W, BAR_H, 4); ctx.fill()
      }

      // Leading dot on bar
      if (effectiveProg > 0.01 && effectiveProg < 1) {
        ctx.fillStyle = isPenalty ? '#ef4444' : '#fde68a'
        if (isPenalty) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8 }
        ctx.beginPath(); ctx.arc(BAR_X + BAR_W * effectiveProg, BAR_Y + BAR_H / 2, 5, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    s.animId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(s.animId)
      canvas.removeEventListener('click', onCanvasClick)
      canvas.removeEventListener('touchend', onCanvasTouch)
    }
  }, [handleTap, setGsPhase, spawnFloater, spawnCoin])

  // ── Overlays ───────────────────────────────────────────────────────────────
  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm mx-auto block touch-none border border-warm-800"
        style={{ aspectRatio: `${W}/${H}` }}
      />

      <AnimatePresence>

        {/* IDLE */}
        {phase === 'idle' && (
          <motion.div key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/93 px-6">
            <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-2">Minijuego semanal</p>
            <h2 className="font-display text-4xl italic text-ivory mb-2">El Festín</h2>
            <p className="text-warm-400 text-xs text-center max-w-[230px] mb-5 leading-relaxed">
              Los platos salen de cocina por el riel. Cada mesa muestra lo que pide. Sirve a tiempo.
            </p>
            <div className="bg-warm-900/60 border border-warm-800 rounded p-3 mb-5 text-[11px] text-warm-500 space-y-1.5 w-full max-w-[220px]">
              <div>👁 Mira el plato fantasma en la mesa</div>
              <div>🚂 Espera que ese plato pase por el riel</div>
              <div>👆 Toca la mesa en el momento exacto</div>
              <div>⚠️ Si el plato pasa de largo, pierdes progreso</div>
            </div>
            <p className="text-warm-600 text-[10px] mb-5">
              {tokensLeft > 0
                ? `${tokensLeft} intento${tokensLeft !== 1 ? 's' : ''} rankeado${tokensLeft !== 1 ? 's' : ''}`
                : 'Modo práctica — sin intentos rankeados'}
            </p>
            <button onClick={startGame}
              className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors">
              Jugar
            </button>
          </motion.div>
        )}

        {/* SERVICE BREAK */}
        {phase === 'service-break' && (
          <motion.div key="break"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/93 px-6">
            <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-1">Servicio completado</p>
            <h3 className="font-display text-3xl italic text-ivory mb-1">{SERVICE_NAMES[service]}</h3>
            <p className="text-warm-600 text-[10px] mb-5">Día {day + 1}</p>
            <div className="space-y-2 text-center mb-7">
              <p className="text-gold-400 text-2xl font-medium">+{breakStats.score.toLocaleString('es-CL')} pts</p>
              <p className="text-warm-400 text-sm">{breakStats.serves} platos servidos</p>
              {breakStats.combo > 1 && (
                <p className="text-gold-600 text-sm">Combo máximo ×{breakStats.combo}</p>
              )}
            </div>
            <button onClick={nextService}
              className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors">
              {service < 2 ? `${SERVICE_NAMES[service + 1]} →` : 'Fin del día →'}
            </button>
          </motion.div>
        )}

        {/* DAY END */}
        {phase === 'day-end' && (
          <motion.div key="day-end"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/93 px-6">
            <Trophy size={36} className="text-gold-500 mb-3" />
            <p className="text-gold-600 text-[10px] tracking-widest uppercase mb-1">Día {day + 1} completado</p>
            <h3 className="font-display text-3xl italic text-ivory mb-4">¡Buen trabajo!</h3>
            <p className="text-gold-400 text-2xl font-medium mb-1">{score.toLocaleString('es-CL')} pts</p>
            <p className="text-warm-500 text-xs mb-5">Score acumulado</p>
            <p className="text-warm-400 text-xs text-center max-w-[210px] mb-7 leading-relaxed">
              Mañana más mesas, riel más rápido y los clientes tienen menos paciencia.
            </p>
            <button onClick={nextDay}
              className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors">
              Día {day + 2} →
            </button>
          </motion.div>
        )}

        {/* GAME OVER */}
        {phase === 'game-over' && (
          <motion.div key="gameover"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-warm-950/93 px-6">
            <p className="text-4xl mb-3">{gs.current.lives <= 0 ? '😵' : '🏆'}</p>
            <h3 className="font-display text-3xl italic text-ivory mb-1">
              {gs.current.lives <= 0 ? 'Se acabó el servicio' : '¡Restaurante completo!'}
            </h3>
            <p className="text-gold-400 text-2xl font-medium mb-1">{score.toLocaleString('es-CL')} pts</p>
            <p className="text-warm-500 text-xs mb-1">Combo máximo ×{gs.current.maxCombo}</p>
            <p className="text-warm-600 text-xs mb-6">{gs.current.totalServes} platos servidos en total</p>
            <RankingButtons
              score={score}
              tokensLeft={tokensLeft}
              onRank={(s) => onGameEnd(s, true)}
              onRetry={startGame}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

// ─── Ranking buttons ──────────────────────────────────────────────────────────
function RankingButtons({
  score, tokensLeft, onRank, onRetry,
}: {
  score: number; tokensLeft: number; onRank: (score: number) => void; onRetry: () => void
}) {
  if (tokensLeft > 0) {
    return (
      <>
        <p className="text-warm-400 text-xs text-center mb-5 leading-relaxed max-w-[230px]">
          ¿Subir este score al ranking semanal?{' '}
          <span className="text-warm-600">Te quedan {tokensLeft} intento{tokensLeft !== 1 ? 's' : ''}.</span>
        </p>
        <div className="flex gap-3">
          <button onClick={() => onRank(score)}
            className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-5 py-3 text-xs tracking-widest uppercase font-medium transition-colors">
            Subir al ranking
          </button>
          <button onClick={onRetry}
            className="border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200 px-5 py-3 text-xs tracking-widest uppercase font-medium transition-colors flex items-center gap-2">
            <RotateCcw size={12} /> Reintentar
          </button>
        </div>
      </>
    )
  }
  return (
    <>
      <p className="text-warm-500 text-xs text-center mb-5 max-w-[210px]">Ya usaste tus 3 intentos esta semana.</p>
      <button onClick={onRetry}
        className="border border-warm-700 text-warm-400 px-6 py-3 text-xs tracking-widest uppercase flex items-center gap-2">
        <RotateCcw size={12} /> Jugar de nuevo
      </button>
    </>
  )
}
