import { createClient } from '@/lib/supabase/client'
import { LOCATIONS } from '@/lib/locations'
import type { Reservation, ReservationStatus } from '@/types'

function businessDisplayName(businessId: string): string {
  const loc = LOCATIONS.find(l => l.id === businessId)
  if (!loc) return businessId
  return loc.name.replace(/^Rishtedar\s+/i, '')
}

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

function mapToDisplay(r: Reservation): DashboardReservation {
  return {
    id: r.id,
    time: r.reservation_time,
    name: r.customer_name,
    party: r.party_size,
    status: r.status,
    phone: r.customer_phone,
    local: businessDisplayName(r.business_id),
    request: r.special_requests ?? '',
  }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export async function getTodayReservations(): Promise<DashboardReservation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', todayISO())
    .not('status', 'in', '(cancelled,completed)')
    .order('reservation_time', { ascending: true })

  if (error) throw error
  return (data as Reservation[]).map(mapToDisplay)
}

export async function getUpcomingReservations(): Promise<UpcomingReservation[]> {
  const supabase = createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const ceiling = new Date(today)
  ceiling.setDate(today.getDate() + 7)

  const fromStr = tomorrow.toISOString().split('T')[0]
  const toStr = ceiling.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .gte('reservation_date', fromStr)
    .lte('reservation_date', toStr)
    .neq('status', 'cancelled')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (error) throw error

  const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (data as Reservation[]).map(r => {
    // Parse date without timezone shift
    const [y, m, d] = r.reservation_date.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dateLabel = diffDays === 1 ? 'Mañana' : DAYS_ES[date.getDay()]

    return {
      id: r.id,
      date: dateLabel,
      isoDate: r.reservation_date,
      time: r.reservation_time,
      name: r.customer_name,
      party: r.party_size,
      local: businessDisplayName(r.business_id),
      status: r.status,
    }
  })
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const supabase = createClient()
  const update: Record<string, unknown> = { status }
  if (status === 'checked_in') {
    update.check_in_time = new Date().toISOString()
  }
  const { error } = await supabase.from('reservations').update(update).eq('id', id)
  if (error) throw error
}
