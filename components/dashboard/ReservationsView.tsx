'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CalendarCheck, Users, CheckCircle2, XCircle, Phone,
  Copy, Check, Link2, ChevronDown, MessageCircle,
} from 'lucide-react'
import type { ReservationStatus } from '@/types'
import { LOCATIONS } from '@/lib/locations'
import {
  getTodayReservations,
  getUpcomingReservations,
  updateReservationStatus,
  type DashboardReservation,
  type UpcomingReservation,
} from '@/lib/services/reservationService'
import { BRANCH_TOKENS } from '@/lib/staff-tokens'
import type { BranchOption } from './BranchLogin'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:    'text-amber-700 bg-amber-50 border-amber-200',
  confirmed:  'text-blue-700 bg-blue-50 border-blue-200',
  checked_in: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  completed:  'text-warm-500 bg-warm-100 border-warm-200',
  cancelled:  'text-red-600 bg-red-50 border-red-100',
  no_show:    'text-red-700 bg-red-100 border-red-200',
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending:    'Pendiente',
  confirmed:  'Confirmado',
  checked_in: '✓ Llegó',
  completed:  'Completado',
  cancelled:  'Cancelado',
  no_show:    'No llegó',
}

// Siguiente estado lógico por cada estado
const NEXT_ACTION: Partial<Record<ReservationStatus, { status: ReservationStatus; label: string; color: string }>> = {
  pending:    { status: 'confirmed',  label: 'Confirmar',   color: 'text-blue-700 border-blue-200 hover:bg-blue-50' },
  confirmed:  { status: 'checked_in', label: '✓ Llegó',     color: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
  checked_in: { status: 'completed',  label: 'Completar',   color: 'text-warm-600 border-warm-200 hover:bg-warm-50' },
}

const HOURS = ['12:00', '13:00', '14:00', '19:00', '20:00', '21:00']

const LOCALS = LOCATIONS
  .filter(l => l.is_active && l.country === 'CL')
  .map(l => ({ id: l.id, name: l.name.replace(/^Rishtedar\s+/i, '') }))

// ─── Component ────────────────────────────────────────────────────────────────

export function ReservationsView() {
  const [reservations, setReservations]   = useState<DashboardReservation[]>([])
  const [upcoming, setUpcoming]           = useState<UpcomingReservation[]>([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState<'list' | 'timeline'>('list')
  const [updating, setUpdating]           = useState<string | null>(null)
  const [copiedBranch, setCopiedBranch]   = useState<string | null>(null)
  const [linkMenuOpen, setLinkMenuOpen]   = useState(false)
  const [todayLabel, setTodayLabel]       = useState('')
  const [currentBranch, setCurrentBranch] = useState<BranchOption | null>(null)
  const linkMenuRef                       = useRef<HTMLDivElement>(null)

  // Fecha y branch solo en cliente (evita hydration mismatch)
  useEffect(() => {
    const s = new Date().toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    setTodayLabel(s.charAt(0).toUpperCase() + s.slice(1))

    const stored = localStorage.getItem('rishtedar_branch')
    if (stored) setCurrentBranch(JSON.parse(stored) as BranchOption)
  }, [])

  useEffect(() => {
    Promise.all([getTodayReservations(), getUpcomingReservations()])
      .then(([today, future]) => {
        setReservations(today)
        setUpcoming(future)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Realtime: refrescar cuando llega una nueva reserva
  useEffect(() => {
    const supabase = createClient()
    const isAdmin  = !currentBranch || currentBranch.id === 'admin'

    const cfg = isAdmin
      ? { event: 'INSERT' as const, schema: 'public', table: 'reservations' }
      : { event: 'INSERT' as const, schema: 'public', table: 'reservations', filter: `business_id=eq.${currentBranch!.id}` }

    const channel = supabase
      .channel('reservations-live')
      .on('postgres_changes', cfg, () => {
        getTodayReservations().then(setReservations).catch(console.error)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentBranch?.id])

  // Cerrar menú de links al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (linkMenuRef.current && !linkMenuRef.current.contains(e.target as Node)) {
        setLinkMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Cambiar estado de reserva ──────────────────────────────────────────────
  async function changeStatus(id: string, status: ReservationStatus) {
    setUpdating(id)
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status } : r)
    )
    await updateReservationStatus(id, status).catch(console.error)
    setUpdating(null)
  }

  // ── Copiar link de piso por sucursal ───────────────────────────────────────
  function copyStaffLink(branchId: string) {
    const token = BRANCH_TOKENS[branchId]
    if (!token) return
    const url = `${window.location.origin}/reservas/${branchId}/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedBranch(branchId)
      setTimeout(() => setCopiedBranch(null), 2000)
    }).catch(console.error)
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalCovers = reservations
    .filter(r => !['cancelled', 'no_show'].includes(r.status))
    .reduce((s, r) => s + r.party, 0)
  const checkedIn = reservations.filter(r => r.status === 'checked_in').length
  const pending   = reservations.filter(r => r.status === 'pending').length

  // ── Sucursales con token disponible, filtradas por rol ────────────────────
  // Admin global → ve todas. Sucursal específica → solo la suya.
  const isGlobalAdmin = currentBranch?.id === 'admin'
  const branchesWithToken = isGlobalAdmin
    ? LOCALS.filter(l => BRANCH_TOKENS[l.id])
    : LOCALS.filter(l => BRANCH_TOKENS[l.id] && l.id === currentBranch?.id)

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Reservas</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {todayLabel || '…'} · Todas las sucursales
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Link para piso */}
          {branchesWithToken.length > 0 && (
            isGlobalAdmin ? (
              /* Admin global → dropdown con todas las sucursales */
              <div className="relative" ref={linkMenuRef}>
                <button
                  onClick={() => setLinkMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-warm-200 text-warm-700 hover:border-warm-400 transition-colors"
                >
                  <Link2 size={12} />
                  Link para piso
                  <ChevronDown size={11} className={`transition-transform ${linkMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {linkMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-warm-200 shadow-lg min-w-[200px]">
                    <p className="px-3 py-2 text-[10px] text-warm-400 uppercase tracking-wider border-b border-warm-100">
                      Copiar link por sucursal
                    </p>
                    {branchesWithToken.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => copyStaffLink(branch.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-warm-700 hover:bg-warm-50 transition-colors"
                      >
                        <span>{branch.name}</span>
                        {copiedBranch === branch.id
                          ? <Check size={13} className="text-emerald-600" />
                          : <Copy size={13} className="text-warm-400" />
                        }
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Sucursal individual → botón directo, sin dropdown */
              <button
                onClick={() => copyStaffLink(branchesWithToken[0].id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs border transition-colors ${
                  copiedBranch === branchesWithToken[0].id
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-warm-200 text-warm-700 hover:border-warm-400'
                }`}
              >
                {copiedBranch === branchesWithToken[0].id
                  ? <><Check size={12} /> ¡Copiado!</>
                  : <><Link2 size={12} /> Link para piso</>
                }
              </button>
            )
          )}

          {/* Toggle de vista */}
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 text-xs transition-colors ${view === 'list' ? 'bg-brand-800 text-ivory' : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-400'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-2 text-xs transition-colors ${view === 'timeline' ? 'bg-brand-800 text-ivory' : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-400'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total cubiertos', value: totalCovers, color: 'text-warm-900', span: '' },
          { label: 'Check-in hecho',  value: checkedIn,   color: 'text-emerald-700', span: '' },
          { label: 'Por confirmar',   value: pending,     color: 'text-amber-700', span: 'col-span-2 sm:col-span-1' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white border border-warm-200 px-4 py-3 sm:px-5 sm:py-4 ${kpi.span}`}>
            <p className="text-warm-400 text-[10px] uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── List View ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          <div className="bg-white border border-warm-200">
            <div className="px-5 py-3 border-b border-warm-100 flex items-center justify-between">
              <p className="text-xs font-medium text-warm-600 uppercase tracking-wider">
                Hoy — {loading ? '…' : `${reservations.length} reservas`}
              </p>
              <CalendarCheck size={14} className="text-warm-400" />
            </div>

            {loading && (
              <div className="px-5 py-8 text-center text-sm text-warm-400">Cargando reservas…</div>
            )}

            {!loading && reservations.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-warm-400">Sin reservas para hoy</div>
            )}

            <div className="divide-y divide-warm-100">
              {reservations.map(r => {
                const nextAction = NEXT_ACTION[r.status]
                const isUpdating = updating === r.id
                const isTerminal = ['completed', 'cancelled', 'no_show'].includes(r.status)

                return (
                  <div key={r.id} className="px-4 py-3 hover:bg-warm-50 transition-colors">
                    {/* Fila principal */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-10 text-center">
                        <p className="text-warm-800 font-semibold text-sm">{r.time}</p>
                        <div className="flex items-center justify-center gap-0.5 text-warm-400 text-[10px]">
                          <Users size={8} />{r.party}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-900 text-sm truncate">{r.name}</p>
                        <p className="text-warm-400 text-xs truncate">
                          {r.local}{r.request ? ` · 📝 ${r.request}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-1 font-medium border ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </div>

                    {/* Acciones — siempre visibles */}
                    <div className="flex items-center gap-1.5 mt-2 ml-13 flex-wrap">
                      {/* Contacto */}
                      <a
                        href={`tel:${r.phone}`}
                        className="p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors rounded"
                        title="Llamar"
                      >
                        <Phone size={12} />
                      </a>
                      <a
                        href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors rounded"
                        title="WhatsApp"
                      >
                        <MessageCircle size={12} />
                      </a>

                      {/* Acción principal: siguiente estado */}
                      {nextAction && !isTerminal && (
                        <button
                          onClick={() => changeStatus(r.id, nextAction.status)}
                          disabled={isUpdating}
                          className={`flex items-center gap-1 text-xs border px-2.5 py-1.5 transition-colors disabled:opacity-50 ${nextAction.color}`}
                        >
                          <CheckCircle2 size={11} />
                          {isUpdating ? '…' : nextAction.label}
                        </button>
                      )}

                      {/* No show — disponible si no está terminado */}
                      {!isTerminal && (
                        <button
                          onClick={() => changeStatus(r.id, 'no_show')}
                          disabled={isUpdating}
                          className="flex items-center gap-1 text-xs text-red-500 border border-red-100 hover:bg-red-50 px-2 py-1.5 transition-colors disabled:opacity-50"
                          title="No llegó"
                        >
                          <XCircle size={11} />
                          No show
                        </button>
                      )}

                      {/* Cancelar — solo pending/confirmed */}
                      {['pending', 'confirmed'].includes(r.status) && (
                        <button
                          onClick={() => changeStatus(r.id, 'cancelled')}
                          disabled={isUpdating}
                          className="text-[10px] text-warm-400 hover:text-red-500 px-1.5 py-1.5 transition-colors disabled:opacity-50"
                          title="Cancelar reserva"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-warm-200">
            <div className="px-5 py-3 border-b border-warm-100">
              <p className="text-xs font-medium text-warm-600 uppercase tracking-wider">Próximos días</p>
            </div>
            {!loading && upcoming.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-warm-400">Sin reservas próximas</div>
            ) : (
              <div className="divide-y divide-warm-100">
                {upcoming.map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="shrink-0 text-xs text-warm-500 w-28">{r.date} {r.time}</div>
                    <div className="flex-1">
                      <span className="text-warm-800 text-sm">{r.name}</span>
                      <span className="text-warm-400 text-xs ml-2">{r.local}</span>
                    </div>
                    <div className="flex items-center gap-1 text-warm-500 text-xs">
                      <Users size={11} />{r.party}
                    </div>
                    <span className={`text-[10px] px-2 py-1 font-medium border ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Timeline View ───────────────────────────────────────────────────── */}
      {view === 'timeline' && (
        <div className="bg-white border border-warm-200 overflow-x-auto">
          <div className="px-5 py-3 border-b border-warm-100">
            <p className="text-xs font-medium text-warm-600 uppercase tracking-wider">Mapa de ocupación — Hoy</p>
          </div>
          <div className="p-5 min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-3 ml-32">
              {HOURS.map(h => (
                <div key={h} className="flex-1 text-center text-xs text-warm-400">{h}</div>
              ))}
            </div>
            {/* Rows by local */}
            {LOCALS.map(local => {
              const localRes = reservations.filter(r => r.local === local.name)
              return (
                <div key={local.id} className="flex items-center gap-0 mb-2">
                  <div className="w-32 shrink-0 text-xs text-warm-600 font-medium">{local.name}</div>
                  <div className="flex-1 relative h-8 bg-warm-50 border border-warm-100">
                    {HOURS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-warm-200"
                        style={{ left: `${(i / HOURS.length) * 100}%` }}
                      />
                    ))}
                    {localRes.map(r => {
                      const [h, m] = r.time.split(':').map(Number)
                      const startHour  = 11
                      const totalHours = 11
                      const pos   = ((h - startHour + m / 60) / totalHours) * 100
                      const width = (1.5 / totalHours) * 100
                      const statusBg =
                        r.status === 'checked_in' ? '#10b981' :
                        r.status === 'confirmed'  ? '#3b82f6' : '#f59e0b'
                      return (
                        <div
                          key={r.id}
                          title={`${r.name} (${r.party} pax)`}
                          className="absolute top-1 bottom-1 flex items-center justify-center text-[9px] text-white font-medium overflow-hidden"
                          style={{ left: `${pos}%`, width: `${width}%`, backgroundColor: statusBg, minWidth: 4 }}
                        >
                          {r.party}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-[10px] text-warm-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 inline-block" />Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 inline-block" />Confirmado</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 inline-block" />Check-in</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
