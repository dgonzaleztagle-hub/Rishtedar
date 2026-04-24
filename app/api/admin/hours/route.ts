// GET  /api/admin/hours?business_id=X  → horario delivery + reservations del local
// PUT  /api/admin/hours               → guarda { business_id, type, schedule, is_open }

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

const DEFAULT_DELIVERY = {
  lun: { active: true, open: '12:00', close: '23:00' },
  mar: { active: true, open: '12:00', close: '23:00' },
  mie: { active: true, open: '12:00', close: '23:00' },
  jue: { active: true, open: '12:00', close: '23:00' },
  vie: { active: true, open: '12:30', close: '23:30' },
  sab: { active: true, open: '12:30', close: '23:30' },
  dom: { active: true, open: '12:30', close: '22:30' },
}

const DEFAULT_RESERVATIONS = {
  lun: { active: true, open: '12:00', close: '21:00' },
  mar: { active: true, open: '12:00', close: '21:00' },
  mie: { active: true, open: '12:00', close: '21:00' },
  jue: { active: true, open: '12:00', close: '21:00' },
  vie: { active: true, open: '12:30', close: '22:00' },
  sab: { active: true, open: '12:30', close: '22:00' },
  dom: { active: true, open: '12:30', close: '21:00' },
}

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const business_id = req.nextUrl.searchParams.get('business_id')
  if (!business_id) return NextResponse.json({ error: 'Falta business_id' }, { status: 400 })

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('location_hours')
      .select('type, schedule, is_open, updated_at')
      .eq('business_id', business_id)

    if (error) throw error

    const deliveryRow     = data?.find(r => r.type === 'delivery')
    const reservationsRow = data?.find(r => r.type === 'reservations')

    return NextResponse.json({
      business_id,
      delivery:     { schedule: deliveryRow?.schedule ?? DEFAULT_DELIVERY,     is_open: deliveryRow?.is_open ?? true,     updated_at: deliveryRow?.updated_at ?? null },
      reservations: { schedule: reservationsRow?.schedule ?? DEFAULT_RESERVATIONS, is_open: reservationsRow?.is_open ?? true, updated_at: reservationsRow?.updated_at ?? null },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[admin/hours GET]', detail)
    return NextResponse.json({ error: 'Error al cargar horarios', detail }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  try {
    const { business_id, type, schedule, is_open } = await req.json()

    if (!business_id || !type || !schedule) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('location_hours')
      .upsert(
        { business_id, type, schedule, is_open: is_open ?? true, updated_at: new Date().toISOString() },
        { onConflict: 'business_id,type' }
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[admin/hours PUT]', detail)
    return NextResponse.json({ error: 'Error al guardar horarios', detail }, { status: 500 })
  }
}
