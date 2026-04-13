import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { ReservationStatus } from '@/types'

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json() as { id: string; status: ReservationStatus }

    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const update: Record<string, unknown> = { status }
    if (status === 'checked_in') {
      update.check_in_time = new Date().toISOString()
    }

    const { error } = await supabase.from('reservations').update(update).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[reservations/update-status]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
