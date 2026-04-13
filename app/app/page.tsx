'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Crown, Gamepad2, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getWeekStart } from '@/lib/services/gameService'
import { WelcomeScreen } from '@/components/app/WelcomeScreen'
import { IdentityForm }  from '@/components/app/IdentityForm'
import { TierCard }      from '@/components/app/TierCard'
import { CircleTab }     from '@/components/app/CircleTab'
import { GameTab }       from '@/components/app/GameTab'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientIdentity {
  name:          string
  phone:         string
  favoriteLocal: string
}

interface LoyaltyData {
  points:      number
  tier:        'bronze' | 'silver' | 'gold'
  totalVisits: number
}

interface LeaderboardEntry {
  rank:          number
  name:          string
  score:         number
  isCurrentUser: boolean
}

type Tab = 'circle' | 'game'

// ─── Game token helpers (localStorage UI only — server enforces the real limit) ───

function getTokensLeft(phone: string, businessId: string): number {
  const key  = `game_tokens_${businessId}_${phone}_${getWeekStart()}`
  const used = parseInt(localStorage.getItem(key) || '0', 10)
  return Math.max(0, 3 - used)
}

function consumeToken(phone: string, businessId: string) {
  const key  = `game_tokens_${businessId}_${phone}_${getWeekStart()}`
  const used = parseInt(localStorage.getItem(key) || '0', 10)
  localStorage.setItem(key, String(used + 1))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppPage() {
  const [identity,       setIdentity]       = useState<ClientIdentity | null>(null)
  const [loyalty,        setLoyalty]        = useState<LoyaltyData | null>(null)
  const [leaderboard,    setLeaderboard]    = useState<LeaderboardEntry[]>([])
  const [loadingLoyalty, setLoadingLoyalty] = useState(false)
  const [tab,            setTab]            = useState<Tab>('circle')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [form,           setForm]           = useState({ name: '', phone: '', favoriteLocal: '' })
  const [tokensLeft,     setTokensLeft]     = useState(3)

  // ── Fetch loyalty ────────────────────────────────────────────────────────────
  const fetchLoyalty = useCallback(async (phone: string, businessId: string) => {
    setLoadingLoyalty(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('loyalty_points')
        .select('points_current, tier, total_visits')
        .eq('customer_phone', phone)
        .eq('business_id', businessId)
        .maybeSingle()

      setLoyalty(data
        ? {
            points:      data.points_current ?? 0,
            tier:        (data.tier ?? 'bronze') as LoyaltyData['tier'],
            totalVisits: data.total_visits    ?? 0,
          }
        : { points: 0, tier: 'bronze', totalVisits: 0 }
      )
    } catch {
      setLoyalty({ points: 0, tier: 'bronze', totalVisits: 0 })
    } finally {
      setLoadingLoyalty(false)
    }
  }, [])

  // ── Fetch leaderboard ────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async (businessId: string, phone: string) => {
    try {
      const res  = await fetch(`/api/game/score?business_id=${businessId}&week_start=${getWeekStart()}`)
      if (!res.ok) return
      const json = await res.json()
      setLeaderboard(
        (json.leaderboard ?? []).map(
          (row: { rank: number; name: string; score: number; phone_hint: string }) => ({
            rank:          row.rank,
            name:          row.name,
            score:         row.score,
            isCurrentUser: phone.slice(-4) === row.phone_hint,
          })
        )
      )
    } catch { /* silent */ }
  }, [])

  // ── Load identity on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('rishtedar_client')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as ClientIdentity
      const local  = parsed.favoriteLocal || 'providencia'
      setIdentity(parsed)
      setTokensLeft(getTokensLeft(parsed.phone, local))
      fetchLoyalty(parsed.phone, local)
      fetchLeaderboard(local, parsed.phone)
    } catch { /* noop */ }
  }, [fetchLoyalty, fetchLeaderboard])

  // ── Save identity ────────────────────────────────────────────────────────────
  async function saveIdentity() {
    if (!form.name || !form.phone) return
    const id: ClientIdentity = {
      name:          form.name,
      phone:         form.phone,
      favoriteLocal: form.favoriteLocal || 'providencia',
    }
    localStorage.setItem('rishtedar_client', JSON.stringify(id))

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
    } catch { /* silent — saved locally either way */ }

    setIdentity(id)
    setTokensLeft(getTokensLeft(id.phone, id.favoriteLocal))
    setShowOnboarding(false)
    fetchLoyalty(id.phone, id.favoriteLocal)
    fetchLeaderboard(id.favoriteLocal, id.phone)
  }

  // ── Game end ─────────────────────────────────────────────────────────────────
  function handleGameEnd(score: number, counted: boolean) {
    if (!identity || !counted) return
    consumeToken(identity.phone, identity.favoriteLocal)
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

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!identity && !showOnboarding) {
    return <WelcomeScreen onActivate={() => setShowOnboarding(true)} />
  }

  if (showOnboarding) {
    return <IdentityForm form={form} onChange={setForm} onSubmit={saveIdentity} />
  }

  const resolvedLoyalty = loyalty ?? { points: 0, tier: 'bronze' as const, totalVisits: 0 }

  return (
    <div className="min-h-screen max-w-sm mx-auto">

      {/* Back to site — visible on web, unobtrusive in PWA */}
      <div className="px-4 pt-4 pb-0">
        <Link href="/" className="inline-flex items-center gap-1 text-warm-700 hover:text-warm-400 text-[10px] tracking-wider uppercase transition-colors">
          ← Rishtedar.cl
        </Link>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-center justify-between">
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
        <TierCard
          points={resolvedLoyalty.points}
          tier={resolvedLoyalty.tier}
          totalVisits={resolvedLoyalty.totalVisits}
          loading={loadingLoyalty}
        />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex border border-warm-800">
          {([
            { key: 'circle', label: 'Mi Circle', icon: Crown    },
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
            <CircleTab identity={identity!} />
          </motion.div>
        )}
        {tab === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameTab
              identity={identity!}
              tokensLeft={tokensLeft}
              leaderboard={leaderboard}
              onGameEnd={handleGameEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
