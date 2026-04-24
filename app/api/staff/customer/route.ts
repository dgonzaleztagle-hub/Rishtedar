import { NextRequest, NextResponse } from 'next/server'
import { validateBranchToken } from '@/lib/staff-tokens'
import { requireStaffSession, requireBranchAccess } from '@/lib/auth/session'
import { getCustomerLoyalty } from '@/lib/services/loyaltyService'

// GET /api/staff/customer?phone=X&business_id=Y&token=Z
// Acepta sesión staff (dashboard) o token de sucursal (scanner físico)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const phone      = searchParams.get('phone')
  const businessId = searchParams.get('business_id')
  const token      = searchParams.get('token')

  if (!phone || !businessId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Auth: sesión staff activa O token de sucursal válido
  if (token) {
    if (!(await validateBranchToken(businessId, token))) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
  } else {
    const auth = await requireStaffSession()
    if (!auth.ok) return auth.response
    if (!requireBranchAccess(auth.profile, businessId)) {
      return NextResponse.json({ error: 'Sin acceso a esta sucursal' }, { status: 403 })
    }
  }

  const loyalty = await getCustomerLoyalty(phone, businessId)

  if (!loyalty) {
    return NextResponse.json({ found: false, phone, businessId })
  }

  return NextResponse.json({
    found:       true,
    phone,
    businessId,
    name:        loyalty.name,
    points:      loyalty.points,
    totalPoints: loyalty.totalPoints,
    tier:        loyalty.tier,
    totalVisits: loyalty.totalVisits,
    lastVisit:   loyalty.lastVisit,
  })
}
