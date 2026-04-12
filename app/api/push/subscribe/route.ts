import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/push/subscribe
// Guarda o actualiza una suscripción push de un cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, customer_phone, business_id } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint:    subscription.endpoint,
          keys_p256dh: subscription.keys.p256dh,
          keys_auth:   subscription.keys.auth,
          customer_phone: customer_phone ?? null,
          business_id:    business_id ?? null,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Error al guardar suscripción' }, { status: 500 })
  }
}
