import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface CreditRow {
  credits_granted: number
  credits_used: number
  expires_at: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const customerPhone = searchParams.get('customer_phone')
  const businessId = searchParams.get('business_id')
  const weekStart = searchParams.get('week_start')

  if (!customerPhone || !businessId || !weekStart) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('game_score_credits')
    .select('credits_granted, credits_used, expires_at')
    .eq('customer_phone', customerPhone)
    .eq('business_id', businessId)
    .eq('week_start', weekStart)
    .gt('expires_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totals = ((data ?? []) as CreditRow[]).reduce(
    (acc, row) => ({
      creditsGranted: acc.creditsGranted + row.credits_granted,
      creditsUsed: acc.creditsUsed + row.credits_used,
      expiresAt: !acc.expiresAt || row.expires_at > acc.expiresAt ? row.expires_at : acc.expiresAt,
    }),
    { creditsGranted: 0, creditsUsed: 0, expiresAt: null as string | null }
  )

  return NextResponse.json({
    credits_available: Math.max(0, totals.creditsGranted - totals.creditsUsed),
    credits_granted: totals.creditsGranted,
    credits_used: totals.creditsUsed,
    expires_at: totals.expiresAt,
    week_start: weekStart,
  })
}
