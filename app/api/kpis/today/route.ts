// KPIs de hoy vs ayer para las cards principales del dashboard.
// ?branch=all|providencia|vitacura|la-reina|la-dehesa

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const branch = req.nextUrl.searchParams.get('branch') ?? 'all'
  const supabase = await createAdminClient()

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1)

  const tS = todayStart.toISOString()
  const tE = now.toISOString()
  const yS = yesterdayStart.toISOString()
  const yE = yesterdayEnd.toISOString()

  try {
    // ── Órdenes ───────────────────────────────────────────────────────────────
    let todayOrdQ = supabase.from('orders').select('final_price').eq('status', 'completed').gte('created_at', tS).lte('created_at', tE)
    let yestOrdQ  = supabase.from('orders').select('final_price').eq('status', 'completed').gte('created_at', yS).lte('created_at', yE)
    if (branch !== 'all') { todayOrdQ = todayOrdQ.eq('business_id', branch); yestOrdQ = yestOrdQ.eq('business_id', branch) }

    // ── Reservas ─────────────────────────────────────────────────────────────
    let todayResQ = supabase.from('reservations').select('party_size').gte('created_at', tS).lte('created_at', tE)
    let yestResQ  = supabase.from('reservations').select('party_size').gte('created_at', yS).lte('created_at', yE)
    if (branch !== 'all') { todayResQ = todayResQ.eq('business_id', branch); yestResQ = yestResQ.eq('business_id', branch) }

    const [todayOrd, yestOrd, todayRes, yestRes] = await Promise.all([todayOrdQ, yestOrdQ, todayResQ, yestResQ])

    const todayRevenue      = (todayOrd.data ?? []).reduce((s, o) => s + (o.final_price ?? 0), 0)
    const todayOrderCount   = (todayOrd.data ?? []).length
    const yestRevenue       = (yestOrd.data  ?? []).reduce((s, o) => s + (o.final_price ?? 0), 0)
    const yestOrderCount    = (yestOrd.data  ?? []).length
    const todayReservations = (todayRes.data ?? []).length
    const todayCovers       = (todayRes.data ?? []).reduce((s, r) => s + (r.party_size ?? 0), 0)
    const yestReservations  = (yestRes.data  ?? []).length
    const yestCovers        = (yestRes.data  ?? []).reduce((s, r) => s + (r.party_size ?? 0), 0)

    function delta(today: number, yesterday: number): number {
      if (yesterday === 0) return today > 0 ? 100 : 0
      return Math.round(((today - yesterday) / yesterday) * 100)
    }

    return NextResponse.json({
      revenue:      { value: todayRevenue,      delta: delta(todayRevenue, yestRevenue) },
      orders:       { value: todayOrderCount,   delta: delta(todayOrderCount, yestOrderCount) },
      reservations: { value: todayReservations, delta: delta(todayReservations, yestReservations) },
      covers:       { value: todayCovers,       delta: delta(todayCovers, yestCovers) },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[kpis/today] ERROR:', detail)
    return NextResponse.json({ error: 'Error calculando KPIs de hoy', detail }, { status: 500 })
  }
}
