'use client'

import { useState, useEffect } from 'react'
import {
  CalendarCheck, Users, CheckCircle2, XCircle, Phone,
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

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'text-amber-700 bg-amber-50',
  confirmed: 'text-blue-700 bg-blue-50',
  checked_in: 'text-emerald-700 bg-emerald-50',
  completed: 'text-warm-500 bg-warm-100',
  cancelled: 'text-red-600 bg-red-50',
  no_show: 'text-red-700 bg-red-100',
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  checked_in: '✓ Llegó',
  completed: 'Terminado',
  cancelled: 'Cancelado',
  no_show: 'No llegó',
}

const HOURS = ['12:00', '13:00', '14:00', '19:00', '20:00', '21:00']

// Location display names (strip "Rishtedar " prefix)
const LOCALS = LOCATIONS
  .filter(l => l.is_active && l.country === 'CL')
  .map(l => l.name.replace(/^Rishtedar\s+/i, ''))

function formatTodayLabel(): string {
  const s = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function ReservationsView() {
  const [reservations, setReservations] = useState<DashboardReservation[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'timeline'>('list')

  useEffect(() => {
    Promise.all([getTodayReservations(), getUpcomingReservations()])
      .then(([today, future]) => {
        setReservations(today)
        setUpcoming(future)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function checkIn(id: string) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'checked_in' as ReservationStatus } : r)
    )
    await updateReservationStatus(id, 'checked_in').catch(console.error)
  }

  async function noShow(id: string) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'no_show' as ReservationStatus } : r)
    )
    await updateReservationStatus(id, 'no_show').catch(console.error)
  }

  const totalCovers = reservations
    .filter(r => !['cancelled', 'no_show'].includes(r.status))
    .reduce((s, r) => s + r.party, 0)
  const checkedIn = reservations.filter(r => r.status === 'checked_in').length
  const pending = reservations.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Reservas</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {formatTodayLabel()} · Todas las sucursales
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total cubiertos', value: totalCovers, color: 'text-warm-900', span: '' },
          { label: 'Check-in hecho', value: checkedIn, color: 'text-emerald-700', span: '' },
          { label: 'Por confirmar', value: pending, color: 'text-amber-700', span: 'col-span-2 sm:col-span-1' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white border border-warm-200 px-4 py-3 sm:px-5 sm:py-4 ${kpi.span}`}>
            <p className="text-warm-400 text-[10px] uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          <div className="bg-white border border-warm-200">
            <div className="px-5 py-3 border-b border-warm-100 flex items-center justify-between">
              <p className="text-xs font-medium text-warm-600 uppercase tracking-wider">
                Hoy —{' '}
                {loading ? '…' : `${reservations.length} reservas`}
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
              {reservations.map(r => (
                <div key={r.id} className="px-4 py-3 hover:bg-warm-50 transition-colors">
                  {/* Top row */}
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
                    <span className={`shrink-0 text-[10px] px-2 py-1 font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  {/* Actions */}
                  {r.status === 'confirmed' && (
                    <div className="flex items-center gap-2 mt-2 ml-13">
                      <a href={`tel:${r.phone}`} className="p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors">
                        <Phone size={12} />
                      </a>
                      <button
                        onClick={() => checkIn(r.id)}
                        className="flex items-center gap-1 text-xs text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 transition-colors"
                      >
                        <CheckCircle2 size={11} />
                        Check-in
                      </button>
                      <button
                        onClick={() => noShow(r.id)}
                        className="flex items-center gap-1 text-xs text-red-500 border border-red-100 hover:bg-red-50 px-2 py-1.5 transition-colors"
                      >
                        <XCircle size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
                    <span className={`text-[10px] px-2 py-1 font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Timeline View */}
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
              const localRes = reservations.filter(r => r.local === local)
              return (
                <div key={local} className="flex items-center gap-0 mb-2">
                  <div className="w-32 shrink-0 text-xs text-warm-600 font-medium">{local}</div>
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
                      const startHour = 11
                      const totalHours = 11
                      const pos = ((h - startHour + m / 60) / totalHours) * 100
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
