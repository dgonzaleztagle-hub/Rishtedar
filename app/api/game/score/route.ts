import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_phone, customer_name, business_id, score, is_ranked, week_start } = body

    if (!customer_phone || !business_id || score === undefined || !week_start) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Validate ranked attempts (max 3 per week)
    if (is_ranked) {
      const supabase = await createAdminClient()
      const { count } = await supabase
        .from('game_scores')
        .select('*', { count: 'exact', head: true })
        .eq('customer_phone', customer_phone)
        .eq('business_id', business_id)
        .eq('week_start', week_start)
        .eq('is_ranked', true)

      if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: 'Ya usaste tus 3 intentos válidos esta semana' }, { status: 429 })
      }

      const { error } = await supabase.from('game_scores').insert({
        customer_phone,
        customer_name: customer_name || 'Anónimo',
        business_id,
        score,
        week_start,
        is_ranked: true,
        game_tokens_used: 1,
      })

      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[game/score]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET: leaderboard de la semana actual para una sucursal
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const business_id = searchParams.get('business_id')
  const week_start  = searchParams.get('week_start')

  if (!business_id || !week_start) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Best ranked score per player this week
  const { data, error } = await supabase
    .from('game_scores')
    .select('customer_phone, customer_name, score')
    .eq('business_id', business_id)
    .eq('week_start', week_start)
    .eq('is_ranked', true)
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate: keep best score per phone
  const seen = new Map<string, { name: string; score: number }>()
  for (const row of (data ?? [])) {
    const existing = seen.get(row.customer_phone)
    if (!existing || row.score > existing.score) {
      seen.set(row.customer_phone, { name: row.customer_name, score: row.score })
    }
  }

  const leaderboard = Array.from(seen.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([phone, { name, score }], i) => ({
      rank: i + 1,
      name,
      score,
      phone_hint: phone.slice(-4), // solo últimos 4 dígitos por privacidad
    }))

  return NextResponse.json({ leaderboard, week_start })
}
