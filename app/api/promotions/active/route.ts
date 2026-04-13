import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/promotions/active — retorna la promo vigente (para el banner público)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get('business_id')
    const today = new Date().toISOString().split('T')[0]

    const supabase = await createAdminClient()

    let query = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', today)
      .gte('valid_to', today)
      .order('discount_value', { ascending: false })
      .limit(10) // traemos varias para filtrar por hora/día en cliente

    if (businessId) {
      query = query.or(`business_id.is.null,business_id.eq.${businessId}`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[promotions/active GET]', err)
    return NextResponse.json([])
  }
}
