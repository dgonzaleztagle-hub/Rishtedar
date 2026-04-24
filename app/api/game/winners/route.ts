import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('business_id')
  const weekStart = searchParams.get('week_start')

  if (!businessId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  let query = supabase
    .from('game_weekly_winners')
    .select('business_id, week_start, rank, display_name, score, closed_at')
    .eq('business_id', businessId)
    .order('week_start', { ascending: false })
    .order('rank', { ascending: true })

  if (weekStart) query = query.eq('week_start', weekStart)

  const { data, error } = await query.limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ winners: data ?? [] })
}
