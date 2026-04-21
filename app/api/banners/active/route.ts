import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/banners/active
// Retorna promociones activas con show_as_banner=true para el popup del sitio.
// No toca la lógica de descuentos del checkout (useActivePromotion / /api/promotions/active).
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .eq('show_as_banner', true)
      .lte('valid_from', today)
      .gte('valid_to', today)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[banners/active GET]', err)
    return NextResponse.json([])
  }
}
