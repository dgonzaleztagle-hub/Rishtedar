// Comparativa de locales — el "más fuerte / más débil".
// ?from=&to=

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? startOfMonth()
  const to   = searchParams.get('to')   ?? new Date().toISOString()

  const supabase = await createAdminClient()

  try {
    const [{ data: orders }, { data: reservations }, { data: sessions }, { data: businesses }] =
      await Promise.all([
        supabase
          .from('orders')
          .select('business_id, final_price')
          .eq('status', 'completed')
          .gte('created_at', from)
          .lte('created_at', to),
        supabase
          .from('reservations')
          .select('business_id')
          .gte('created_at', from)
          .lte('created_at', to),
        supabase
          .from('analytics_sessions')
          .select('business_id, converted')
          .gte('started_at', from)
          .lte('started_at', to),
        supabase
          .from('businesses')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ])

    const result = (businesses ?? []).map((b: { id: string; name: string }) => {
      const bOrders    = (orders ?? []).filter((o: { business_id: string }) => o.business_id === b.id)
      const bRevenue   = bOrders.reduce((s: number, o: { final_price: number }) => s + (o.final_price ?? 0), 0)
      const bRes       = (reservations ?? []).filter((r: { business_id: string }) => r.business_id === b.id).length
      const bSessions  = (sessions ?? []).filter((s: { business_id: string }) => s.business_id === b.id)
      const bConverted = bSessions.filter((s: { converted: boolean }) => s.converted).length
      const convRate   = bSessions.length > 0 ? (bConverted / bSessions.length) * 100 : 0

      return {
        id:              b.id,
        name:            b.name,
        orders:          bOrders.length,
        revenue:         bRevenue,
        avg_ticket:      bOrders.length > 0 ? Math.round(bRevenue / bOrders.length) : 0,
        reservations:    bRes,
        sessions:        bSessions.length,
        conversion_rate: Math.round(convRate * 10) / 10,
      }
    })

    const maxRevenue  = Math.max(...result.map(b => b.revenue), 1)
    const maxOrders   = Math.max(...result.map(b => b.orders), 1)
    const maxSessions = Math.max(...result.map(b => b.sessions), 1)

    const ranked = result
      .map(b => ({
        ...b,
        score: Math.round(
          (b.revenue / maxRevenue) * 40 +
          (b.orders / maxOrders) * 30 +
          (b.sessions / maxSessions) * 30
        ),
      }))
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({ period: { from, to }, branches: ranked })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: 'Error calculando comparativa', detail }, { status: 500 })
  }
}

function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
