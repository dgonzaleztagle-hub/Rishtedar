'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Expand, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import {
  type ChefMood,
  type CustomerMood,
  type DifficultyTier,
  type DishId,
  type GameDifficultyState,
  type IngredientId,
  type RecipeDefinition,
  INGREDIENT_BY_ID,
  INGREDIENTS,
  RECIPE_BY_ID,
  RECIPES,
  getRecipePreview,
  isExactRecipeMatch,
} from '@/lib/game/rishtedarGameData'

const W = 960
const H = 540
const HUD_H = 68
const STAGE_Y = 88
const LIVES_MAX = 3
const TABLE_W = 188
const TABLE_H = 148
const TABLE_SLOTS = [
  { x: 146, y: 198 },
  { x: 352, y: 198 },
  { x: 146, y: 370 },
  { x: 352, y: 370 },
] as const
const INGREDIENT_TRAY = { x: 650, y: 118, w: 286, h: 336, radius: 26 } as const
const INGREDIENT_SLOTS = [
  { x: 706, y: 170 },
  { x: 798, y: 170 },
  { x: 890, y: 170 },
  { x: 706, y: 278 },
  { x: 798, y: 278 },
  { x: 890, y: 278 },
  { x: 706, y: 386 },
  { x: 798, y: 386 },
  { x: 890, y: 386 },
] as const
const CLEAR_BUTTON = { x: 532, y: 428, w: 122, h: 30 }
const SERVE_HINT = { x: 532, y: 474, w: 286, h: 34 }

type Phase = 'idle' | 'playing' | 'game-over'
type FloaterTone = 'good' | 'bad' | 'warn'

interface Props {
  onGameEnd: (score: number, counted: boolean) => void
  tokensLeft: number
}

interface CustomerState {
  slot: number
  recipeId: DishId
  recipe: RecipeDefinition
  patience: number
  enteredAt: number
  pulse: number
  mood: CustomerMood
}

interface Floater {
  id: number
  x: number
  y: number
  text: string
  alpha: number
  vy: number
  tone: FloaterTone
}

interface Spark {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  size: number
}

interface EndStats {
  score: number
  maxCombo: number
  dishesServed: number
  tier: DifficultyTier
}

interface DrawButton {
  key: string
  x: number
  y: number
  radius: number
  ingredientId?: IngredientId
  type: 'ingredient' | 'table' | 'clear'
}

interface RunState {
  phase: Phase
  tutorialStep: 0 | 1 | 2
  score: number
  combo: number
  maxCombo: number
  lives: number
  dishesServed: number
  elapsedMs: number
  spawnTimerMs: number
  customers: Array<CustomerState | null>
  plate: IngredientId[]
  plateMatch: DishId | null
  platePulse: number
  flashGood: number
  flashBad: number
  flashWarn: number
  chefMood: ChefMood
  chefMoodTimer: number
  floaters: Floater[]
  sparks: Spark[]
  floaterId: number
  sparkId: number
  animId: number
  lastTick: number
  buttonMap: DrawButton[]
}

const CUSTOMER_PORTRAIT_PATHS = [
  '/game-assets/customers/customer-1.png',
  '/game-assets/customers/customer-2.png',
  '/game-assets/customers/customer-3.png',
  '/game-assets/customers/customer-4.png',
] as const

function initialRunState(): RunState {
  return {
    phase: 'idle',
    tutorialStep: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: LIVES_MAX,
    dishesServed: 0,
    elapsedMs: 0,
    spawnTimerMs: 1200,
    customers: [null, null, null, null],
    plate: [],
    plateMatch: null,
    platePulse: 0,
    flashGood: 0,
    flashBad: 0,
    flashWarn: 0,
    chefMood: 'happy',
    chefMoodTimer: 0,
    floaters: [],
    sparks: [],
    floaterId: 0,
    sparkId: 0,
    animId: 0,
    lastTick: 0,
    buttonMap: [],
  }
}

function getDifficultyState(elapsedMs: number): GameDifficultyState {
  if (elapsedMs < 40000) {
    return { tier: 1, spawnIntervalMs: 4200, patienceMultiplier: 1, recipeComplexityWeight: 0.12 }
  }
  if (elapsedMs < 85000) {
    return { tier: 2, spawnIntervalMs: 3400, patienceMultiplier: 0.88, recipeComplexityWeight: 0.45 }
  }
  if (elapsedMs < 130000) {
    return { tier: 3, spawnIntervalMs: 2800, patienceMultiplier: 0.74, recipeComplexityWeight: 0.72 }
  }
  return { tier: 4, spawnIntervalMs: 2350, patienceMultiplier: 0.62, recipeComplexityWeight: 0.84 }
}

function getMaxCustomers(tier: DifficultyTier): number {
  if (tier === 1) return 2
  if (tier === 2) return 3
  return 4
}

function getRecipeWeight(recipe: RecipeDefinition, complexityWeight: number): number {
  const isComplex = recipe.ingredients.length >= 3
  return isComplex ? 1 + complexityWeight * 1.5 : 1.2 - complexityWeight * 0.45
}

function chooseRecipe(complexityWeight: number): RecipeDefinition {
  const total = RECIPES.reduce((sum, recipe) => sum + getRecipeWeight(recipe, complexityWeight), 0)
  let cursor = Math.random() * total

  for (const recipe of RECIPES) {
    cursor -= getRecipeWeight(recipe, complexityWeight)
    if (cursor <= 0) return recipe
  }

  return RECIPES[0]
}

function getMatchingCustomers(customers: Array<CustomerState | null>, plate: IngredientId[]): CustomerState[] {
  const recipeMatch = isExactRecipeMatch(plate)
  if (!recipeMatch) return []
  return customers.filter((customer): customer is CustomerState => Boolean(customer && customer.recipeId === recipeMatch))
}

function getCompatibleRecipeIds(customers: Array<CustomerState | null>, plate: IngredientId[]): DishId[] {
  const activeRecipes = customers
    .filter((customer): customer is CustomerState => Boolean(customer))
    .map((customer) => customer.recipe)

  return activeRecipes
    .filter((recipe) => {
      if (plate.length > recipe.ingredients.length) return false
      return plate.every((ingredientId) => recipe.ingredients.includes(ingredientId))
    })
    .map((recipe) => recipe.id)
}

function blendAlpha(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

function drawTutorialTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  body: string
) {
  const bw = 320
  const bh = 66
  const bx = x - bw / 2
  const by = y - bh / 2

  ctx.save()
  ctx.shadowBlur = 24
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.fillStyle = 'rgba(18,10,7,0.97)'
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 14)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(201,149,42,0.75)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 14)
  ctx.stroke()
  ctx.fillStyle = '#f1b865'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, x, y - 7)
  ctx.fillStyle = 'rgba(245,223,194,0.88)'
  ctx.font = '11px sans-serif'
  ctx.fillText(body, x, y + 13)
  ctx.restore()
}

function drawTutorialOverlay(
  ctx: CanvasRenderingContext2D,
  state: RunState
) {
  if (state.tutorialStep === 0) return

  const pulse = Math.sin(Date.now() * 0.004) * 0.25 + 0.75

  if (state.tutorialStep === 1) {
    // Glow border around ingredient tray
    ctx.save()
    ctx.shadowBlur = 22
    ctx.shadowColor = `rgba(241,184,101,${pulse * 0.8})`
    ctx.strokeStyle = `rgba(241,184,101,${pulse})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(
      INGREDIENT_TRAY.x - 6,
      INGREDIENT_TRAY.y - 6,
      INGREDIENT_TRAY.w + 12,
      INGREDIENT_TRAY.h + 12,
      INGREDIENT_TRAY.radius + 6
    )
    ctx.stroke()
    ctx.restore()

    // Dashed border around tutorial customer card
    const s0 = TABLE_SLOTS[0]
    ctx.save()
    ctx.shadowBlur = 12
    ctx.shadowColor = `rgba(241,184,101,${pulse * 0.5})`
    ctx.strokeStyle = `rgba(241,184,101,${pulse * 0.7})`
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.roundRect(s0.x - TABLE_W / 2 - 5, s0.y - TABLE_H / 2 - 5, TABLE_W + 10, TABLE_H + 10, 26)
    ctx.stroke()
    ctx.restore()

    drawTutorialTooltip(
      ctx, W / 2, 68,
      'Prepara el plato',
      'Mira el pedido del cliente y selecciona sus ingredientes →'
    )
  }

  if (state.tutorialStep === 2) {
    // Glow border around tutorial customer's table
    const s0 = TABLE_SLOTS[0]
    ctx.save()
    ctx.shadowBlur = 22
    ctx.shadowColor = `rgba(98,217,160,${pulse * 0.8})`
    ctx.strokeStyle = `rgba(98,217,160,${pulse})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(s0.x - TABLE_W / 2 - 6, s0.y - TABLE_H / 2 - 6, TABLE_W + 12, TABLE_H + 12, 28)
    ctx.stroke()
    ctx.restore()

    drawTutorialTooltip(
      ctx, W / 2, 68,
      '¡Plato listo! ↙',
      'Toca la mesa del cliente para servir el plato'
    )
  }
}

export function RishtedarGame({ onGameEnd, tokensLeft }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stageFrameRef = useRef<HTMLDivElement>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const stageBackgroundRef = useRef<HTMLImageElement | null>(null)
  const logoSpriteRef = useRef<HTMLImageElement | null>(null)
  const chefSpritesRef = useRef<Partial<Record<ChefMood, HTMLImageElement>>>({})
  const ingredientSpritesRef = useRef<Partial<Record<IngredientId, HTMLImageElement>>>({})
  const recipeSpritesRef = useRef<Partial<Record<DishId, HTMLImageElement>>>({})
  const customerPortraitsRef = useRef<HTMLImageElement[]>([])
  const stateRef = useRef<RunState>(initialRunState())

  const [phase, setPhase] = useState<Phase>('idle')
  const [endStats, setEndStats] = useState<EndStats>({
    score: 0,
    maxCombo: 0,
    dishesServed: 0,
    tier: 1,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: W, height: H })
  const [stageSize, setStageSize] = useState({ width: W, height: H })

  const isPortraitViewport = viewportSize.height > viewportSize.width
  const isCompactViewport = viewportSize.width < 980 || viewportSize.height < 760
  const useCompactFullscreenChrome = isFullscreen && isCompactViewport

  const stagePaddingX = isFullscreen ? (useCompactFullscreenChrome ? 4 : 10) : 0
  const stagePaddingY = isFullscreen ? (useCompactFullscreenChrome ? 4 : isCompactViewport ? 10 : 14) : 0
  const availableStageWidth = Math.max(280, stageSize.width - stagePaddingX * 2)
  const availableStageHeight = Math.max(180, stageSize.height - stagePaddingY * 2)
  const widthLimitedHeight = availableStageWidth * (H / W)
  const canvasDisplayHeight = Math.min(availableStageHeight, widthLimitedHeight)
  const canvasDisplayWidth = canvasDisplayHeight * (W / H)
  const showRotateHint = isFullscreen && isPortraitViewport

  const setGamePhase = useCallback((nextPhase: Phase) => {
    stateRef.current.phase = nextPhase
    setPhase(nextPhase)

    if (nextPhase === 'game-over') {
      const difficulty = getDifficultyState(stateRef.current.elapsedMs)
      setEndStats({
        score: stateRef.current.score,
        maxCombo: stateRef.current.maxCombo,
        dishesServed: stateRef.current.dishesServed,
        tier: difficulty.tier,
      })
    }
  }, [])

  const playSound = useCallback(
    (type: 'select' | 'error' | 'serve' | 'combo' | 'warning') => {
      if (muted || typeof window === 'undefined') return

      try {
        if (!audioCtx.current) {
          audioCtx.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        }

        const ac = audioCtx.current
        if (ac.state === 'suspended') void ac.resume()

        const note = (freq: number, startOffset: number, duration: number, gain = 0.08, typeOsc: OscillatorType = 'triangle') => {
          const osc = ac.createOscillator()
          const gainNode = ac.createGain()
          osc.type = typeOsc
          osc.frequency.value = freq
          gainNode.gain.setValueAtTime(gain, ac.currentTime + startOffset)
          gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startOffset + duration)
          osc.connect(gainNode)
          gainNode.connect(ac.destination)
          osc.start(ac.currentTime + startOffset)
          osc.stop(ac.currentTime + startOffset + duration)
        }

        if (type === 'select') {
          note(680, 0, 0.08, 0.06)
          return
        }

        if (type === 'warning') {
          note(220, 0, 0.12, 0.06, 'sawtooth')
          note(180, 0.08, 0.16, 0.05, 'sawtooth')
          return
        }

        if (type === 'error') {
          note(280, 0, 0.08, 0.08, 'sawtooth')
          note(160, 0.05, 0.14, 0.07, 'sawtooth')
          return
        }

        if (type === 'serve') {
          note(740, 0, 0.08, 0.08)
          note(980, 0.05, 0.12, 0.07)
          return
        }

        note(880, 0, 0.07, 0.08)
        note(1180, 0.04, 0.1, 0.08)
        note(1380, 0.09, 0.13, 0.08)
      } catch {
        // Audio is optional on browsers that block or do not support Web Audio.
      }
    },
    [muted]
  )

  const spawnFloater = useCallback((x: number, y: number, text: string, tone: FloaterTone) => {
    const state = stateRef.current
    state.floaters.push({
      id: state.floaterId++,
      x,
      y,
      text,
      tone,
      alpha: 1,
      vy: tone === 'good' ? -1.35 : -1.1,
    })
  }, [])

  const spawnBurst = useCallback((x: number, y: number, color: string) => {
    const state = stateRef.current
    for (let i = 0; i < 10; i += 1) {
      state.sparks.push({
        id: state.sparkId++,
        x,
        y,
        vx: (Math.random() - 0.5) * 3.4,
        vy: -Math.random() * 2.3 - 0.8,
        alpha: 1,
        color,
        size: 3 + Math.random() * 3,
      })
    }
  }, [])

  const resetPlate = useCallback((withFloater?: string) => {
    const state = stateRef.current
    state.plate = []
    state.plateMatch = null
    state.platePulse = 0
    if (withFloater) spawnFloater(486, 306, withFloater, 'warn')
  }, [spawnFloater])

  const applyPenalty = useCallback(
    (penalty: number, label: string, x: number, y: number, severe = false) => {
      const state = stateRef.current
      state.score = Math.max(0, state.score - penalty)
      state.combo = 0
      state.flashBad = severe ? 220 : 135
      state.flashWarn = severe ? 160 : Math.max(state.flashWarn, 80)
      state.chefMood = severe ? 'panicked' : 'busy'
      state.chefMoodTimer = severe ? 1100 : 750
      spawnFloater(x, y, label, 'bad')
      playSound(severe ? 'warning' : 'error')
    },
    [playSound, spawnFloater]
  )

  const addIngredient = useCallback(
    (ingredientId: IngredientId, x: number, y: number) => {
      const state = stateRef.current
      if (state.phase !== 'playing') return
      if (state.plate.includes(ingredientId)) {
        spawnFloater(x, y - 18, 'Ya está en el plato', 'warn')
        return
      }
      if (state.plate.length >= 3) {
        spawnFloater(x, y - 18, 'Máximo 3 ingredientes', 'warn')
        return
      }

      const nextPlate = [...state.plate, ingredientId]
      const compatibleRecipes = getCompatibleRecipeIds(state.customers, nextPlate)
      if (compatibleRecipes.length === 0) {
        applyPenalty(20, 'Ingrediente incorrecto', x, y - 18)
        return
      }

      state.plate = nextPlate
      state.plateMatch = isExactRecipeMatch(nextPlate)
      state.platePulse = 320
      state.chefMood = state.plateMatch ? 'happy' : 'busy'
      state.chefMoodTimer = state.plateMatch ? 450 : 360
      state.flashGood = state.plateMatch ? 120 : 70
      spawnFloater(x, y - 24, `+ ${INGREDIENT_BY_ID[ingredientId].label}`, state.plateMatch ? 'good' : 'warn')
      playSound(state.plateMatch ? 'combo' : 'select')

      if (state.tutorialStep === 1 && state.plateMatch !== null) {
        state.tutorialStep = 2
      }
    },
    [applyPenalty, playSound, spawnFloater]
  )

  const serveCustomer = useCallback(
    (customer: CustomerState) => {
      const state = stateRef.current
      if (state.phase !== 'playing') return

      if (state.plate.length < 2) {
        spawnFloater(TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 72, 'Completa el plato', 'warn')
        return
      }

      const exactMatch = isExactRecipeMatch(state.plate)
      if (!exactMatch) {
        applyPenalty(40, 'Plato incorrecto', TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 70)
        return
      }

      if (exactMatch !== customer.recipeId) {
        applyPenalty(55, 'Mesa equivocada', TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 70, true)
        return
      }

      const patienceBonus = Math.round(customer.patience * 55)
      const comboBonus = state.combo * 24
      const points = customer.recipe.scoreBase + patienceBonus + comboBonus

      state.score += points
      state.combo += 1
      state.maxCombo = Math.max(state.maxCombo, state.combo)
      state.dishesServed += 1
      state.flashGood = 180
      state.chefMood = state.combo >= 4 ? 'happy' : 'busy'
      state.chefMoodTimer = state.combo >= 4 ? 700 : 420
      state.customers[customer.slot] = null
      state.spawnTimerMs = Math.min(state.spawnTimerMs, 650)

      if (state.tutorialStep === 2) {
        state.tutorialStep = 0
        if (typeof window !== 'undefined') {
          localStorage.setItem('rishtedar_tutorial_done', '1')
        }
      }

      spawnFloater(TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 76, `+${points} pts`, 'good')
      if (state.combo >= 3) {
        spawnFloater(TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 104, `Combo x${state.combo}`, 'good')
      }
      spawnBurst(TABLE_SLOTS[customer.slot].x, TABLE_SLOTS[customer.slot].y - 16, customer.recipe.visualStyle.garnish)
      playSound(state.combo >= 3 ? 'combo' : 'serve')
      resetPlate()
    },
    [applyPenalty, playSound, resetPlate, spawnBurst, spawnFloater]
  )

  const startGame = useCallback(() => {
    const next = initialRunState()
    next.phase = 'playing'
    next.lastTick = performance.now()

    const needsTutorial =
      typeof window !== 'undefined' && !localStorage.getItem('rishtedar_tutorial_done')
    if (needsTutorial) {
      next.tutorialStep = 1
      const tutorialRecipe = RECIPES[0]
      next.customers[0] = {
        slot: 0,
        recipeId: tutorialRecipe.id,
        recipe: tutorialRecipe,
        patience: 1,
        enteredAt: 0,
        pulse: 0,
        mood: 'happy',
      }
    }

    stateRef.current = next
    setEndStats({ score: 0, maxCombo: 0, dishesServed: 0, tier: 1 })
    setGamePhase('playing')

    if (!muted && backgroundMusicRef.current) {
      backgroundMusicRef.current.currentTime = 0
      void backgroundMusicRef.current.play().catch(() => {
        // Browsers may still block playback until a stronger user gesture.
      })
    }
  }, [muted, setGamePhase])

  const spawnCustomer = useCallback(() => {
    const state = stateRef.current
    const difficulty = getDifficultyState(state.elapsedMs)
    const maxCustomers = getMaxCustomers(difficulty.tier)
    const activeCount = state.customers.filter(Boolean).length
    if (activeCount >= maxCustomers) return

    const openSlot = state.customers.findIndex((customer) => customer === null)
    if (openSlot === -1) return

    const recipe = chooseRecipe(difficulty.recipeComplexityWeight)
    state.customers[openSlot] = {
      slot: openSlot,
      recipeId: recipe.id,
      recipe,
      patience: 1,
      enteredAt: state.elapsedMs,
      pulse: 0,
      mood: 'neutral',
    }

    spawnFloater(TABLE_SLOTS[openSlot].x, TABLE_SLOTS[openSlot].y - 92, recipe.name, 'warn')
  }, [spawnFloater])

  const handleCanvasTap = useCallback((tapX: number, tapY: number) => {
    const state = stateRef.current
    if (state.phase !== 'playing') return

    const buttonHit = state.buttonMap.find((button) => {
      const dx = tapX - button.x
      const dy = tapY - button.y
      return Math.sqrt(dx * dx + dy * dy) <= button.radius
    })

    if (state.tutorialStep === 1 && buttonHit?.type !== 'ingredient') return
    if (state.tutorialStep === 2 && (buttonHit?.type !== 'table' || buttonHit.key !== '0')) return

    if (buttonHit?.type === 'ingredient' && buttonHit.ingredientId) {
      addIngredient(buttonHit.ingredientId, buttonHit.x, buttonHit.y)
      return
    }

    if (buttonHit?.type === 'clear') {
      resetPlate(state.plate.length ? 'Bandeja limpia' : undefined)
      return
    }

    if (buttonHit?.type === 'table') {
      const customer = state.customers.find((entry) => entry?.slot === Number(buttonHit.key))
      if (customer) serveCustomer(customer)
      return
    }

    const hintDx = tapX - SERVE_HINT.x
    const hintDy = tapY - SERVE_HINT.y
    if (Math.abs(hintDx) <= SERVE_HINT.w / 2 && Math.abs(hintDy) <= SERVE_HINT.h / 2) {
      const matches = getMatchingCustomers(state.customers, state.plate)
      if (matches.length === 1) {
        serveCustomer(matches[0])
      } else if (matches.length > 1) {
        spawnFloater(SERVE_HINT.x, SERVE_HINT.y - 38, 'Toca la mesa correcta', 'warn')
      } else {
        spawnFloater(SERVE_HINT.x, SERVE_HINT.y - 38, 'Sin pedido compatible', 'warn')
      }
    }
  }, [addIngredient, resetPlate, serveCustomer, spawnFloater])

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return

    try {
      const orientationApi = screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<void>
        unlock?: () => void
      }

      if (document.fullscreenElement) {
        if (typeof orientationApi.unlock === 'function') {
          orientationApi.unlock()
        }
        await document.exitFullscreen()
      } else {
        await wrapperRef.current.requestFullscreen()
        if (typeof orientationApi.lock === 'function') {
          await orientationApi.lock('landscape').catch(() => {
            // iOS/Safari and some Android browsers ignore or reject orientation lock.
          })
        }
      }
    } catch {
      // Fullscreen is optional; browsers may reject it outside explicit gestures.
    }
  }, [])

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewport = () => {
      const vv = window.visualViewport
      setViewportSize({
        width: Math.round(vv?.width ?? window.innerWidth),
        height: Math.round(vv?.height ?? window.innerHeight),
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
    }
  }, [])

  useEffect(() => {
    const stage = stageFrameRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return

    const updateStage = () => {
      const rect = stage.getBoundingClientRect()
      setStageSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })
    }

    updateStage()
    const observer = new ResizeObserver(updateStage)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [isFullscreen])

  useEffect(() => {
    const audio = backgroundMusicRef.current
    if (!audio) return

    audio.volume = 0.12
    audio.loop = true

    if (muted || phase !== 'playing') {
      audio.pause()
      return
    }

    void audio.play().catch(() => {
      // Ignore blocked autoplay; startGame will retry from a user gesture.
    })
  }, [muted, phase])

  useEffect(() => {
    const audio = backgroundMusicRef.current
    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const image = new window.Image()
    image.src = '/game-assets/background/restaurant-bg-pixel.png'
    stageBackgroundRef.current = image

    const logo = new window.Image()
    logo.src = '/game-assets/brand/rishtedar-logo-pixel.png'
    logoSpriteRef.current = logo
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const spriteSources: Record<ChefMood, string> = {
      happy: '/game-assets/chef/chef-happy.png',
      busy: '/game-assets/chef/chef-busy.png',
      panicked: '/game-assets/chef/chef-panicked.png',
    }

    const sprites: Partial<Record<ChefMood, HTMLImageElement>> = {}
    ;(Object.entries(spriteSources) as Array<[ChefMood, string]>).forEach(([mood, src]) => {
      const image = new window.Image()
      image.src = src
      sprites[mood] = image
    })

    chefSpritesRef.current = sprites
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sprites: Partial<Record<IngredientId, HTMLImageElement>> = {}
    INGREDIENTS.forEach((ingredient) => {
      const image = new window.Image()
      image.src = ingredient.assetPath
      sprites[ingredient.id] = image
    })
    ingredientSpritesRef.current = sprites
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sprites: Partial<Record<DishId, HTMLImageElement>> = {}
    RECIPES.forEach((recipe) => {
      const image = new window.Image()
      image.src = recipe.assetPath
      sprites[recipe.id] = image
    })
    recipeSpritesRef.current = sprites
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    customerPortraitsRef.current = CUSTOMER_PORTRAIT_PATHS.map((src) => {
      const image = new window.Image()
      image.src = src
      return image
    })
  }, [])


  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const onPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = (clientX - rect.left) * (W / rect.width)
      const y = (clientY - rect.top) * (H / rect.height)
      handleCanvasTap(x, y)
    }

    const onClick = (event: MouseEvent) => onPointer(event.clientX, event.clientY)
    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault()
      const touch = event.changedTouches[0]
      if (touch) onPointer(touch.clientX, touch.clientY)
    }

    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })

    const loop = (now: number) => {
      const state = stateRef.current
      state.animId = requestAnimationFrame(loop)
      const dt = Math.min(now - state.lastTick || 16, 40)
      state.lastTick = now

      if (state.phase === 'playing') {
        const isTutorial = state.tutorialStep > 0

        if (!isTutorial) state.elapsedMs += dt
        const difficulty = getDifficultyState(state.elapsedMs)
        if (!isTutorial) state.spawnTimerMs -= dt

        if (state.chefMoodTimer > 0) {
          state.chefMoodTimer -= dt
          if (state.chefMoodTimer <= 0) state.chefMood = 'happy'
        }

        if (state.platePulse > 0) state.platePulse -= dt
        if (state.flashGood > 0) state.flashGood -= dt
        if (state.flashBad > 0) state.flashBad -= dt
        if (state.flashWarn > 0) state.flashWarn -= dt

        if (!isTutorial && state.spawnTimerMs <= 0) {
          spawnCustomer()
          state.spawnTimerMs = difficulty.spawnIntervalMs + Math.random() * 450
        }

        for (let i = 0; i < state.customers.length; i += 1) {
          const customer = state.customers[i]
          if (!customer) continue

          customer.pulse = (customer.pulse + dt * 0.007) % (Math.PI * 2)

          if (isTutorial) continue

          const patienceDrain = (dt / 1000 / 28) / difficulty.patienceMultiplier
          customer.patience -= patienceDrain
          customer.mood =
            customer.patience < 0.28 ? 'impatient' : customer.patience < 0.62 ? 'neutral' : 'happy'

          if (customer.patience <= 0) {
            state.customers[i] = null
            state.lives -= 1
            state.combo = 0
            state.flashBad = 210
            state.flashWarn = 180
            state.chefMood = 'panicked'
            state.chefMoodTimer = 1000
            spawnFloater(TABLE_SLOTS[i].x, TABLE_SLOTS[i].y - 80, 'Cliente perdido', 'bad')
            playSound('warning')

            if (state.lives <= 0) {
              setGamePhase('game-over')
              break
            }
          }
        }

        for (const floater of state.floaters) {
          floater.y += floater.vy * (dt / 16)
          floater.alpha -= (dt / 1000) * 1.4
        }
        state.floaters = state.floaters.filter((floater) => floater.alpha > 0)

        for (const spark of state.sparks) {
          spark.x += spark.vx * (dt / 16)
          spark.y += spark.vy * (dt / 16)
          spark.vy += 0.18 * (dt / 16)
          spark.alpha -= (dt / 1000) * 1.9
        }
        state.sparks = state.sparks.filter((spark) => spark.alpha > 0)
      }

      ctx.clearRect(0, 0, W, H)

      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#120d0a')
      bg.addColorStop(0.45, '#24140f')
      bg.addColorStop(1, '#090607')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      drawBackdrop(ctx, stageBackgroundRef.current)
      drawZones(ctx)
      drawStageSign(ctx, logoSpriteRef.current)

      const difficulty = getDifficultyState(state.elapsedMs)
      state.buttonMap = []

      drawTables(
        ctx,
        state,
        ingredientSpritesRef.current,
        recipeSpritesRef.current,
        customerPortraitsRef.current
      )
      drawChef(ctx, state, chefSpritesRef.current)
      drawStation(ctx, state, ingredientSpritesRef.current, recipeSpritesRef.current)
      drawIngredientTray(ctx, state, ingredientSpritesRef.current)
      drawHud(ctx, state, difficulty)
      drawFloaters(ctx, state)

      if (state.flashGood > 0) {
        ctx.fillStyle = `rgba(95, 223, 165, ${(state.flashGood / 180) * 0.11})`
        ctx.fillRect(0, 0, W, H)
      }
      if (state.flashBad > 0) {
        ctx.fillStyle = `rgba(221, 85, 72, ${(state.flashBad / 220) * 0.16})`
        ctx.fillRect(0, 0, W, H)
      }
      if (state.flashWarn > 0) {
        ctx.fillStyle = `rgba(245, 176, 64, ${(state.flashWarn / 180) * 0.05})`
        ctx.fillRect(0, 0, W, H)
      }

      drawTutorialOverlay(ctx, state)
    }

    stateRef.current.animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(stateRef.current.animId)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [handleCanvasTap, playSound, setGamePhase, spawnCustomer, spawnFloater])

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full bg-[#120d0a] shadow-[0_20px_80px_rgba(0,0,0,0.45)] ${
        isFullscreen
          ? 'fixed inset-0 z-50 overflow-hidden border-0 rounded-none'
          : 'rounded-[28px] border border-[#6a3c22] p-3'
      }`}
      style={
        isFullscreen
          ? {
              height: viewportSize.height,
              paddingTop: 'max(10px, env(safe-area-inset-top))',
              paddingRight: 'max(10px, env(safe-area-inset-right))',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
              paddingLeft: 'max(10px, env(safe-area-inset-left))',
            }
          : undefined
      }
    >
      <div className="flex h-full min-h-0 flex-col">
      {!useCompactFullscreenChrome && (
      <div className={`flex flex-wrap items-center justify-between gap-3 px-1 ${isFullscreen ? 'mb-2' : 'mb-3'}`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#f1b865]">Minijuego semanal</p>
          <h3 className={`font-display italic text-[#fff5e8] ${isFullscreen && isCompactViewport ? 'text-2xl' : 'text-3xl'}`}>El Festín de Especias</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMuted((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[#6a3c22] bg-[#1d130e] px-3 py-2 text-xs uppercase tracking-[0.22em] text-[#f6ddbd] transition-colors hover:border-[#c9952a]"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? 'Mute' : 'Audio'}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-full border border-[#6a3c22] bg-[#1d130e] px-3 py-2 text-xs uppercase tracking-[0.22em] text-[#f6ddbd] transition-colors hover:border-[#c9952a]"
          >
            <Expand size={14} />
            {isFullscreen ? 'Salir' : 'Pantalla completa'}
          </button>
        </div>
      </div>
      )}

      <div
        ref={stageFrameRef}
        className={`relative min-h-0 flex-1 overflow-hidden bg-[#0b0807] ${
          isFullscreen ? 'rounded-[22px] border border-[#8b5b2f]' : 'rounded-[24px] border border-[#8b5b2f]'
        }`}
      >
        <audio ref={backgroundMusicRef} src="/musica%20juego.mp3" preload="auto" />
        {useCompactFullscreenChrome && (
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMuted((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#6a3c22] bg-[rgba(29,19,14,0.92)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f6ddbd] backdrop-blur-sm transition-colors hover:border-[#c9952a]"
            >
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#6a3c22] bg-[rgba(29,19,14,0.92)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f6ddbd] backdrop-blur-sm transition-colors hover:border-[#c9952a]"
            >
              <Expand size={12} />
              <span className="hidden min-[380px]:inline">{isFullscreen ? 'Salir' : 'Full'}</span>
            </button>
          </div>
        )}
        <div className={`flex h-full w-full items-center justify-center ${useCompactFullscreenChrome ? 'px-1 py-1' : 'px-2 py-2'}`}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block touch-none bg-[#0b0807]"
          style={{
            width: canvasDisplayWidth,
            height: canvasDisplayHeight,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
        </div>

        <AnimatePresence>
          {isPortraitViewport && !isFullscreen && (
            <motion.div
              key="portrait-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(9,6,7,0.95)] p-5 text-center"
            >
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-[0.32em] text-[#f1b865]">Minijuego semanal</p>
                <h4 className="font-display text-2xl italic text-[#fff5e8]">El Festín de Especias</h4>
                <p className="mt-2 text-xs leading-relaxed text-[#c7a985]">
                  Inclina el teléfono o activa pantalla completa para jugar.
                </p>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="mt-4 rounded-full bg-[#c9952a] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#25140c] transition-colors hover:bg-[#e0ae44]"
                >
                  Pantalla completa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRotateHint && (
            <motion.div
              key="rotate-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(9,6,7,0.92)] p-6 text-center"
            >
              <div className="max-w-sm rounded-[24px] border border-[#8b5b2f] bg-[linear-gradient(180deg,rgba(44,24,17,0.98),rgba(20,11,9,0.98))] px-6 py-7">
                <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-[#f1b865]">Pantalla completa</p>
                <h4 className="font-display text-3xl italic text-[#fff5e8]">Gira el teléfono</h4>
                <p className="mt-3 text-sm leading-relaxed text-[#f4d9bb]">
                  Intenté bloquear el juego en horizontal, pero este navegador no lo permitió. Gira el dispositivo para ver todos los controles.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex items-center justify-center bg-[rgba(9,6,7,0.84)] ${useCompactFullscreenChrome ? 'overflow-y-auto p-3' : 'p-6'}`}
            >
              <div className={`w-full rounded-[28px] border border-[#8b5b2f] bg-[linear-gradient(180deg,rgba(44,24,17,0.98),rgba(20,11,9,0.98))] text-center shadow-[0_18px_70px_rgba(0,0,0,0.45)] ${
                useCompactFullscreenChrome ? 'max-w-lg px-4 py-5' : 'max-w-xl px-7 py-8'
              }`}>
                <p className={`uppercase tracking-[0.32em] text-[#f1b865] ${useCompactFullscreenChrome ? 'mb-1 text-[9px]' : 'mb-2 text-[10px]'}`}>Minijuego semanal</p>
                <h2 className={`font-display italic text-[#fff5e8] ${useCompactFullscreenChrome ? 'text-3xl' : 'text-5xl'}`}>El Festín de Especias</h2>
                <p className={`mx-auto max-w-md text-[#c7a985] ${useCompactFullscreenChrome ? 'mt-2 text-xs' : 'mt-3 text-sm'}`}>
                  Sirve los platos antes de que tus clientes se vayan.
                </p>

                <div className={`flex items-center justify-center gap-2 text-[#f4d9bb] ${useCompactFullscreenChrome ? 'mt-4 text-[11px]' : 'mt-5 text-xs'}`}>
                  <span>① Toca ingredientes</span>
                  <span className="text-[#6a3c22]">›</span>
                  <span>② Arma el plato</span>
                  <span className="text-[#6a3c22]">›</span>
                  <span>③ Sirve la mesa</span>
                </div>

                <p className={`text-[#6a4a30] ${useCompactFullscreenChrome ? 'mt-4 text-[10px]' : 'mt-5 text-[11px]'}`}>
                  {tokensLeft > 0
                    ? `${tokensLeft} intento${tokensLeft !== 1 ? 's' : ''} rankeado${tokensLeft !== 1 ? 's' : ''} esta semana`
                    : 'Sin intentos rankeados esta semana · modo práctica'}
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className={`rounded-full bg-[#c9952a] font-semibold uppercase text-[#25140c] transition-colors hover:bg-[#e0ae44] ${
                    useCompactFullscreenChrome
                      ? 'mt-4 px-6 py-2.5 text-[11px] tracking-[0.22em]'
                      : 'mt-6 px-8 py-3 text-xs tracking-[0.3em]'
                  }`}
                >
                  Jugar ahora
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'game-over' && (
            <motion.div
              key="game-over"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[rgba(9,6,7,0.8)] p-6"
            >
              <div className="max-w-lg rounded-[28px] border border-[#8b5b2f] bg-[linear-gradient(180deg,rgba(44,24,17,0.98),rgba(20,11,9,0.98))] px-7 py-8 text-center shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
                <Trophy size={34} className="mx-auto mb-3 text-[#f1b865]" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#f1b865]">Run terminada</p>
                <h2 className="mt-2 font-display text-5xl italic text-[#fff5e8]">{endStats.score.toLocaleString('es-CL')}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#c7a985]">Puntos</p>
                <div className="mt-6 grid gap-3 text-left text-sm text-[#f4d9bb] sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#714126] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#f1b865]">Platos</p>
                    <p className="mt-1 text-lg text-[#fff5e8]">{endStats.dishesServed}</p>
                  </div>
                  <div className="rounded-2xl border border-[#714126] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#f1b865]">Combo</p>
                    <p className="mt-1 text-lg text-[#fff5e8]">x{endStats.maxCombo}</p>
                  </div>
                  <div className="rounded-2xl border border-[#714126] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#f1b865]">Fase</p>
                    <p className="mt-1 text-lg text-[#fff5e8]">{endStats.tier}</p>
                  </div>
                </div>

                <RankingButtons
                  score={endStats.score}
                  tokensLeft={tokensLeft}
                  onRank={(score) => onGameEnd(score, true)}
                  onRetry={startGame}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  )
}

function drawBackdrop(ctx: CanvasRenderingContext2D, backgroundImage: HTMLImageElement | null) {
  ctx.save()

  if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    const imageRatio = backgroundImage.naturalWidth / backgroundImage.naturalHeight
    const canvasRatio = W / H

    let drawWidth = W
    let drawHeight = H
    let drawX = 0
    let drawY = 0

    if (imageRatio > canvasRatio) {
      drawHeight = H
      drawWidth = H * imageRatio
      drawX = (W - drawWidth) / 2
    } else {
      drawWidth = W
      drawHeight = W / imageRatio
      drawY = (H - drawHeight) / 2
    }

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight)

    ctx.fillStyle = 'rgba(18, 10, 8, 0.22)'
    ctx.fillRect(0, 0, W, H)
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#120d0a')
    bg.addColorStop(0.45, '#24140f')
    bg.addColorStop(1, '#090607')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  }

  const glow = ctx.createRadialGradient(480, 220, 40, 480, 220, 320)
  glow.addColorStop(0, 'rgba(255, 179, 94, 0.08)')
  glow.addColorStop(1, 'rgba(255, 179, 94, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const topShade = ctx.createLinearGradient(0, 0, 0, 120)
  topShade.addColorStop(0, 'rgba(8, 5, 4, 0.72)')
  topShade.addColorStop(1, 'rgba(8, 5, 4, 0)')
  ctx.fillStyle = topShade
  ctx.fillRect(0, 0, W, 120)

  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let i = 0; i < 24; i += 1) {
    const x = 40 + i * 40
    ctx.fillRect(x, 0, 1, H)
  }
  for (let i = 0; i < 14; i += 1) {
    const y = 86 + i * 34
    ctx.fillRect(0, y, W, 1)
  }

  const bottomShade = ctx.createLinearGradient(0, H - 120, 0, H)
  bottomShade.addColorStop(0, 'rgba(18, 10, 8, 0)')
  bottomShade.addColorStop(1, 'rgba(18, 10, 8, 0.66)')
  ctx.fillStyle = bottomShade
  ctx.fillRect(0, H - 120, W, 120)

  ctx.restore()
}

function drawZones(ctx: CanvasRenderingContext2D) {
  ctx.save()

  const kitchenGradient = ctx.createLinearGradient(0, STAGE_Y, 0, H - 84)
  kitchenGradient.addColorStop(0, 'rgba(34, 18, 12, 0.28)')
  kitchenGradient.addColorStop(1, 'rgba(16, 10, 8, 0.16)')
  ctx.fillStyle = kitchenGradient
  ctx.fillRect(18, STAGE_Y, 610, H - STAGE_Y - 100)

  const trayGradient = ctx.createLinearGradient(650, STAGE_Y, 936, H - 84)
  trayGradient.addColorStop(0, 'rgba(46, 24, 18, 0.56)')
  trayGradient.addColorStop(1, 'rgba(24, 14, 12, 0.72)')
  ctx.fillStyle = trayGradient
  ctx.beginPath()
  ctx.roundRect(INGREDIENT_TRAY.x, INGREDIENT_TRAY.y, INGREDIENT_TRAY.w, INGREDIENT_TRAY.h, INGREDIENT_TRAY.radius)
  ctx.fill()

  ctx.strokeStyle = 'rgba(201,149,42,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(INGREDIENT_TRAY.x, INGREDIENT_TRAY.y, INGREDIENT_TRAY.w, INGREDIENT_TRAY.h, INGREDIENT_TRAY.radius)
  ctx.stroke()

  ctx.fillStyle = 'rgba(201,149,42,0.6)'
  ctx.font = '600 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('INGREDIENTES', 682, 114)

  ctx.restore()
}

function drawStageSign(ctx: CanvasRenderingContext2D, logoSprite: HTMLImageElement | null) {
  if (!logoSprite || !logoSprite.complete || logoSprite.naturalWidth <= 0) return

  const signX = 530
  const signY = 104
  const signW = 176
  const signH = 54
  const logoPadding = 2
  const logoW = signW - logoPadding * 2
  const logoH = logoW * (logoSprite.naturalHeight / logoSprite.naturalWidth)

  ctx.save()

  const woodGradient = ctx.createLinearGradient(signX, signY, signX, signY + signH)
  woodGradient.addColorStop(0, 'rgba(92, 54, 28, 0.9)')
  woodGradient.addColorStop(1, 'rgba(51, 29, 18, 0.96)')
  ctx.fillStyle = woodGradient
  ctx.beginPath()
  ctx.roundRect(signX - signW / 2, signY - signH / 2, signW, signH, 14)
  ctx.fill()

  ctx.strokeStyle = 'rgba(201,149,42,0.46)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(signX - signW / 2, signY - signH / 2, signW, signH, 14)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.beginPath()
  ctx.roundRect(signX - signW / 2 + 8, signY - signH / 2 + 6, signW - 16, 10, 8)
  ctx.fill()

  ctx.strokeStyle = 'rgba(46, 28, 16, 0.9)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(signX - signW / 2 + 24, signY + signH / 2)
  ctx.lineTo(signX - signW / 2 + 34, signY + signH / 2 + 20)
  ctx.moveTo(signX + signW / 2 - 24, signY + signH / 2)
  ctx.lineTo(signX + signW / 2 - 34, signY + signH / 2 + 20)
  ctx.stroke()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(signX - signW / 2 + 3, signY - signH / 2 + 3, signW - 6, signH - 6, 12)
  ctx.clip()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    logoSprite,
    signX - logoW / 2,
    signY - logoH / 2 + 3,
    logoW,
    logoH
  )
  ctx.restore()

  ctx.restore()
}

function drawIngredientShortTag(
  ctx: CanvasRenderingContext2D,
  ingredientId: IngredientId,
  x: number,
  y: number,
  compact = false
) {
  const ingredient = INGREDIENT_BY_ID[ingredientId]
  const width = compact ? 16 : 22
  const height = compact ? 11 : 14

  ctx.save()
  ctx.fillStyle = 'rgba(18,10,8,0.82)'
  ctx.beginPath()
  ctx.roundRect(x - width / 2, y - height / 2, width, height, compact ? 5 : 7)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,245,232,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x - width / 2, y - height / 2, width, height, compact ? 5 : 7)
  ctx.stroke()
  ctx.fillStyle = ingredient.accent
  ctx.font = `700 ${compact ? 7 : 8}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(ingredient.shortLabel, x, y + (compact ? 2.5 : 3))
  ctx.restore()
}

function drawIngredientSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement | undefined,
  x: number,
  y: number,
  size: number
) {
  if (!sprite || !sprite.complete || sprite.naturalWidth <= 0) return false

  const ratio = sprite.naturalWidth / sprite.naturalHeight
  const width = ratio >= 1 ? size : size * ratio
  const height = ratio >= 1 ? size / ratio : size
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sprite, x - width / 2, y - height / 2, width, height)
  return true
}

function drawIngredientBadge(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement | undefined,
  ingredientId: IngredientId,
  x: number,
  y: number,
  size: number,
  fallbackRadius: number,
  showLabel = false
) {
  const ingredientData = INGREDIENT_BY_ID[ingredientId]

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, fallbackRadius, 0, Math.PI * 2)
  ctx.clip()
  const drewSprite = drawIngredientSprite(ctx, sprite, x, y, size)
  ctx.restore()

  if (!drewSprite) {
    ctx.fillStyle = ingredientData.fill
    ctx.beginPath()
    ctx.arc(x, y, fallbackRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = ingredientData.accent
    ctx.font = `bold ${Math.max(7, Math.round(fallbackRadius * 0.72))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(ingredientData.badgeLabel, x, y + 3)
  }

  ctx.strokeStyle = 'rgba(255,245,232,0.42)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, fallbackRadius, 0, Math.PI * 2)
  ctx.stroke()

  if (showLabel) {
    ctx.fillStyle = '#f5dfc2'
    ctx.font = '600 8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ingredientData.badgeLabel, x, y + fallbackRadius + 10)
  }
}

function drawTables(
  ctx: CanvasRenderingContext2D,
  state: RunState,
  ingredientSprites: Partial<Record<IngredientId, HTMLImageElement>>,
  recipeSprites: Partial<Record<DishId, HTMLImageElement>>,
  customerPortraits: HTMLImageElement[]
) {
  ctx.save()

  TABLE_SLOTS.forEach((slot, index) => {
    const customer = state.customers[index]
    const cardX = slot.x - TABLE_W / 2
    const cardY = slot.y - TABLE_H / 2
    const textCenterX = slot.x
    const bowlX = cardX + 148
    const customerX = cardX + 34
    const customerY = cardY + 102
    const patienceWidth = TABLE_W - 20
    const patienceX = cardX + 10
    const patienceY = cardY + 56
    const badgeY = cardY + 128

    const baseGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + TABLE_H)
    baseGradient.addColorStop(0, customer ? 'rgba(60,28,19,0.92)' : 'rgba(29,17,13,0.75)')
    baseGradient.addColorStop(1, customer ? 'rgba(31,18,15,0.98)' : 'rgba(18,12,10,0.88)')
    ctx.fillStyle = baseGradient
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, TABLE_W, TABLE_H, 22)
    ctx.fill()

    ctx.strokeStyle = customer
      ? customer.mood === 'impatient'
        ? 'rgba(234,115,70,0.84)'
        : 'rgba(201,149,42,0.48)'
      : 'rgba(201,149,42,0.18)'
    ctx.lineWidth = customer ? 2 : 1
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, TABLE_W, TABLE_H, 22)
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(cardX + 8, cardY + 8, TABLE_W - 16, 40, 14)
    ctx.fill()

    if (!customer) {
      ctx.fillStyle = 'rgba(201,149,42,0.35)'
      ctx.font = '600 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Mesa lista', slot.x, slot.y - 4)
      ctx.fillStyle = 'rgba(214, 195, 176, 0.4)'
      ctx.font = '11px sans-serif'
      ctx.fillText('Esperando cliente', slot.x, slot.y + 22)
      state.buttonMap.push({ key: String(index), x: slot.x, y: slot.y, radius: 70, type: 'table' })
      return
    }

    const recipePreview = getRecipePreview(customer.recipeId)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff5e8'
    ctx.font = '700 11px sans-serif'
    ctx.fillText(customer.recipe.name, textCenterX, cardY + 27)
    ctx.fillStyle = 'rgba(244,217,187,0.72)'
    ctx.font = '9px sans-serif'
    ctx.fillText(recipePreview, textCenterX, cardY + 42)

    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(patienceX, patienceY, patienceWidth, 8, 8)
    ctx.fill()

    const patienceColor =
      customer.patience > 0.58 ? '#62d9a0' : customer.patience > 0.32 ? '#f0b24a' : '#de6947'
    ctx.fillStyle = patienceColor
    ctx.beginPath()
    ctx.roundRect(patienceX, patienceY, patienceWidth * Math.max(0, customer.patience), 8, 8)
    ctx.fill()

    drawCustomer(ctx, customerX, customerY, index, customer.mood, customer.pulse, customerPortraits)
    drawCompactRecipeCard(ctx, bowlX, cardY + 86, customer.recipe, recipeSprites[customer.recipe.id])

    customer.recipe.ingredients.forEach((ingredientId, ingredientIndex) => {
      const chipX = cardX + 96 + ingredientIndex * 32
      drawIngredientBadge(
        ctx,
        ingredientSprites[ingredientId],
        ingredientId,
        chipX,
        badgeY,
        32,
        16
      )
    })

    if (customer.mood === 'impatient') {
      ctx.fillStyle = 'rgba(234,115,70,0.9)'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('¡Ya!', textCenterX, cardY + TABLE_H - 8)
    }

    state.buttonMap.push({ key: String(index), x: slot.x, y: slot.y, radius: 70, type: 'table' })
  })

  ctx.restore()
}

function drawCompactRecipeCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  recipe: RecipeDefinition,
  recipeSprite: HTMLImageElement | undefined
) {
  ctx.save()

  drawOrderBowl(ctx, x, y, recipe, recipeSprite, 0.96, 56, 48)

  ctx.restore()
}

function drawCustomer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  mood: CustomerMood,
  pulse: number,
  customerPortraits: HTMLImageElement[]
) {
  const bob = Math.sin(pulse) * 2.8
  const portrait = customerPortraits[index % customerPortraits.length]

  if (portrait && portrait.complete && portrait.naturalWidth > 0) {
    const drawHeight = 74
    const drawWidth = (portrait.naturalWidth / portrait.naturalHeight) * drawHeight
    const eyebrowY = -23
    const mouthY = -2

    ctx.save()
    ctx.translate(x, y + bob)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(portrait, -drawWidth / 2, -35, drawWidth, drawHeight)

    ctx.strokeStyle = mood === 'impatient' ? '#3b1c17' : '#2b1b14'
    ctx.lineWidth = mood === 'impatient' ? 2.5 : 2
    ctx.lineCap = 'round'

    if (mood === 'happy') {
      ctx.beginPath()
      ctx.moveTo(-11, eyebrowY)
      ctx.lineTo(-5, eyebrowY - 1)
      ctx.moveTo(5, eyebrowY - 1)
      ctx.lineTo(11, eyebrowY)
      ctx.stroke()

      ctx.strokeStyle = '#6e241a'
      ctx.beginPath()
      ctx.arc(0, mouthY, 6, 0.2, Math.PI - 0.2)
      ctx.stroke()

      ctx.fillStyle = 'rgba(214,96,78,0.55)'
      ctx.beginPath()
      ctx.arc(-10, mouthY - 1, 2.5, 0, Math.PI * 2)
      ctx.arc(10, mouthY - 1, 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (mood === 'neutral') {
      ctx.beginPath()
      ctx.moveTo(-11, eyebrowY)
      ctx.lineTo(-5, eyebrowY)
      ctx.moveTo(5, eyebrowY)
      ctx.lineTo(11, eyebrowY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-5, mouthY + 1)
      ctx.lineTo(5, mouthY + 1)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(-12, eyebrowY + 1)
      ctx.lineTo(-4, eyebrowY - 2)
      ctx.moveTo(4, eyebrowY - 2)
      ctx.lineTo(12, eyebrowY + 1)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(0, mouthY + 6, 6, Math.PI + 0.24, Math.PI * 2 - 0.24)
      ctx.stroke()

      ctx.strokeStyle = '#de6947'
      ctx.beginPath()
      ctx.moveTo(17, -16)
      ctx.lineTo(21, -22)
      ctx.moveTo(21, -22)
      ctx.lineTo(24, -18)
      ctx.stroke()
    }

    ctx.restore()
    return
  }

  ctx.save()
  ctx.translate(x, y + bob)

  ctx.fillStyle = '#74443a'
  ctx.beginPath()
  ctx.roundRect(-26, -4, 52, 42, 18)
  ctx.fill()

  ctx.fillStyle = '#f1d1b0'
  ctx.beginPath()
  ctx.arc(0, -18, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawChef(
  ctx: CanvasRenderingContext2D,
  state: RunState,
  chefSprites: Partial<Record<ChefMood, HTMLImageElement>>
) {
  const pace = state.phase === 'playing' ? Math.sin(state.elapsedMs * 0.008) : 0
  const mood = state.chefMood
  const bob = mood === 'panicked' ? Math.sin(state.elapsedMs * 0.04) * 4 : pace * 2

  const sprite = chefSprites[mood]

  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    const drawHeight = mood === 'busy' ? 146 : 140
    const drawWidth = (sprite.naturalWidth / sprite.naturalHeight) * drawHeight

    ctx.save()
    ctx.translate(540, 210 + bob)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2 - 8, drawWidth, drawHeight)
    ctx.restore()
    return
  }

  ctx.save()
  ctx.translate(540, 170 + bob)

  const coatColor = mood === 'happy' ? '#406d50' : mood === 'busy' ? '#8f5439' : '#b63f32'
  const apronColor = mood === 'happy' ? '#eadfcd' : mood === 'busy' ? '#f0d7c2' : '#f2cdc4'

  // Hat with a softer silhouette and brim.
  ctx.fillStyle = '#fbf4e8'
  ctx.beginPath()
  ctx.arc(-10, -34, 10, 0, Math.PI * 2)
  ctx.arc(0, -38, 12, 0, Math.PI * 2)
  ctx.arc(11, -33, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(-19, -31, 38, 8, 4)
  ctx.fill()
  ctx.fillStyle = 'rgba(217,205,184,0.5)'
  ctx.beginPath()
  ctx.roundRect(-15, -30, 30, 3, 2)
  ctx.fill()

  // Head and neck.
  ctx.fillStyle = '#f2d2b1'
  ctx.beginPath()
  ctx.arc(0, -10, 17, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(-5, 2, 10, 6)

  // Coat and apron.
  ctx.fillStyle = coatColor
  ctx.beginPath()
  ctx.roundRect(-27, 7, 54, 62, 22)
  ctx.fill()
  ctx.fillStyle = apronColor
  ctx.beginPath()
  ctx.roundRect(-11, 20, 22, 36, 10)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.beginPath()
  ctx.roundRect(-21, 14, 42, 10, 6)
  ctx.fill()

  // Sleeves and hands.
  ctx.fillStyle = coatColor
  ctx.fillRect(-38, 19, 12, 18)
  ctx.fillRect(26, 19, 12, 18)
  ctx.fillStyle = '#f0d5b7'
  ctx.fillRect(-42, 22, 12, 8)
  ctx.fillRect(30, 22, 12, 8)

  // Legs.
  ctx.fillStyle = '#f6ebdb'
  ctx.fillRect(-13, 69, 10, 22)
  ctx.fillRect(4, 69, 10, 22)

  // Face.
  ctx.strokeStyle = '#241710'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(-5, -14, 1.1, 0, Math.PI * 2)
  ctx.arc(5, -14, 1.1, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-8, -18)
  ctx.lineTo(-1, -18)
  ctx.moveTo(1, -18)
  ctx.lineTo(8, -18)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, -10, 6, 0.1, Math.PI - 0.1)
  ctx.stroke()
  ctx.fillStyle = '#2b1b14'
  ctx.beginPath()
  ctx.ellipse(0, -6, 3, 1.6, 0, 0, Math.PI * 2)
  ctx.fill()

  if (mood === 'busy') {
    ctx.strokeStyle = '#241710'
    ctx.beginPath()
    ctx.moveTo(-8, -20)
    ctx.lineTo(-1, -19)
    ctx.moveTo(1, -19)
    ctx.lineTo(8, -20)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-5, -4)
    ctx.lineTo(5, -2)
    ctx.stroke()
  }

  if (mood === 'panicked') {
    ctx.strokeStyle = '#241710'
    ctx.beginPath()
    ctx.moveTo(-8, -21)
    ctx.lineTo(-1, -23)
    ctx.moveTo(1, -23)
    ctx.lineTo(8, -21)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 5, Math.PI + 0.15, Math.PI * 2 - 0.15)
    ctx.stroke()
  }

  // Small warm shadow under the chef to anchor the character.
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(0, 96, 24, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(244,217,187,0.9)'
  ctx.font = '600 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    mood === 'happy' ? 'Chef feliz' : mood === 'busy' ? 'Chef apurado' : 'Chef urgido',
    0,
    100
  )

  ctx.restore()
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  state: RunState,
  ingredientSprites: Partial<Record<IngredientId, HTMLImageElement>>,
  recipeSprites: Partial<Record<DishId, HTMLImageElement>>
) {
  ctx.save()

  const panelX = 452
  const panelY = 300
  const panelW = 156
  const panelH = 128
  const plateCenterX = panelX + panelW / 2
  const plateCenterY = 364
  const titleY = 316
  const subtitleY = 332
  const helperY = 402

  ctx.fillStyle = 'rgba(17,11,10,0.9)'
  ctx.beginPath()
  ctx.roundRect(panelX, panelY, panelW, panelH, 24)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,149,42,0.34)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(panelX, panelY, panelW, panelH, 24)
  ctx.stroke()

  ctx.fillStyle = 'rgba(201,149,42,0.72)'
  ctx.font = '600 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('PASE DE COCINA', plateCenterX, titleY)

  ctx.fillStyle = state.plate.length ? '#fff5e8' : 'rgba(244,217,187,0.58)'
  ctx.font = '600 10px sans-serif'
  ctx.fillText(
    state.plateMatch
      ? RECIPE_BY_ID[state.plateMatch].name
      : state.plate.length
        ? 'Sigue armando...'
        : 'Selecciona ingredientes',
    plateCenterX,
    subtitleY
  )

  const ringPulse = state.platePulse > 0 ? 1 + (state.platePulse / 320) * 0.1 : 1
  ctx.save()
  ctx.translate(plateCenterX, plateCenterY)
  ctx.scale(ringPulse, ringPulse)
  ctx.fillStyle = '#f4ecdf'
  ctx.beginPath()
  ctx.arc(0, 0, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(222,202,176,0.44)'
  ctx.beginPath()
  ctx.arc(0, 0, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  if (state.plateMatch) {
    drawOrderBowl(
      ctx,
      plateCenterX,
      plateCenterY,
      RECIPE_BY_ID[state.plateMatch],
      recipeSprites[state.plateMatch],
      1,
      90,
      68
    )
  }

  const chipBaseY = 356
  state.plate.forEach((ingredientId, index) => {
    const isLeftColumn = index < 2
    const x = isLeftColumn ? panelX + 22 : panelX + panelW - 20
    const y = chipBaseY + (isLeftColumn ? index : index - 1) * 20
    drawIngredientBadge(
      ctx,
      ingredientSprites[ingredientId],
      ingredientId,
      x,
      y,
      14,
      9
    )
  })

  ctx.fillStyle = 'rgba(244,217,187,0.58)'
  ctx.font = '8px sans-serif'
  const helperText = state.plate.length
    ? state.plate.map((id) => INGREDIENT_BY_ID[id].label).join(' · ')
    : 'Usa la receta del cliente como guía'
  ctx.fillText(helperText, plateCenterX, helperY)

  ctx.fillStyle = 'rgba(31,18,15,0.95)'
  ctx.beginPath()
  ctx.roundRect(CLEAR_BUTTON.x - CLEAR_BUTTON.w / 2, CLEAR_BUTTON.y - CLEAR_BUTTON.h / 2, CLEAR_BUTTON.w, CLEAR_BUTTON.h, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,149,42,0.36)'
  ctx.beginPath()
  ctx.roundRect(CLEAR_BUTTON.x - CLEAR_BUTTON.w / 2, CLEAR_BUTTON.y - CLEAR_BUTTON.h / 2, CLEAR_BUTTON.w, CLEAR_BUTTON.h, 18)
  ctx.stroke()
  ctx.fillStyle = '#f4d9bb'
  ctx.font = '600 9px sans-serif'
  ctx.fillText('LIMPIAR PLATO', CLEAR_BUTTON.x, CLEAR_BUTTON.y + 4)
  state.buttonMap.push({ key: 'clear', x: CLEAR_BUTTON.x, y: CLEAR_BUTTON.y, radius: 70, type: 'clear' })

  ctx.fillStyle = state.plateMatch ? 'rgba(95, 223, 165, 0.18)' : 'rgba(201,149,42,0.11)'
  ctx.beginPath()
  ctx.roundRect(SERVE_HINT.x - SERVE_HINT.w / 2, SERVE_HINT.y - SERVE_HINT.h / 2, SERVE_HINT.w, SERVE_HINT.h, 18)
  ctx.fill()
  ctx.strokeStyle = state.plateMatch ? 'rgba(95, 223, 165, 0.46)' : 'rgba(201,149,42,0.28)'
  ctx.beginPath()
  ctx.roundRect(SERVE_HINT.x - SERVE_HINT.w / 2, SERVE_HINT.y - SERVE_HINT.h / 2, SERVE_HINT.w, SERVE_HINT.h, 18)
  ctx.stroke()
  ctx.fillStyle = '#fff5e8'
  ctx.font = '700 9px sans-serif'
  ctx.fillText(state.plateMatch ? 'PLATO LISTO · TOCA SU MESA' : 'ARMA EL PLATO Y LUEGO TOCA SU MESA', SERVE_HINT.x, SERVE_HINT.y + 4)

  ctx.restore()
}

function drawIngredientTray(
  ctx: CanvasRenderingContext2D,
  state: RunState,
  ingredientSprites: Partial<Record<IngredientId, HTMLImageElement>>
) {
  ctx.save()

  INGREDIENTS.forEach((ingredient, index) => {
    const slot = INGREDIENT_SLOTS[index]
    const selected = state.plate.includes(ingredient.id)
    ctx.fillStyle = selected ? blendAlpha(ingredient.fill, 'f1') : blendAlpha(ingredient.fill, 'b2')
    ctx.beginPath()
    ctx.arc(slot.x, slot.y, selected ? 39 : 35, 0, Math.PI * 2)
    ctx.fill()

    const gloss = ctx.createRadialGradient(slot.x - 10, slot.y - 10, 3, slot.x, slot.y, 40)
    gloss.addColorStop(0, selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.24)')
    gloss.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gloss
    ctx.beginPath()
    ctx.arc(slot.x, slot.y, 35, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = selected ? 'rgba(255,245,232,0.95)' : 'rgba(255,245,232,0.32)'
    ctx.lineWidth = selected ? 3 : 1.5
    ctx.beginPath()
    ctx.arc(slot.x, slot.y, selected ? 39 : 35, 0, Math.PI * 2)
    ctx.stroke()

    drawIngredientShortTag(ctx, ingredient.id, slot.x, slot.y - 28)

    const drewSprite = drawIngredientSprite(
      ctx,
      ingredientSprites[ingredient.id],
      slot.x,
      slot.y - 1,
      selected ? 44 : 40
    )

    if (!drewSprite) {
      ctx.fillStyle = ingredient.accent
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ingredient.glyph, slot.x, slot.y + 5)
    }

    ctx.fillStyle = '#f5dfc2'
    ctx.font = '600 9px sans-serif'
    const firstLine = ingredient.label.length > 12 ? ingredient.label.split(' ')[0] : ingredient.label
    const secondLine = ingredient.label.length > 12 ? ingredient.label.split(' ').slice(1).join(' ') : ''
    ctx.fillText(firstLine, slot.x, slot.y + 52)
    if (secondLine) {
      ctx.fillText(secondLine, slot.x, slot.y + 64)
    }

    state.buttonMap.push({
      key: ingredient.id,
      x: slot.x,
      y: slot.y,
      radius: 42,
      ingredientId: ingredient.id,
      type: 'ingredient',
    })
  })

  ctx.restore()
}

function drawOrderBowl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  recipe: RecipeDefinition,
  recipeSprite: HTMLImageElement | undefined,
  alpha: number,
  maxWidth = 68,
  maxHeight = 68
) {
  if (recipeSprite && recipeSprite.complete && recipeSprite.naturalWidth > 0) {
    const widthRatio = maxWidth / recipeSprite.naturalWidth
    const heightRatio = maxHeight / recipeSprite.naturalHeight
    const scale = Math.min(widthRatio, heightRatio)
    const drawWidth = recipeSprite.naturalWidth * scale
    const drawHeight = recipeSprite.naturalHeight * scale

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(recipeSprite, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()
    return
  }

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  const fallbackScale = Math.min(maxWidth / 68, maxHeight / 68)
  ctx.scale(fallbackScale, fallbackScale)
  ctx.fillStyle = '#ece2d6'
  ctx.beginPath()
  ctx.arc(0, 0, 34, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = recipe.visualStyle.bowl
  ctx.beginPath()
  ctx.arc(0, 0, 25, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = recipe.visualStyle.sauce
  ctx.beginPath()
  ctx.arc(-3, 2, 17, 0, Math.PI * 2)
  ctx.fill()

  recipe.ingredients.forEach((ingredientId, index) => {
    const angle = (Math.PI * 2 * index) / recipe.ingredients.length
    ctx.fillStyle = INGREDIENT_BY_ID[ingredientId].accent
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * 9, Math.sin(angle) * 8, 4.5, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function drawHud(ctx: CanvasRenderingContext2D, state: RunState, difficulty: GameDifficultyState) {
  ctx.save()

  const hudGradient = ctx.createLinearGradient(0, 6, 0, HUD_H + 10)
  hudGradient.addColorStop(0, 'rgba(12,8,7,0.62)')
  hudGradient.addColorStop(1, 'rgba(20,11,9,0.38)')
  ctx.fillStyle = hudGradient
  ctx.beginPath()
  ctx.roundRect(12, 8, W - 24, HUD_H - 6, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,149,42,0.16)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(12, 8, W - 24, HUD_H - 6, 18)
  ctx.stroke()

  ctx.fillStyle = '#fff5e8'
  ctx.font = '700 24px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(state.score.toLocaleString('es-CL'), 28, 38)
  ctx.fillStyle = 'rgba(244,217,187,0.6)'
  ctx.font = '11px sans-serif'
  ctx.fillText('PTS', 28, 55)

  ctx.fillStyle = '#f1b865'
  ctx.font = '700 18px sans-serif'
  ctx.fillText(`Combo x${Math.max(1, state.combo)}`, 182, 39)
  ctx.fillStyle = 'rgba(244,217,187,0.62)'
  ctx.font = '11px sans-serif'
  ctx.fillText(`Max x${state.maxCombo}`, 182, 56)

  ctx.fillStyle = '#f4d9bb'
  ctx.font = '600 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Fase ${difficulty.tier}`, 502, 28)
  ctx.fillStyle = 'rgba(244,217,187,0.62)'
  ctx.font = '11px sans-serif'
  ctx.fillText(
    difficulty.tier === 1
      ? 'Servicio suave'
      : difficulty.tier === 2
        ? 'Sube la presión'
        : difficulty.tier === 3
          ? 'Rush de cocina'
          : 'Caos controlado',
    502,
    50
  )

  ctx.textAlign = 'right'
  for (let i = 0; i < LIVES_MAX; i += 1) {
    ctx.globalAlpha = i < state.lives ? 1 : 0.18
    ctx.font = '20px serif'
    ctx.fillText('❤', 920 - i * 22, 38)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(244,217,187,0.62)'
  ctx.font = '11px sans-serif'
  ctx.fillText('Vidas', 920, 55)

  const activeCount = state.customers.filter(Boolean).length
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.roundRect(640, 22, 150, 11, 10)
  ctx.fill()
  ctx.fillStyle = '#62d9a0'
  ctx.beginPath()
  ctx.roundRect(640, 22, 150 * (activeCount / getMaxCustomers(difficulty.tier || 1)), 11, 10)
  ctx.fill()
  ctx.fillStyle = 'rgba(244,217,187,0.72)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('MESAS OCUPADAS', 640, 50)

  ctx.restore()
}

function drawFloaters(ctx: CanvasRenderingContext2D, state: RunState) {
  ctx.save()
  ctx.textAlign = 'center'

  for (const spark of state.sparks) {
    ctx.globalAlpha = spark.alpha
    ctx.fillStyle = spark.color
    ctx.beginPath()
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const floater of state.floaters) {
    ctx.globalAlpha = floater.alpha
    ctx.fillStyle =
      floater.tone === 'good' ? '#70f0b1' : floater.tone === 'bad' ? '#ff8c74' : '#f3c77d'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(floater.text, floater.x, floater.y)
  }

  ctx.restore()
}

function RankingButtons({
  score,
  tokensLeft,
  onRank,
  onRetry,
}: {
  score: number
  tokensLeft: number
  onRank: (score: number) => void
  onRetry: () => void
}) {
  if (tokensLeft > 0) {
    return (
      <>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#f4d9bb]">
          Puedes subir este score al ranking semanal. Quienes terminen top 3 se llevan un premio real del restaurant.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onRank(score)}
            className="rounded-full bg-[#c9952a] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#25140c] transition-colors hover:bg-[#e0ae44]"
          >
            Subir al ranking
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-[#8b5b2f] px-6 py-3 text-xs uppercase tracking-[0.24em] text-[#f4d9bb] transition-colors hover:border-[#c9952a]"
          >
            <RotateCcw size={14} />
            Reintentar
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#f4d9bb]">
        Ya usaste tus intentos rankeados esta semana, pero puedes seguir practicando para perfeccionar la run.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#8b5b2f] px-6 py-3 text-xs uppercase tracking-[0.24em] text-[#f4d9bb] transition-colors hover:border-[#c9952a]"
      >
        <RotateCcw size={14} />
        Jugar de nuevo
      </button>
    </>
  )
}
