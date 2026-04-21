'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, Loader2, Phone, MessageCircle, Clock,
  Users, CheckCircle2, XCircle, MapPin, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateBranchToken, BRANCH_TOKENS } from '@/lib/staff-tokens'
import type { Reservation, ReservationStatus } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReservationDisplay extends Reservation {
  timeFormatted?: string
  statusLabel?: string
}

type StatusBadgeColor = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'no_show'

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; color: StatusBadgeColor; nextStatus: ReservationStatus | null; nextLabel: string }
> = {
  pending: {
    label: 'Pendiente',
    color: 'pending',
    nextStatus: 'confirmed',
    nextLabel: 'Confirmó',
  },
  confirmed: {
    label: 'Confirmada',
    color: 'confirmed',
    nextStatus: 'checked_in',
    nextLabel: 'Llegó',
  },
  checked_in: {
    label: 'Se sentó',
    color: 'checked_in',
    nextStatus: 'completed',
    nextLabel: 'Completada',
  },
  completed: {
    label: 'Completada',
    color: 'completed',
    nextStatus: null,
    nextLabel: '✓',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'no_show',
    nextStatus: null,
    nextLabel: 'Cancelada',
  },
  no_show: {
    label: 'No show',
    color: 'no_show',
    nextStatus: null,
    nextLabel: 'No show',
  },
}

const STATUS_COLORS: Record<
  StatusBadgeColor,
  { bg: string; border: string; text: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/50',
    text: 'text-amber-400',
    icon: Clock,
  },
  confirmed: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/50',
    text: 'text-blue-400',
    icon: CheckCircle2,
  },
  checked_in: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/50',
    text: 'text-emerald-400',
    icon: Users,
  },
  completed: {
    bg: 'bg-green-950/40',
    border: 'border-green-800/50',
    text: 'text-green-400',
    icon: CheckCircle2,
  },
  no_show: {
    bg: 'bg-red-950/40',
    border: 'border-red-800/50',
    text: 'text-red-400',
    icon: XCircle,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReservationStaffPage({
  params,
}: {
  params: Promise<{ branch: string; token: string }>
}) {
  const [branch, setBranch] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationDisplay[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [today, setToday] = useState<string>('')
  const [todayFormatted, setTodayFormatted] = useState<string>('')

  // ── Inicializar fecha (una sola vez) ──────────────────────────────────────
  useEffect(() => {
    const now = new Date()
    setToday(now.toISOString().split('T')[0])
    setTodayFormatted(
      now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }, [])

  // ── Resolve params ─────────────────────────────────────────────────────────
  useEffect(() => {
    params.then((p) => {
      setBranch(p.branch)
      setToken(p.token)
    })
  }, [params])

  // ── Validar token y cargar reservas ────────────────────────────────────────
  const fetchReservations = useCallback(
    async (branchParam: string, tokenParam: string, todayParam: string) => {
      if (!todayParam) return
      setLoading(true)
      setError(null)

      try {
        // Validar token localmente primero
        if (!validateBranchToken(branchParam, tokenParam)) {
          setError('Token inválido para esta sucursal')
          return
        }

        const res = await fetch(
          `/api/reservations/branch/${branchParam}/${todayParam}?token=${encodeURIComponent(tokenParam)}`
        )

        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? 'Error al cargar reservas')
          return
        }

        const data = (await res.json()) as Reservation[]
        const withFormatted = data.map((r) => ({
          ...r,
          timeFormatted: r.reservation_time.substring(0, 5),
          statusLabel: STATUS_CONFIG[r.status].label,
        }))

        setReservations(withFormatted)
      } catch (err) {
        console.error('[ReservationStaffPage]', err)
        setError('Error al cargar las reservas')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (branch && token && today) {
      fetchReservations(branch, token, today)
    }
  }, [branch, token, today, fetchReservations])

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!branch || !today) return

    const supabase = createClient()

    const channel = supabase
      .channel(`reservations:${branch}:${today}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `business_id=eq.${branch}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Reservation
            // Solo actualizar si es del día de hoy
            if (updated.reservation_date === today) {
              setReservations((prev) =>
                prev.map((r) =>
                  r.id === updated.id
                    ? {
                        ...updated,
                        timeFormatted: updated.reservation_time.substring(0, 5),
                        statusLabel: STATUS_CONFIG[updated.status].label,
                      }
                    : r
                )
              )
            }
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as Reservation
            if (inserted.reservation_date === today && inserted.business_id === branch) {
              setReservations((prev) => [
                ...prev,
                {
                  ...inserted,
                  timeFormatted: inserted.reservation_time.substring(0, 5),
                  statusLabel: STATUS_CONFIG[inserted.status].label,
                },
              ])
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [branch, today])

  // ── Update reservation status ──────────────────────────────────────────────
  const updateStatus = useCallback(
    async (reservationId: string, newStatus: ReservationStatus) => {
      setUpdating(reservationId)

      try {
        const res = await fetch('/api/reservations/update-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: reservationId,
            status: newStatus,
            token,
            branch,
          }),
        })

        if (!res.ok) throw new Error('Error al actualizar estado')

        // Actualizar localmente (Realtime se encargará de sincronizar)
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  status: newStatus,
                  statusLabel: STATUS_CONFIG[newStatus].label,
                  check_in_time: newStatus === 'checked_in' ? new Date().toISOString() : r.check_in_time,
                }
              : r
          )
        )
      } catch (err) {
        console.error('[updateStatus]', err)
        // No mostrar error, solo fallar silenciosamente
      } finally {
        setUpdating(null)
      }
    },
    [token, branch]
  )

  // ── Computed values ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = reservations.length
    const confirmed = reservations.filter((r) => r.status === 'confirmed').length
    const checkedIn = reservations.filter((r) => r.status === 'checked_in').length
    const completed = reservations.filter((r) => r.status === 'completed').length

    return { total, confirmed, checkedIn, completed }
  }, [reservations])

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (filter === 'active') return r.status !== 'completed' && r.status !== 'cancelled'
      if (filter === 'completed') return r.status === 'completed'
      return true
    })
  }, [reservations, filter])

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <Loader2 size={28} className="text-warm-600 animate-spin" />
      </div>
    )
  }

  // ── Render: Error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h1 className="font-display text-2xl italic text-ivory mb-2">Acceso inválido</h1>
        <p className="text-warm-500 text-sm">{error}</p>
      </div>
    )
  }

  // ── Render: Active ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-warm-950 text-ivory pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-warm-800 sticky top-0 bg-warm-950/95 backdrop-blur-sm z-10">
        <p className="text-warm-500 text-[10px] tracking-[0.25em] uppercase mb-1">Rishtedar · Reservas</p>
        <h1 className="font-display text-2xl italic text-ivory leading-tight capitalize">{branch}</h1>
        <p className="text-warm-600 text-xs mt-0.5 capitalize">{todayFormatted}</p>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-warm-900/60 border border-warm-800 p-3">
            <p className="text-warm-600 text-[9px] tracking-wider uppercase mb-1">Total</p>
            <p className="text-2xl font-semibold text-ivory">{kpis.total}</p>
          </div>
          <div className="bg-blue-950/30 border border-blue-800/50 p-3">
            <p className="text-blue-600 text-[9px] tracking-wider uppercase mb-1">Confirmadas</p>
            <p className="text-2xl font-semibold text-blue-300">{kpis.confirmed}</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/50 p-3">
            <p className="text-emerald-600 text-[9px] tracking-wider uppercase mb-1">Se sentaron</p>
            <p className="text-2xl font-semibold text-emerald-300">{kpis.checkedIn}</p>
          </div>
          <div className="bg-green-950/30 border border-green-800/50 p-3">
            <p className="text-green-600 text-[9px] tracking-wider uppercase mb-1">Completadas</p>
            <p className="text-2xl font-semibold text-green-300">{kpis.completed}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                filter === f
                  ? 'bg-brand-700 text-ivory'
                  : 'bg-warm-900 border border-warm-800 text-warm-400 hover:bg-warm-800'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Completadas'}
            </button>
          ))}
        </div>

        {/* Reservations grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((reservation) => {
                const config = STATUS_CONFIG[reservation.status]
                const colorConfig = STATUS_COLORS[config.color]
                const Icon = colorConfig.icon

                return (
                  <motion.div
                    key={reservation.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-warm-900 border border-warm-800 rounded overflow-hidden"
                  >
                    {/* Card header: Time + Name + Status */}
                    <div className="p-4 border-b border-warm-800/50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-2xl font-semibold text-ivory">{reservation.timeFormatted}</p>
                          <p className="text-warm-400 text-sm mt-0.5">{reservation.customer_name}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded ${colorConfig.bg} border ${colorConfig.border}`}
                        >
                          <Icon size={12} className={colorConfig.text} />
                          <span className={`text-xs font-medium ${colorConfig.text}`}>{config.label}</span>
                        </div>
                      </div>

                      {/* Party size + phone */}
                      <div className="flex items-center gap-2 text-warm-500 text-sm">
                        <Users size={14} />
                        <span>{reservation.party_size} persona{reservation.party_size !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Card body: Special requests + contact buttons */}
                    {(reservation.special_requests || reservation.table_preference) && (
                      <div className="px-4 py-3 bg-warm-900/50 border-b border-warm-800/50">
                        {reservation.table_preference && (
                          <p className="text-warm-400 text-xs mb-1">
                            <span className="text-warm-600">Mesa:</span> {reservation.table_preference}
                          </p>
                        )}
                        {reservation.special_requests && (
                          <p className="text-amber-500 text-xs">
                            <span className="text-amber-600">Notas:</span> {reservation.special_requests}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contact buttons */}
                    <div className="px-4 py-3 flex gap-2 border-b border-warm-800/50">
                      <a
                        href={`tel:${reservation.customer_phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-warm-800 hover:bg-warm-700 text-ivory text-xs py-2 rounded transition-colors"
                      >
                        <Phone size={13} />
                        Llamar
                      </a>
                      <a
                        href={`https://wa.me/${reservation.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-900/40 border border-emerald-800/50 hover:bg-emerald-900/60 text-emerald-300 text-xs py-2 rounded transition-colors"
                      >
                        <MessageCircle size={13} />
                        WhatsApp
                      </a>
                    </div>

                    {/* Action button for next state */}
                    {config.nextStatus && (
                      <button
                        onClick={() => updateStatus(reservation.id, config.nextStatus as ReservationStatus)}
                        disabled={updating === reservation.id}
                        className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-60 text-ivory py-3 text-sm font-medium transition-colors"
                      >
                        {updating === reservation.id ? (
                          <><Loader2 size={14} className="animate-spin" /> Actualizando...</>
                        ) : (
                          <>{config.nextLabel} <ChevronRight size={14} /></>
                        )}
                      </button>
                    )}

                    {/* No show option */}
                    {reservation.status !== 'no_show' && reservation.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(reservation.id, 'no_show')}
                        disabled={updating === reservation.id}
                        className="w-full text-red-400 hover:text-red-300 text-xs py-2 border-t border-warm-800/50 transition-colors disabled:opacity-60"
                      >
                        Marcar como no show
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-600 text-sm">No hay reservas activas</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
