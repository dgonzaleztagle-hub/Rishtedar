import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ─── POST /api/delivery/request-external ─────────────────────────────────────
//
// Placeholder para integración con Uber Direct.
//
// Cuando lleguen las credenciales, configurar en .env:
//   UBER_DIRECT_CLIENT_ID=...
//   UBER_DIRECT_CLIENT_SECRET=...
//   UBER_DIRECT_CUSTOMER_ID=...
//
// Flujo completo (pendiente de implementar):
//   1. POST /v1/customers/{customerId}/delivery_quotes  → estimate + precio
//   2. POST /v1/eats/deliveries/orders (con estimate_id) → confirmar delivery
//   3. Webhooks HMAC-SHA256 para tracking GPS cada 20 s
//
// Docs: https://developer.uber.com/docs/deliveries/introduction
// SDK:  https://github.com/uber/uber-direct-sdk
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_id, business_id } = body as { order_id?: string; business_id?: string }

    if (!order_id || !business_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que la orden existe y es de delivery
    const supabase = await createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, delivery_address, customer_name, customer_phone, final_price')
      .eq('id', order_id)
      .eq('business_id', business_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // ── Verificar credenciales Uber Direct ────────────────────────────────────
    const isConfigured = !!(
      process.env.UBER_DIRECT_CLIENT_ID &&
      process.env.UBER_DIRECT_CLIENT_SECRET &&
      process.env.UBER_DIRECT_CUSTOMER_ID
    )

    if (!isConfigured) {
      return NextResponse.json({
        configured:  false,
        provider:    'uber_direct',
        order_id,
        message:     'Credenciales de Uber Direct aún no configuradas. Configurar UBER_DIRECT_CLIENT_ID, UBER_DIRECT_CLIENT_SECRET y UBER_DIRECT_CUSTOMER_ID en variables de entorno.',
      }, { status: 503 })
    }

    // ── TODO: Implementar cuando lleguen credenciales ─────────────────────────
    //
    // const token = await getUberDirectToken()
    //
    // const quote = await fetch(
    //   `https://api.uber.com/v1/customers/${process.env.UBER_DIRECT_CUSTOMER_ID}/delivery_quotes`,
    //   {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       pickup_address: STORE_ADDRESS,
    //       dropoff_address: order.delivery_address,
    //     }),
    //   }
    // )
    // const { estimate_id, fee, currency_code, estimated_delivery_time } = await quote.json()
    //
    // → retornar estimate para que el staff confirme con precio antes de crear
    //
    // const delivery = await fetch('https://api.uber.com/v1/eats/deliveries/orders', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     estimate_id,
    //     external_order_id: order.order_number,
    //     pickup: { store_id: process.env.UBER_DIRECT_STORE_ID },
    //     dropoff: {
    //       address: { place: order.delivery_address },
    //       contact: { first_name: order.customer_name, phone: order.customer_phone },
    //     },
    //   }),
    // })

    return NextResponse.json({
      configured: true,
      message:    'Uber Direct configurado pero integración pendiente de implementar.',
    }, { status: 501 })

  } catch (err) {
    console.error('[delivery/request-external]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
