'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gamepad2, X } from 'lucide-react'
import { OrderTracker } from '@/components/pwa/OrderTracker'
import { RishtedarGame } from '@/components/pwa/RishtedarGame'
import { getWeekStart } from '@/lib/services/gameService'

type ClientStatus = 'preparing' | 'on_the_way' | 'delivered'

interface Order {
  id: string
  order_number: string
  status: string
  final_price: number
  items: string[]
  estimated_delivery_at: string | null
  business_id: string
}

interface ClientIdentity {
  name: string
  phone: string
}

// Map internal status → client status visible
function toClientStatus(status: string): ClientStatus {
  if (status === 'completed') return 'delivered'
  if (status === 'ready') return 'on_the_way'
  return 'preparing'
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [clientStatus, setClientStatus] = useState<ClientStatus>('preparing')
  const [loading, setLoading] = useState(true)
  const [showGame, setShowGame] = useState(false)
  const [tokensLeft, setTokensLeft] = useState(0)
  const [identity, setIdentity] = useState<ClientIdentity | null>(null)

  useEffect(() => {
    try {
      setIdentity(JSON.parse(localStorage.getItem('rishtedar_client') || 'null'))
    } catch {
      setIdentity(null)
    }
  }, [])

  const fetchCredits = useCallback(async (phone: string, businessId: string) => {
    try {
      const params = new URLSearchParams({
        customer_phone: phone,
        business_id: businessId,
        week_start: getWeekStart(),
      })
      const res = await fetch(`/api/game/credits?${params.toString()}`)
      if (!res.ok) {
        setTokensLeft(0)
        return
      }
      const json = await res.json()
      setTokensLeft(Math.max(0, Number(json.credits_available ?? 0)))
    } catch {
      setTokensLeft(0)
    }
  }, [])

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) return
      const data = await res.json()
      setOrder(data)
      setClientStatus(toClientStatus(data.status))
      if (identity?.phone) fetchCredits(identity.phone, data.business_id)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [fetchCredits, identity?.phone, orderId])

  useEffect(() => {
    fetchOrder()
    // Poll every 15s (Realtime would replace this once Supabase is connected)
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  const handleGameEnd = useCallback(async (score: number, counted: boolean) => {
    if (counted && order && identity?.phone) {
      const res = await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: identity.phone,
          customer_name: identity.name,
          business_id: order?.business_id,
          score,
          week_start: getWeekStart(),
        }),
      }).catch(() => null)

      if (!res?.ok) {
        if (res?.status === 402) setTokensLeft(0)
        return
      }

      const json = await res.json().catch(() => ({}))
      if (json.credits_remaining !== undefined) {
        setTokensLeft(Math.max(0, Number(json.credits_remaining)))
      } else {
        fetchCredits(identity.phone, order.business_id)
      }
    }
  }, [fetchCredits, identity, order])

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-warm-500 text-sm mb-4">Pedido no encontrado.</p>
        <Link href="/app" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">
          ← Volver
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-950 max-w-sm mx-auto">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-warm-950/95 backdrop-blur-sm border-b border-warm-800 px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-1.5 text-warm-500 hover:text-warm-300 transition-colors text-sm">
          <ArrowLeft size={14} />
          Mi cuenta
        </Link>
        {clientStatus !== 'delivered' && (
          <button
            onClick={() => setShowGame(v => !v)}
            className="flex items-center gap-1.5 text-warm-400 hover:text-gold-400 transition-colors text-xs"
          >
            <Gamepad2 size={14} />
            Jugar mientras esperas
          </button>
        )}
      </div>

      {/* Tracking */}
      <AnimatePresence mode="wait">
        {!showGame ? (
          <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OrderTracker
              orderNumber={order.order_number}
              status={clientStatus}
              estimatedTime={clientStatus === 'preparing' ? '20–30 min' : clientStatus === 'on_the_way' ? '10–15 min' : undefined}
              items={order.items}
              total={order.final_price}
            />

            {/* CTA to game */}
            {clientStatus === 'preparing' && (
              <div className="px-4 pb-6">
                <button
                  onClick={() => setShowGame(true)}
                  className="w-full border border-warm-800 hover:border-gold-700 bg-warm-900/40 hover:bg-warm-900 p-4 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎮</span>
                    <div>
                      <p className="text-ivory text-sm font-medium group-hover:text-gold-400 transition-colors">
                        Juega mientras esperas
                      </p>
                      <p className="text-warm-500 text-xs mt-0.5">
                        Ranking semanal · {tokensLeft} ficha{tokensLeft !== 1 ? 's' : ''} para publicar
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-warm-500 text-xs">
                {clientStatus === 'preparing' ? '⏳ Tu pedido se está preparando...' : '🛵 Tu pedido va en camino'}
              </p>
              <button
                onClick={() => setShowGame(false)}
                className="text-warm-600 hover:text-warm-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <RishtedarGame
              onGameEnd={handleGameEnd}
              tokensLeft={tokensLeft}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
