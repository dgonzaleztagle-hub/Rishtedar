import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { LOCATIONS } from '@/lib/locations'
import type { Reservation } from '@/types'

function businessDisplayName(businessId: string): string {
  const loc = LOCATIONS.find(l => l.id === businessId)
  if (!loc) return businessId
  return loc.name.replace(/^Rishtedar\s+/i, '')
}

export async function GET(req: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(req.url)
    const today = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_date', today)
      .not('status', 'in', '(cancelled,completed)')
      .order('reservation_time', { ascending: true })

    if (error) throw error

    const reservations = (data as Reservation[]).map(r => ({
      id: r.id,
      time: r.reservation_time,
      name: r.customer_name,
      party: r.party_size,
      status: r.status,
      phone: r.customer_phone,
      local: businessDisplayName(r.business_id),
      request: r.special_requests ?? '',
    }))

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('[reservations/today]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
