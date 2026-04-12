import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateBranchToken } from '@/lib/staff-tokens'

// GET /api/staff/customer?phone=X&business_id=Y&token=Z
// Devuelve datos del cliente para mostrar en el escáner
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const phone      = searchParams.get('phone')
  const businessId = searchParams.get('business_id')
  const token      = searchParams.get('token')

  if (!phone || !businessId || !token) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Para el dashboard (staff logueado) se omite validación de token con valor 'dashboard'
  if (token !== 'dashboard' && !validateBranchToken(businessId, token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data: loyalty } = await supabase
    .from('loyalty_points')
    .select('customer_name, points_current, points_total_historical, tier, total_visits, last_visit_at')
    .eq('customer_phone', phone)
    .eq('business_id', businessId)
    .maybeSingle()

  if (!loyalty) {
    // Cliente nuevo — no existe en este local todavía
    return NextResponse.json({
      found: false,
      phone,
      businessId,
    })
  }

  return NextResponse.json({
    found: true,
    phone,
    businessId,
    name:         loyalty.customer_name,
    points:       loyalty.points_current,
    totalPoints:  loyalty.points_total_historical,
    tier:         loyalty.tier,
    totalVisits:  loyalty.total_visits,
    lastVisit:    loyalty.last_visit_at,
  })
}
