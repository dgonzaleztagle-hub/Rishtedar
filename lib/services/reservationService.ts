import type { ReservationStatus } from '@/types'

export interface DashboardReservation {
  id: string
  time: string
  name: string
  party: number
  status: ReservationStatus
  phone: string
  local: string
  request: string
}

export interface UpcomingReservation {
  id: string
  date: string
  isoDate: string
  time: string
  name: string
  party: number
  local: string
  status: ReservationStatus
}

function localDateISO(): string {
  // Use en-CA locale to get YYYY-MM-DD in the client's local timezone
  return new Date().toLocaleDateString('en-CA')
}

export async function getTodayReservations(): Promise<DashboardReservation[]> {
  const res = await fetch(`/api/reservations/today?date=${localDateISO()}`)
  if (!res.ok) throw new Error('Error al cargar reservas de hoy')
  return res.json()
}

export async function getUpcomingReservations(): Promise<UpcomingReservation[]> {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const ceiling = new Date(today)
  ceiling.setDate(today.getDate() + 7)
  const from = tomorrow.toLocaleDateString('en-CA')
  const to = ceiling.toLocaleDateString('en-CA')
  const res = await fetch(`/api/reservations/upcoming?from=${from}&to=${to}`)
  if (!res.ok) throw new Error('Error al cargar reservas próximas')
  return res.json()
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const res = await fetch('/api/reservations/update-status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
  if (!res.ok) throw new Error('Error al actualizar estado')
}
