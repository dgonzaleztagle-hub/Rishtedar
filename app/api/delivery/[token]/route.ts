import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/delivery/[token]
// Valida el token y retorna los datos de la orden + tracking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()

    // 1. Buscar el tracking por token
    const { data: tracking, error: trackingError } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('driver_token', token)
      .single()

    if (trackingError || !tracking) {
      return NextResponse.json({ error: 'Link inválido o entrega ya completada' }, { status: 404 })
    }

    // 2. Obtener la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, delivery_address, delivery_latitude, delivery_longitude, final_price, notes')
      .eq('id', tracking.order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // 3. Obtener ítems de la orden
    const { data: items } = await supabase
      .from('order_items')
      .select('quantity, unit_price, item_name, special_instructions')
      .eq('order_id', tracking.order_id)

    return NextResponse.json({
      tracking,
      order,
      items: items ?? [],
    })
  } catch (err) {
    console.error('[delivery/token GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH /api/delivery/[token]
// Actualiza el status del delivery. También acepta delivery_photo_url.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { status, delivery_photo_url } = body

    const validStatuses = ['assigned', 'pickup', 'in_transit', 'delivered']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Buscar el tracking primero para obtener order_id
    const { data: tracking, error: findError } = await supabase
      .from('delivery_tracking')
      .select('order_id')
      .eq('driver_token', token)
      .single()

    if (findError || !tracking) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 404 })
    }

    // 2. Actualizar delivery_tracking
    const updatePayload: Record<string, unknown> = { status }
    if (delivery_photo_url) updatePayload.delivery_photo_url = delivery_photo_url
    if (status === 'delivered') updatePayload.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('delivery_tracking')
      .update(updatePayload)
      .eq('driver_token', token)

    if (updateError) throw updateError

    // 3. Sincronizar status en orders table
    const orderStatusMap: Record<string, string> = {
      assigned: 'confirmed',
      pickup: 'preparing',
      in_transit: 'preparing',
      delivered: 'completed',
    }
    await supabase
      .from('orders')
      .update({ status: orderStatusMap[status] })
      .eq('id', tracking.order_id)

    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[delivery/token PATCH]', err)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
