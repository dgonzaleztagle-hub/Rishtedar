import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateBranchToken } from '@/lib/staff-tokens'
import { awardLoyaltyPoints } from '@/app/api/orders/create/route'

// POST /api/staff/award
// Body: { phone, name, businessId, points, reason, token }
// Suma puntos manualmente (visita en local, canje, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, name, businessId, points, reason = 'manual', token } = body

    if (!phone || !businessId || !points || !token) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (token !== 'dashboard' && !validateBranchToken(businessId, token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    if (typeof points !== 'number' || points <= 0 || points > 10000) {
      return NextResponse.json({ error: 'Puntos inválidos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Reutilizamos awardLoyaltyPoints pero con points override
    // Para visitas manuales construimos un orderId ficticio
    const fakeOrderId  = '00000000-0000-0000-0000-000000000000'
    const orderNumber  = `STAFF-${Date.now().toString(36).toUpperCase()}`

    // Gestionar upsert directo con los puntos dados (no $1000 ratio)
    const { data: existing } = await supabase
      .from('loyalty_points')
      .select('id, points_current, points_total_historical, total_visits')
      .eq('customer_phone', phone)
      .eq('business_id', businessId)
      .maybeSingle()

    if (existing) {
      const newPoints = existing.points_current + points
      await supabase
        .from('loyalty_points')
        .update({
          points_current:          newPoints,
          points_total_historical: existing.points_total_historical + points,
          total_visits:            reason === 'manual' ? existing.total_visits + 1 : existing.total_visits,
          last_visit_at:           new Date().toISOString(),
          tier: newPoints >= 5000 ? 'gold' : newPoints >= 1000 ? 'silver' : 'bronze',
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('loyalty_points').insert({
        customer_phone:          phone,
        customer_name:           name ?? phone,
        business_id:             businessId,
        points_current:          points,
        points_total_historical: points,
        total_visits:            1,
        last_visit_at:           new Date().toISOString(),
        tier:                    points >= 5000 ? 'gold' : points >= 1000 ? 'silver' : 'bronze',
      })
    }

    await supabase.from('loyalty_transactions').insert({
      customer_phone: phone,
      business_id:    businessId,
      order_id:       null,
      points_delta:   points,
      reason,
      notes:          `Registro manual staff · ${orderNumber}`,
    })

    const newTotal = (existing?.points_current ?? 0) + points
    return NextResponse.json({
      success: true,
      pointsAwarded: points,
      newTotal,
      tier: newTotal >= 5000 ? 'gold' : newTotal >= 1000 ? 'silver' : 'bronze',
    })
  } catch (error) {
    console.error('[staff/award]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
