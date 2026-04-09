'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Crown, Star, Zap, Gift, MapPin, Clock,
  ChevronRight, Trophy, Gamepad2, ShoppingBag,
  UtensilsCrossed, Loader2,
} from 'lucide-react'
import { GameLeaderboard } from '@/components/pwa/GameLeaderboard'
import { RishtedarGame } from '@/components/pwa/RishtedarGame'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientIdentity {
  name: string
  phone: string
  favoriteLocal: string
}

interface LoyaltyData {
  points: number
  tier: 'bronze' | 'silver' | 'gold'
  totalVisits: number
  nextTierPoints: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  bronze: { color: '#cd7f32', icon: Star,  label: 'Bronze', next: 1000 },
  silver: { color: '#c0c0c0', icon: Zap,   label: 'Silver', next: 5000 },
  gold:   { color: '#c9952a', icon: Crown, label: 'Gold',   next: null  },
}

function getTier(points: number): 'bronze' | 'silver' | 'gold' {
  if (points >= 5000) return 'gold'
  if (points >= 1000) return 'silver'
  return 'bronze'
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function getTokensLeft(phone: string, businessId: string): number {
  const key = `game_tokens_${businessId}_${phone}_${getWeekStart()}`
  const used = parseInt(localStorage.getItem(key) || '0', 10)
  return Math.max(0, 3 - used)
}

function useToken(phone: string, businessId: string) {
  const key = `game_tokens_${businessId}_${phone}_${getWeekStart()}`
  const used = parseInt(localStorage.getItem(key) || '0', 10)
  localStorage.setItem(key, String(used + 1))
}

// ─── Types leaderboard ────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  isCurrentUser: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

type Tab = 'circle' | 'game'

export default function AppPage() {
  const [identity, setIdentity]         = useState<ClientIdentity | null>(null)
  const [loyalty, setLoyalty]           = useState<LoyaltyData | null>(null)
  const [leaderboard, setLeaderboard]   = useState<LeaderboardEntry[]>([])
  const [loadingLoyalty, setLoadingLoyalty] = useState(false)
  const [tab, setTab]                   = useState<Tab>('circle')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [form, setForm]                 = useState({ name: '', phone: '', favoriteLocal: '' })
  const [tokensLeft, setTokensLeft]     = useState(3)

  // ── Fetch loyalty from Supabase ──────────────────────────────────────────────
  const fetchLoyalty = useCallback(async (phone: string, businessId: string) => {
    setLoadingLoyalty(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('loyalty_points')
        .select('points_current, points_total_historical, tier, total_visits')
        .eq('customer_phone', phone)
        .eq('business_id', businessId)
        .maybeSingle()

      if (data) {
        setLoyalty({
          points:         data.points_current ?? 0,
          tier:           (data.tier as LoyaltyData['tier']) ?? 'bronze',
          totalVisits:    data.total_visits ?? 0,
          nextTierPoints: data.tier === 'gold' ? 5000 : data.tier === 'silver' ? 5000 : 1000,
        })
      } else {
        // Usuario nuevo — sin registro aún
        setLoyalty({ points: 0, tier: 'bronze', totalVisits: 0, nextTierPoints: 1000 })
      }
    } catch {
      setLoyalty({ points: 0, tier: 'bronze', totalVisits: 0, nextTierPoints: 1000 })
    } finally {
      setLoadingLoyalty(false)
    }
  }, [])

  // ── Fetch leaderboard from API ───────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async (businessId: string, phone: string) => {
    try {
      const res = await fetch(
        `/api/game/score?business_id=${businessId}&week_start=${getWeekStart()}`
      )
      if (!res.ok) return
      const json = await res.json()
      const entries: LeaderboardEntry[] = (json.leaderboard ?? []).map(
        (row: { rank: number; name: string; score: number; phone_hint: string }) => ({
          rank:        row.rank,
          name:        row.name,
          score:       row.score,
          isCurrentUser: phone.slice(-4) === row.phone_hint,
        })
      )
      setLeaderboard(entries)
    } catch { /* silencioso */ }
  }, [])

  // ── Load identity → trigger fetches ─────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('rishtedar_client')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ClientIdentity
        setIdentity(parsed)
        setTokensLeft(getTokensLeft(parsed.phone, parsed.favoriteLocal || 'providencia'))
        fetchLoyalty(parsed.phone, parsed.favoriteLocal || 'providencia')
        fetchLeaderboard(parsed.favoriteLocal || 'providencia', parsed.phone)
      } catch { /* noop */ }
    }
  }, [fetchLoyalty, fetchLeaderboard])

  // ── Save identity + upsert en loyalty_points ────────────────────────────────
  async function saveIdentity() {
    if (!form.name || !form.phone) return
    const id: ClientIdentity = {
      name: form.name,
      phone: form.phone,
      favoriteLocal: form.favoriteLocal || 'providencia',
    }
    localStorage.setItem('rishtedar_client', JSON.stringify(id))

    // Upsert: crea el registro si no existe, no sobreescribe puntos si ya existe
    try {
      const supabase = createClient()
      await supabase.from('loyalty_points').upsert(
        {
          customer_phone: id.phone,
          customer_name:  id.name,
          business_id:    id.favoriteLocal,
          tier:           'bronze',
        },
        { onConflict: 'customer_phone,business_id', ignoreDuplicates: true }
      )
    } catch { /* silencioso — igual se guarda localmente */ }

    setIdentity(id)
    setTokensLeft(getTokensLeft(id.phone, id.favoriteLocal))
    setShowOnboarding(false)
    fetchLoyalty(id.phone, id.favoriteLocal)
    fetchLeaderboard(id.favoriteLocal, id.phone)
  }

  // ── Game end → post score + refresh leaderboard ──────────────────────────────
  function handleGameEnd(score: number, counted: boolean) {
    if (!identity || !counted) return
    useToken(identity.phone, identity.favoriteLocal)
    setTokensLeft(prev => Math.max(0, prev - 1))
    fetch('/api/game/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_phone: identity.phone,
        customer_name:  identity.name,
        business_id:    identity.favoriteLocal,
        score,
        is_ranked:  true,
        week_start: getWeekStart(),
      }),
    })
      .then(() => fetchLeaderboard(identity.favoriteLocal, identity.phone))
      .catch(() => {})
  }

  const resolvedLoyalty = loyalty ?? { points: 0, tier: 'bronze' as const, totalVisits: 0, nextTierPoints: 1000 }
  const tier    = getTier(resolvedLoyalty.points)
  const tierCfg = TIER_CONFIG[tier]
  const TierIcon = tierCfg.icon
  const progress = tierCfg.next ? Math.round((resolvedLoyalty.points / tierCfg.next) * 100) : 100

  // ── Not identified ─────────────────────────────────────────────────────────
  if (!identity && !showOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center mb-5">
          <UtensilsCrossed size={20} className="text-gold-400" />
        </div>
        <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-2">Rishtedar</p>
        <h1 className="font-display text-4xl italic text-ivory mb-3">Bienvenido</h1>
        <p className="text-warm-400 text-sm leading-relaxed max-w-xs mb-8">
          Acumula puntos, sigue tus pedidos y compite en el ranking semanal.
        </p>
        <button
          onClick={() => setShowOnboarding(true)}
          className="bg-gold-600 hover:bg-gold-500 text-warm-950 px-10 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
        >
          Activar mi Circle
        </button>
        <Link href="/order" className="mt-4 text-warm-600 hover:text-warm-400 text-sm transition-colors flex items-center gap-1.5">
          <ShoppingBag size={13} />
          Pedir sin registro
        </Link>
      </div>
    )
  }

  // ── Onboarding form ────────────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-1">Rishtedar Circle</p>
          <h2 className="font-display text-4xl italic text-ivory mb-6">Únete gratis</h2>
          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              className="w-full bg-warm-900 border border-warm-700 text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors"
            />
            <input
              type="tel"
              placeholder="+56 9 XXXX XXXX"
              value={form.phone}
              onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
              className="w-full bg-warm-900 border border-warm-700 text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors"
            />
            <select
              value={form.favoriteLocal}
              onChange={e => setForm(v => ({ ...v, favoriteLocal: e.target.value }))}
              className="w-full bg-warm-900 border border-warm-700 text-warm-400 text-sm px-4 py-3 focus:outline-none focus:border-gold-600 transition-colors"
            >
              <option value="">Local favorito</option>
              <option value="providencia">Providencia</option>
              <option value="vitacura">Vitacura</option>
              <option value="la-reina">La Reina</option>
              <option value="la-dehesa">La Dehesa</option>
            </select>
          </div>
          <button
            onClick={saveIdentity}
            disabled={!form.name || !form.phone}
            className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-40 text-warm-950 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
          >
            Activar Circle →
          </button>
          <p className="text-warm-600 text-[10px] text-center mt-3">
            Gratis · Solo usamos tus datos para acumular puntos
          </p>
        </div>
      </div>
    )
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen max-w-sm mx-auto">

      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-warm-500 text-[10px] tracking-widest uppercase">Rishtedar Circle</p>
          <h1 className="font-display text-2xl italic text-ivory leading-tight">
            Hola, {identity!.name.split(' ')[0]}
          </h1>
        </div>
        <Link
          href="/order"
          className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-ivory text-xs px-4 py-2.5 tracking-wider uppercase font-medium transition-colors"
        >
          <ShoppingBag size={12} />
          Pedir
        </Link>
      </div>

      {/* Tier card */}
      <div className="px-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative border p-5 overflow-hidden"
          style={{ borderColor: `${tierCfg.color}40`, background: 'linear-gradient(135deg, #1a1200 0%, #0d0d0d 70%)' }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{ background: `radial-gradient(ellipse at 80% 0%, ${tierCfg.color} 0%, transparent 60%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${tierCfg.color}, transparent)` }} />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TierIcon size={16} style={{ color: tierCfg.color }} />
                <span className="font-display text-xl italic" style={{ color: tierCfg.color }}>
                  {tierCfg.label}
                </span>
              </div>
              <span className="text-warm-500 text-xs">
                {loadingLoyalty
                  ? <Loader2 size={12} className="animate-spin inline" />
                  : `${resolvedLoyalty.totalVisits} visitas`
                }
              </span>
            </div>

            <p className="font-display text-4xl italic text-ivory mb-1">
              {loadingLoyalty
                ? <span className="text-warm-700">···</span>
                : resolvedLoyalty.points.toLocaleString('es-CL')
              }
              <span className="text-warm-600 text-lg ml-1">pts</span>
            </p>

            {tierCfg.next && (
              <>
                <p className="text-warm-600 text-xs mb-2">
                  {(tierCfg.next - resolvedLoyalty.points).toLocaleString('es-CL')} pts para {
                    tier === 'bronze' ? 'Silver' : 'Gold'
                  }
                </p>
                <div className="h-1 bg-warm-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${tierCfg.color}80, ${tierCfg.color})` }}
                  />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex border border-warm-800">
          {([
            { key: 'circle', label: 'Mi Circle', icon: Crown },
            { key: 'game',   label: 'El Festín', icon: Gamepad2 },
          ] as const).map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs tracking-wider uppercase font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-warm-800 text-ivory'
                    : 'text-warm-600 hover:text-warm-400'
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'circle' && (
          <motion.div key="circle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Reward */}
            <div className="px-4 mb-3">
              <div className="border border-gold-700/40 bg-gold-900/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gold-900/40 border border-gold-700/40 flex items-center justify-center shrink-0">
                    <Gift size={14} className="text-gold-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-0.5">Recompensa activa</p>
                    <p className="text-ivory text-sm font-medium">1 postre gratis</p>
                    <p className="text-warm-500 text-xs mt-0.5">Válido en cualquier local · Presenta tu QR</p>
                  </div>
                  <p className="text-gold-400 text-xs shrink-0">15 días</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="px-4 space-y-2 mb-6">
              <Link
                href="/order"
                className="flex items-center justify-between p-4 border border-warm-800 bg-warm-900/30 hover:bg-warm-900/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={15} className="text-brand-400" />
                  <div>
                    <p className="text-ivory text-sm">Hacer un pedido</p>
                    <p className="text-warm-600 text-xs">+150 pts + fichas de juego</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-warm-700" />
              </Link>

              <Link
                href="/reservar"
                className="flex items-center justify-between p-4 border border-warm-800 bg-warm-900/30 hover:bg-warm-900/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-gold-500" />
                  <div>
                    <p className="text-ivory text-sm">Reservar mesa</p>
                    <p className="text-warm-600 text-xs">+100 pts por reserva confirmada</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-warm-700" />
              </Link>

              <div className="p-4 border border-warm-800 bg-warm-900/30">
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-brand-500" />
                  <div>
                    <p className="text-warm-500 text-xs uppercase tracking-wider mb-0.5">Local favorito</p>
                    <p className="text-ivory text-sm capitalize">{identity!.favoriteLocal.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* Game — primero, más visible */}
            <div className="px-4 pt-2 pb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-0.5">Minijuego semanal</p>
                  <p className="font-display text-xl italic text-ivory">El Festín</p>
                </div>
                <div className="text-right">
                  <p className="text-warm-500 text-[10px] uppercase tracking-wider mb-0.5">Intentos rankeados</p>
                  <p className="text-ivory text-sm font-medium">{tokensLeft} / 3</p>
                </div>
              </div>
              <p className="text-warm-600 text-xs mb-4">
                Atrapa los platos indios, evita las verduras. Los 3 mejores scores de la semana ganan premios.
              </p>
              <RishtedarGame
                onGameEnd={handleGameEnd}
                tokensLeft={tokensLeft}
              />
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-warm-800 mb-2" />

            {/* Leaderboard — debajo del juego */}
            <GameLeaderboard
              scores={leaderboard}
              businessName={identity!.favoriteLocal.replace('-', ' ')}
              weekLabel={`Semana del ${getWeekStart()}`}
            />

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
