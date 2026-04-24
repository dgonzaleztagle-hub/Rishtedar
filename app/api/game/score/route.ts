import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface SubmissionRow {
  customer_phone: string
  display_name: string
  score: number
  created_at: string
}

function normalizeScore(value: unknown): number | null {
  const score = Number(value)
  if (!Number.isFinite(score) || score < 0) return null
  return Math.floor(score)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_phone, customer_name, business_id, week_start } = body
    const score = normalizeScore(body.score)

    if (!customer_phone || !business_id || !week_start || score === null) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('submit_game_score', {
      p_customer_phone: customer_phone,
      p_customer_name: customer_name ?? null,
      p_business_id: business_id,
      p_week_start: week_start,
      p_score: score,
    })

    if (error) {
      if (error.message.includes('NO_GAME_CREDITS')) {
        return NextResponse.json(
          { error: 'No tienes fichas disponibles para publicar esta semana', code: 'NO_GAME_CREDITS' },
          { status: 402 }
        )
      }

      throw error
    }

    return NextResponse.json(data ?? { ok: true })
  } catch (err) {
    console.error('[game/score]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET: current weekly leaderboard for one branch.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('business_id')
  const weekStart = searchParams.get('week_start')
  const currentPhone = searchParams.get('customer_phone')

  if (!businessId || !weekStart) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('game_score_submissions')
    .select('customer_phone, display_name, score, created_at')
    .eq('business_id', businessId)
    .eq('week_start', weekStart)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bestByPhone = new Map<string, SubmissionRow>()
  for (const row of (data ?? []) as SubmissionRow[]) {
    const existing = bestByPhone.get(row.customer_phone)
    if (!existing || row.score > existing.score) {
      bestByPhone.set(row.customer_phone, row)
    }
  }

  const leaderboard = Array.from(bestByPhone.values())
    .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at))
    .slice(0, 10)
    .map((row, i) => ({
      rank: i + 1,
      name: row.display_name,
      score: row.score,
      is_current_user: currentPhone ? row.customer_phone === currentPhone : false,
    }))

  return NextResponse.json({ leaderboard, week_start: weekStart })
}
