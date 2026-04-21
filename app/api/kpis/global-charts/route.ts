// Datos para gráficos del dashboard.
// ?branch=all → multi-local (global). ?branch=providencia → solo ese local.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

const ALL_BRANCHES = [
  { id: 'providencia', name: 'Providencia' },
  { id: 'vitacura',    name: 'Vitacura'    },
  { id: 'la-reina',   name: 'La Reina'    },
  { id: 'la-dehesa',  name: 'La Dehesa'   },
]

const FRANJAS = ['12:00', '13:00', '14:00', '19:00', '20:00', '21:00']

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const branch = req.nextUrl.searchParams.get('branch') ?? 'all'
  const isSingle = branch !== 'all'
  const branches = isSingle
    ? ALL_BRANCHES.filter(b => b.id === branch)
    : ALL_BRANCHES
  const branchIds = branches.map(b => b.id)

  const supabase = await createAdminClient()
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0)

  try {
    let ordersQ = supabase
      .from('orders')
      .select('business_id, final_price, status, order_type, created_at')
      .gte('created_at', startOfDay.toISOString())
    if (isSingle) ordersQ = ordersQ.eq('business_id', branch)

    let weekQ = supabase
      .from('orders')
      .select('business_id, final_price, status, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('status', 'completed')
    if (isSingle) weekQ = weekQ.eq('business_id', branch)

    let resQ = supabase
      .from('reservations')
      .select('business_id, party, status, created_at')
      .gte('created_at', startOfDay.toISOString())
    if (isSingle) resQ = resQ.eq('business_id', branch)

    const [{ data: ordersToday }, { data: ordersWeek }, { data: reservationsToday }] =
      await Promise.all([ordersQ, weekQ, resQ])

    const orders = ordersToday ?? []
    const week   = ordersWeek  ?? []
    const res    = reservationsToday ?? []

    // ── 1. Revenue por hora ───────────────────────────────────────────────────
    const hoursMap: Record<string, Record<string, number>> = {}
    for (let h = 0; h <= now.getHours(); h++) {
      const key = `${String(h).padStart(2, '0')}:00`
      hoursMap[key] = Object.fromEntries(branchIds.map(id => [id, 0]))
    }
    for (const o of orders) {
      if (o.status !== 'completed') continue
      const h = new Date(o.created_at).getHours()
      const key = `${String(h).padStart(2, '0')}:00`
      if (hoursMap[key] && branchIds.includes(o.business_id)) {
        hoursMap[key][o.business_id] += o.final_price ?? 0
      }
    }
    const revenueByHour = Object.entries(hoursMap).map(([hora, vals]) => ({ hora, ...vals }))

    // ── 2. Tendencia 7 días ───────────────────────────────────────────────────
    const daysMap: Record<string, Record<string, number>> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })
      daysMap[key] = Object.fromEntries(branchIds.map(id => [id, 0]))
    }
    for (const o of week) {
      const key = new Date(o.created_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })
      if (daysMap[key] && branchIds.includes(o.business_id)) {
        daysMap[key][o.business_id] += o.final_price ?? 0
      }
    }
    const revenueTrend = Object.entries(daysMap).map(([dia, vals]) => ({ dia, ...vals }))

    // ── 3. Reservas por franja ────────────────────────────────────────────────
    const franjasMap: Record<string, Record<string, number>> = {}
    for (const f of FRANJAS) {
      franjasMap[f] = Object.fromEntries(branchIds.map(id => [id, 0]))
    }
    for (const r of res) {
      if (['cancelled', 'no_show'].includes(r.status)) continue
      const h = new Date(r.created_at).getHours()
      const closest = FRANJAS.reduce((prev, curr) => {
        const [ph] = prev.split(':').map(Number)
        const [ch] = curr.split(':').map(Number)
        return Math.abs(ch - h) < Math.abs(ph - h) ? curr : prev
      })
      if (franjasMap[closest] && branchIds.includes(r.business_id)) {
        franjasMap[closest][r.business_id] += 1
      }
    }
    const reservasByFranja = FRANJAS.map(franja => ({ franja, ...franjasMap[franja] }))

    // ── 4. Mix de tipos de pedido ─────────────────────────────────────────────
    const orderMix = branches.map(b => {
      const bOrders = orders.filter(o => o.business_id === b.id)
      return {
        local:    b.name,
        delivery: bOrders.filter(o => o.order_type === 'delivery').length,
        dine_in:  bOrders.filter(o => o.order_type === 'dine_in').length,
        takeaway: bOrders.filter(o => o.order_type === 'takeaway').length,
      }
    })

    return NextResponse.json({
      branch,
      revenue_by_hour:    revenueByHour,
      revenue_trend:      revenueTrend,
      reservas_by_franja: reservasByFranja,
      order_mix:          orderMix,
      branches,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[kpis/global-charts] ERROR:', detail)
    return NextResponse.json({ error: 'Error calculando gráficos', detail }, { status: 500 })
  }
}
