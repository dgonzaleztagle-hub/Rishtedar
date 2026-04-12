import { NextRequest, NextResponse } from 'next/server'
import { sendPushToPhone } from '@/lib/services/notificationService'

// POST /api/push/send
// Sends a push notification to a customer by phone (internal use only).
// Requires header: x-internal-key = SUPABASE_SERVICE_ROLE_KEY
export async function POST(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key')
  if (internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { customer_phone, title, body: msgBody, url } = body

    if (!customer_phone || !title) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      return NextResponse.json({ error: 'VAPID keys no configuradas' }, { status: 503 })
    }

    const { sent, total } = await sendPushToPhone(customer_phone, { title, body: msgBody, url })
    return NextResponse.json({ ok: true, sent, total })
  } catch (err) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: 'Error al enviar notificación' }, { status: 500 })
  }
}
