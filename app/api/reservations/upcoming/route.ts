import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'
import { LOCATIONS } from '@/lib/locations'
import type { Reservation } from '@/types'

function businessDisplayName(businessId: string): string {
  const loc = LOCATIONS.find(l => l.id === businessId)
  if (!loc) return businessId
  return loc.name.replace(/^Rishtedar\s+/i, '')
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(req.url)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const ceiling = new Date(today)
    ceiling.setDate(today.getDate() + 7)

    const fromStr = searchParams.get('from') ?? tomorrow.toISOString().split('T')[0]
    const toStr = searchParams.get('to') ?? ceiling.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .gte('reservation_date', fromStr)
      .lte('reservation_date', toStr)
      .neq('status', 'cancelled')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })

    if (error) throw error

    // Derive client's "today" from the "from" param (from = tomorrow = today + 1)
    const [fy, fm, fd] = fromStr.split('-').map(Number)
    const clientToday = new Date(fy, fm - 1, fd)
    clientToday.setDate(clientToday.getDate() - 1) // one day before "from"

    const reservations = (data as Reservation[]).map(r => {
      const [y, m, d] = r.reservation_date.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const diffDays = Math.round((date.getTime() - clientToday.getTime()) / (1000 * 60 * 60 * 24))
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

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('[reservations/upcoming]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
