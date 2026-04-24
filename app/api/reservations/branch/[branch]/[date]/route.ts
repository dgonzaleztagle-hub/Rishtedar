import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateBranchToken } from '@/lib/staff-tokens'
import type { Reservation } from '@/types'

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ branch: string; date: string }>
  }
) {
  try {
    const { branch, date } = await params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // Validar token de sucursal
    if (!token || !(await validateBranchToken(branch, token))) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Obtener todas las reservas del día para esta sucursal
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('business_id', branch)
      .eq('reservation_date', date)
      .not('status', 'in', '(cancelled)')
      .order('reservation_time', { ascending: true })

    if (error) throw error

    const reservations = (data as Reservation[]).map((r) => ({
      id: r.id,
      reservation_number: r.reservation_number,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      reservation_time: r.reservation_time,
      party_size: r.party_size,
      status: r.status,
      special_requests: r.special_requests ?? '',
      table_preference: r.table_preference ?? '',
      check_in_time: r.check_in_time ?? null,
      created_at: r.created_at,
    }))

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('[reservations/branch]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
