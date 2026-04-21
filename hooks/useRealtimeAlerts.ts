'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertType = 'order' | 'reservation' | 'delivery'

export interface DashboardAlert {
  id:    string
  type:  AlertType
  title: string
  body:  string
  at:    number
}

// ─── Web Audio tone synthesis ─────────────────────────────────────────────────
// No audio files — tones generated via Web Audio API.

const TONE_CONFIG: Record<AlertType, { freqs: number[]; step: number; gain: number }> = {
  order:       { freqs: [523, 659, 784], step: 0.16, gain: 0.45 }, // C5→E5→G5 urgente
  reservation: { freqs: [784, 659],      step: 0.22, gain: 0.32 }, // G5→E5 suave
  delivery:    { freqs: [440],           step: 0.18, gain: 0.25 }, // A4 informativo
}

function synthesizeTone(ctx: AudioContext, type: AlertType) {
  const { freqs, step, gain } = TONE_CONFIG[type]
  let t = ctx.currentTime + 0.01
  freqs.forEach(freq => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.connect(env)
    env.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    env.gain.setValueAtTime(gain, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + step)
    osc.start(t)
    osc.stop(t + step + 0.05)
    t += step * 0.85
  })
}

const STORAGE_KEY = 'rishtedar_dashboard_sound'

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRealtimeAlerts(businessId: string | null) {
  const [alerts, setAlerts]           = useState<DashboardAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const audioCtxRef                   = useRef<AudioContext | null>(null)

  // Restaurar preferencia guardada
  useEffect(() => {
    setSoundEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))

      // Inicializar/resumir AudioContext en el gesto del usuario
      if (next) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume()
        }
        // Tono de confirmación al activar
        try { synthesizeTone(audioCtxRef.current, 'reservation') } catch { /* silent */ }
      }

      return next
    })
  }, [])

  const playSound = useCallback((type: AlertType) => {
    if (!soundEnabled || !audioCtxRef.current) return
    try { synthesizeTone(audioCtxRef.current, type) } catch { /* silent */ }
  }, [soundEnabled])

  const pushAlert = useCallback((alert: Omit<DashboardAlert, 'id' | 'at'>) => {
    const id = crypto.randomUUID()
    setAlerts(prev => [...prev.slice(-4), { ...alert, id, at: Date.now() }])
    playSound(alert.type)
  }, [playSound])

  const dismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // ── Supabase Realtime subscriptions ───────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const isAdmin  = !businessId || businessId === 'admin'

    const channel = supabase.channel('dashboard-alerts', {
      config: { broadcast: { self: false } },
    })

    // ── Nuevas órdenes ───────────────────────────────────────────────────────
    const orderFilter: { event: 'INSERT'; schema: string; table: string; filter?: string } = {
      event: 'INSERT', schema: 'public', table: 'orders',
    }
    if (!isAdmin) orderFilter.filter = `business_id=eq.${businessId}`

    channel.on('postgres_changes', orderFilter, (payload) => {
      const row = payload.new as Record<string, unknown>
      const typeLabel: Record<string, string> = {
        delivery: '🛵 Delivery', dine_in: '🪑 Local', takeaway: '📦 Retiro',
      }
      const tipo = typeLabel[(row.order_type as string) ?? ''] ?? '📋 Pedido'
      pushAlert({
        type:  'order',
        title: 'Nuevo pedido',
        body:  `${row.customer_name ?? 'Cliente'} · ${tipo} · $${Number(row.final_price ?? 0).toLocaleString('es-CL')}`,
      })
    })

    // ── Nuevas reservas ──────────────────────────────────────────────────────
    const reservationFilter: { event: 'INSERT'; schema: string; table: string; filter?: string } = {
      event: 'INSERT', schema: 'public', table: 'reservations',
    }
    if (!isAdmin) reservationFilter.filter = `business_id=eq.${businessId}`

    channel.on('postgres_changes', reservationFilter, (payload) => {
      const row = payload.new as Record<string, unknown>
      pushAlert({
        type:  'reservation',
        title: 'Nueva reserva',
        body:  `${row.customer_name ?? 'Cliente'} · ${row.party_size ?? '?'} pax · ${row.time_slot ?? ''}`,
      })
    })

    // ── Actualizaciones de delivery ──────────────────────────────────────────
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_tracking' }, (payload) => {
      const row = payload.new as Record<string, unknown>
      const statusLabel: Record<string, string> = {
        pickup:     'Recogido en local',
        in_transit: 'En camino',
        delivered:  '✓ Entregado',
      }
      const label = statusLabel[row.status as string]
      if (!label) return // ignorar 'assigned' (lo seteamos nosotros)
      pushAlert({
        type:  'delivery',
        title: 'Delivery actualizado',
        body:  `${row.driver_name ?? 'Driver'} → ${label}`,
      })
    })

    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [businessId, pushAlert])

  return { alerts, dismiss, soundEnabled, toggleSound }
}
