'use client'

import { useState } from 'react'
import { CalendarCheck, Clock, Users, CheckCircle2 } from 'lucide-react'
import type { ReservationStatus } from '@/types'

const DEMO_RESERVATIONS = [
  { id: '1', time: '12:00', name: 'Familia Torres', party: 4, status: 'confirmed' as ReservationStatus },
  { id: '2', time: '13:30', name: 'Miguel Fernández', party: 2, status: 'checked_in' as ReservationStatus },
  { id: '3', time: '14:00', name: 'Empresa TechCorp', party: 8, status: 'confirmed' as ReservationStatus },
  { id: '4', time: '19:00', name: 'Laura Soto', party: 3, status: 'pending' as ReservationStatus },
  { id: '5', time: '19:30', name: 'Aniversario Silva', party: 2, status: 'confirmed' as ReservationStatus },
  { id: '6', time: '20:00', name: 'Grupo Cumpleaños', party: 10, status: 'confirmed' as ReservationStatus },
  { id: '7', time: '20:30', name: 'Valentina Castro', party: 4, status: 'pending' as ReservationStatus },
  { id: '8', time: '21:00', name: 'Don Roberto', party: 6, status: 'confirmed' as ReservationStatus },
]

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-blue-600 bg-blue-50',
  checked_in: 'text-emerald-600 bg-emerald-50',
  completed: 'text-warm-500 bg-warm-100',
  cancelled: 'text-red-500 bg-red-50',
  no_show: 'text-red-700 bg-red-50',
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  checked_in: '✓ Llegó',
  completed: 'Terminado',
  cancelled: 'Cancelado',
  no_show: 'No llegó',
}

export function ReservationsToday() {
  const [reservations, setReservations] = useState(DEMO_RESERVATIONS)

  function checkIn(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_in' as ReservationStatus } : r))
  }

  const totalCovers = reservations.filter(r => r.status !== 'cancelled').reduce((s, r) => s + r.party, 0)

  return (
    <div className="bg-white border border-warm-200 h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200">
        <div className="flex items-center gap-2">
          <CalendarCheck size={16} className="text-brand-700" />
          <h2 className="font-medium text-warm-900 text-sm">Reservas hoy</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-warm-500">
          <Users size={12} />
          {totalCovers} cubiertos
        </div>
      </div>

      <div className="divide-y divide-warm-100 max-h-96 overflow-y-auto">
        {reservations.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-warm-50 transition-colors">
            <div className="shrink-0 text-center">
              <p className="text-warm-800 font-medium text-sm">{r.time}</p>
              <p className="text-warm-400 text-[10px] flex items-center gap-0.5">
                <Users size={8} /> {r.party}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-warm-800 text-sm truncate">{r.name}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 font-medium mt-0.5 ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            {r.status === 'confirmed' && (
              <button
                onClick={() => checkIn(r.id)}
                className="shrink-0 flex items-center gap-1 text-xs text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1 transition-colors"
              >
                <CheckCircle2 size={11} />
                Check-in
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
