// KPIs header — alimenta las cards principales del dashboard analytics.
// ?branch=all|providencia|vitacura&from=2026-04-01&to=2026-04-30

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const branch = searchParams.get('branch') ?? 'all'
  const from   = searchParams.get('from') ?? startOfMonth()
  const to     = searchParams.get('to')   ?? new Date().toISOString()

  const supabase = await createAdminClient()

  try {
    // ── 1. Pedidos: count + revenue + ticket promedio ─────────────────────────
    let ordQ = supabase
      .from('orders')
      .select('final_price', { count: 'exact' })
      .eq('status', 'completed')
      .gte('created_at', from)
      .lte('created_at', to)
    if (branch !== 'all') ordQ = ordQ.eq('business_id', branch)
    const { data: ordersData, count: ordersCount, error: ordErr } = await ordQ
    if (ordErr) throw ordErr

    const totalRevenue = (ordersData ?? []).reduce((s: number, o: { final_price: number }) => s + (o.final_price ?? 0), 0)
    const orderCount   = ordersCount ?? 0
    const avgTicket    = orderCount > 0 ? totalRevenue / orderCount : 0

    // ── 2. Reservas ───────────────────────────────────────────────────────────
    let resQ = supabase
      .from('reservations')
      .select('id', { count: 'exact' })
      .gte('created_at', from)
      .lte('created_at', to)
    if (branch !== 'all') resQ = resQ.eq('business_id', branch)
    const { count: reservationCount, error: resErr } = await resQ
    if (resErr) throw resErr

    // ── 3. Sesiones + conversión ──────────────────────────────────────────────
    let sessQ = supabase
      .from('analytics_sessions')
      .select('converted', { count: 'exact' })
      .gte('started_at', from)
      .lte('started_at', to)
    if (branch !== 'all') sessQ = sessQ.eq('business_id', branch)
    const { data: sessData, count: sessCount, error: sessErr } = await sessQ
    if (sessErr) throw sessErr

    const totalSessions  = sessCount ?? 0
    const convertedCount = (sessData ?? []).filter((s: { converted: boolean }) => s.converted).length
    const conversionRate = totalSessions > 0 ? (convertedCount / totalSessions) * 100 : 0

    // ── 4. Clientes captados ──────────────────────────────────────────────────
    const { count: subscriberCount } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact' })
      .gte('created_at', from)
      .lte('created_at', to)

    let clientQ = supabase
      .from('orders')
      .select('customer_phone')
      .gte('created_at', from)
      .lte('created_at', to)
    if (branch !== 'all') clientQ = clientQ.eq('business_id', branch)
    const { data: clientData } = await clientQ
    const uniqueClients = new Set((clientData ?? []).map((o: { customer_phone: string }) => o.customer_phone)).size

    // ── 5. Nuevos vs recurrentes ──────────────────────────────────────────────
    let beforeQ = supabase
      .from('orders')
      .select('customer_phone')
      .lt('created_at', from)
    if (branch !== 'all') beforeQ = beforeQ.eq('business_id', branch)
    const { data: beforeData } = await beforeQ
    const returningPhones  = new Set((beforeData ?? []).map((o: { customer_phone: string }) => o.customer_phone))
    const newClients       = (clientData ?? []).filter((o: { customer_phone: string }) => !returningPhones.has(o.customer_phone)).length
    const returningClients = uniqueClients - newClients

    // ── 6. Carritos abandonados ───────────────────────────────────────────────
    let cartQ = supabase
      .from('carts')
      .select('id', { count: 'exact' })
      .eq('status', 'abandoned')
      .gte('created_at', from)
      .lte('created_at', to)
    if (branch !== 'all') cartQ = cartQ.eq('business_id', branch)
    const { count: abandonedCarts } = await cartQ

    return NextResponse.json({
      period: { from, to },
      branch,
      orders: {
        count:         orderCount,
        total_revenue: totalRevenue,
        avg_ticket:    Math.round(avgTicket),
      },
      reservations: {
        count: reservationCount ?? 0,
      },
      sessions: {
        count:           totalSessions,
        converted:       convertedCount,
        conversion_rate: Math.round(conversionRate * 10) / 10,
      },
      customers: {
        unique:         uniqueClients,
        new:            newClients,
        returning:      returningClients,
        leads_captured: subscriberCount ?? 0,
      },
      carts: {
        abandoned: abandonedCarts ?? 0,
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[kpis/overview] ERROR:', detail)
    return NextResponse.json({ error: 'Error calculando KPIs', detail }, { status: 500 })
  }
}

function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
