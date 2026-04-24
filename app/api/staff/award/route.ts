import { NextRequest, NextResponse } from 'next/server'
import { validateBranchToken } from '@/lib/staff-tokens'
import { awardPoints } from '@/lib/services/loyaltyService'

// POST /api/staff/award
// Body: { phone, name, businessId, points, reason, token }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, name, businessId, points, reason = 'manual', token } = body

    if (!phone || !businessId || !points || !token) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!validateBranchToken(businessId, token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    if (typeof points !== 'number' || points <= 0 || points > 10000) {
      return NextResponse.json({ error: 'Puntos inválidos' }, { status: 400 })
    }

    const ref = `STAFF-${Date.now().toString(36).toUpperCase()}`
    const { newTotal, tier } = await awardPoints({
      customerPhone: phone,
      customerName:  name ?? phone,
      businessId,
      orderId:       null,
      orderNumber:   `Registro manual staff · ${ref}`,
      points,
      reason:        reason === 'redemption' ? 'redemption' : 'manual',
    })

    return NextResponse.json({ success: true, pointsAwarded: points, newTotal, tier })
  } catch (error) {
    console.error('[staff/award]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
