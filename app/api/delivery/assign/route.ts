import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rishtedar.cl'

// POST /api/delivery/assign
// Asigna un driver a un pedido, genera token único, retorna URL de WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_id, driver_id, business_id } = body

    if (!order_id || !driver_id || !business_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Obtener datos del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, phone')
      .eq('id', driver_id)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404 })
    }

    // 2. Obtener número de orden para el mensaje
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // 3. Generar token único para el driver
    const token = crypto.randomUUID()
    const driverUrl = `${APP_URL}/driver/${token}`

    // 4. Upsert en delivery_tracking
    const { error: trackingError } = await supabase
      .from('delivery_tracking')
      .upsert(
        {
          order_id,
          driver_id,
          driver_name: driver.name,
          driver_phone: driver.phone,
          driver_token: token,
          status: 'assigned',
        },
        { onConflict: 'order_id' }
      )

    if (trackingError) throw trackingError

    // 5. Marcar la orden como confirmed si estaba pending
    await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order_id)
      .eq('status', 'pending')

    // 6. Construir URL de WhatsApp
    const waMessage = encodeURIComponent(
      `Hola ${driver.name}, tienes un nuevo delivery asignado en Rishtedar (${order.order_number}).\n\nHaz click aquí para ver los detalles y actualizar el estado:\n${driverUrl}`
    )
    // Normalizar teléfono: remover espacios, asegurar prefijo 56
    const phone = driver.phone.replace(/\s+/g, '').replace(/^\+/, '')
    const waPhone = phone.startsWith('56') ? phone : `56${phone}`
    const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`

    return NextResponse.json({ token, driverUrl, waUrl, driverName: driver.name })
  } catch (err) {
    console.error('[delivery/assign]', err)
    return NextResponse.json({ error: 'Error al asignar driver' }, { status: 500 })
  }
}
