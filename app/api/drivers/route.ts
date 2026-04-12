import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { Driver } from '@/types'

// GET /api/drivers?business_id=xxx
// Lista todos los drivers de una sucursal
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const business_id = searchParams.get('business_id')

  if (!business_id) {
    return NextResponse.json({ error: 'Falta business_id' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ drivers: data ?? [] })
  } catch (err) {
    console.error('[drivers GET]', err)
    return NextResponse.json({ error: 'Error al obtener drivers' }, { status: 500 })
  }
}

// POST /api/drivers
// Crea un nuevo driver
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { business_id, name, phone, vehicle, zone } = body

    if (!business_id || !name || !phone) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const validVehicles = ['moto', 'bici', 'auto', 'a_pie']
    const safeVehicle = validVehicles.includes(vehicle) ? vehicle : 'moto'

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        business_id,
        name: name.trim(),
        phone: phone.trim().replace(/\s+/g, ''),
        vehicle: safeVehicle,
        zone: zone?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ driver: data as Driver })
  } catch (err) {
    console.error('[drivers POST]', err)
    return NextResponse.json({ error: 'Error al crear driver' }, { status: 500 })
  }
}

// PATCH /api/drivers?id=xxx
// Toggle is_active
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { is_active } = body

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ driver: data as Driver })
  } catch (err) {
    console.error('[drivers PATCH]', err)
    return NextResponse.json({ error: 'Error al actualizar driver' }, { status: 500 })
  }
}
