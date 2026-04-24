// Dashboard global — consolida todos los KPIs del día en una sola llamada.
// No requiere credenciales externas: solo orders, reservations, analytics_sessions.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession } from '@/lib/auth/session'

// Fuente de verdad de locales — no depende de la tabla businesses.
const KNOWN_BRANCHES = [
  { id: 'providencia', name: 'Providencia' },
  { id: 'vitacura',    name: 'Vitacura'    },
  { id: 'la-reina',   name: 'La Reina'    },
  { id: 'la-dehesa',  name: 'La Dehesa'   },
]

export async function GET() {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const isSuperAdmin = auth.profile.role === 'super_admin' || auth.profile.branches.includes('*')
  const allowedBranches = isSuperAdmin ? null : auth.profile.branches

  const supabase = await createAdminClient()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const todayISO  = startOfDay.toISOString()
  const nowISO    = new Date().toISOString()
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  try {
    let ordersQ = supabase
      .from('orders')
      .select('id, status, final_price, customer_phone, order_type, business_id, driver_id')
      .gte('created_at', todayISO)
    if (allowedBranches) ordersQ = ordersQ.in('business_id', allowedBranches)

    let reservationsQ = supabase
      .from('reservations')
      .select('id, status, party, business_id')
      .gte('created_at', todayISO)
    if (allowedBranches) reservationsQ = reservationsQ.in('business_id', allowedBranches)

    let beforeQ = supabase
      .from('orders')
      .select('customer_phone')
      .lt('created_at', todayISO)
    if (allowedBranches) beforeQ = beforeQ.in('business_id', allowedBranches)

    const [
      { data: ordersToday },
      { data: reservationsToday },
      { count: onlineNow },
      { count: visitsToday },
      { data: beforeCustomers },
    ] = await Promise.all([
      ordersQ,
      reservationsQ,
      supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('last_seen_at', twoMinAgo),
      supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('started_at', todayISO),
      beforeQ,
    ])

    const orders = ordersToday ?? []

    // ── Pedidos ───────────────────────────────────────────────────────────────
    const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']
    const completed  = orders.filter(o => o.status === 'completed')
    const active     = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
    const pending    = orders.filter(o => o.status === 'pending')
    const revenue    = completed.reduce((s, o) => s + (o.final_price ?? 0), 0)
    const avgTicket  = completed.length > 0 ? Math.round(revenue / completed.length) : 0

    // ── Delivery ──────────────────────────────────────────────────────────────
    const deliveries         = orders.filter(o => o.order_type === 'delivery')
    const deliveryActive     = deliveries.filter(o => !['completed', 'cancelled'].includes(o.status))
    const deliveryDelivered  = deliveries.filter(o => o.status === 'completed')
    const deliveryUnassigned = deliveryActive.filter(o => !o.driver_id)

    // ── Clientes ──────────────────────────────────────────────────────────────
    const todayPhones    = new Set(orders.map(o => o.customer_phone).filter(Boolean))
    const beforePhones   = new Set((beforeCustomers ?? []).map(o => o.customer_phone))
    const newCustomers   = [...todayPhones].filter(p => !beforePhones.has(p)).length
    const returning      = todayPhones.size - newCustomers

    // ── Reservas ──────────────────────────────────────────────────────────────
    const reservations = reservationsToday ?? []
    const resCovers = reservations
      .filter(r => !['cancelled', 'no_show'].includes(r.status))
      .reduce((s, r) => s + (r.party ?? 0), 0)

    // ── Por local ─────────────────────────────────────────────────────────────
    const visibleBranches = allowedBranches
      ? KNOWN_BRANCHES.filter(b => allowedBranches.includes(b.id))
      : KNOWN_BRANCHES

    const branchList = visibleBranches.map(b => {
      const bOrders    = orders.filter(o => o.business_id === b.id)
      const bCompleted = bOrders.filter(o => o.status === 'completed')
      const bActive    = bOrders.filter(o => ACTIVE_STATUSES.includes(o.status))
      const bRevenue   = bCompleted.reduce((s, o) => s + (o.final_price ?? 0), 0)
      const bRes       = reservations.filter(r => r.business_id === b.id)
      const bCovers    = bRes
        .filter(r => !['cancelled', 'no_show'].includes(r.status))
        .reduce((s, r) => s + (r.party ?? 0), 0)

      return {
        id:               b.id,
        name:             b.name,
        revenue:          bRevenue,
        avg_ticket:       bCompleted.length > 0 ? Math.round(bRevenue / bCompleted.length) : 0,
        orders_completed: bCompleted.length,
        orders_active:    bActive.length,
        reservations:     bRes.length,
        covers:           bCovers,
      }
    })

    const maxRevenue      = Math.max(...branchList.map(b => b.revenue), 1)
    const maxOrders       = Math.max(...branchList.map(b => b.orders_completed), 1)
    const maxReservations = Math.max(...branchList.map(b => b.reservations), 1)

    const branches = branchList
      .map(b => ({
        ...b,
        score: Math.round(
          (b.revenue / maxRevenue) * 50 +
          (b.orders_completed / maxOrders) * 30 +
          (b.reservations / maxReservations) * 20
        ),
      }))
      .sort((a, b) => b.score - a.score)

    return NextResponse.json({
      today: {
        revenue,
        avg_ticket:              avgTicket,
        orders_completed:        completed.length,
        orders_active:           active.length,
        orders_pending:          pending.length,
        reservations_total:      reservations.length,
        reservations_confirmed:  reservations.filter(r => r.status === 'confirmed').length,
        reservations_checkins:   reservations.filter(r => r.status === 'checked_in').length,
        reservations_noshows:    reservations.filter(r => r.status === 'no_show').length,
        reservations_covers:     resCovers,
        delivery_active:         deliveryActive.length,
        delivery_delivered:      deliveryDelivered.length,
        delivery_unassigned:     deliveryUnassigned.length,
        customers_unique:        todayPhones.size,
        customers_new:           newCustomers,
        customers_returning:     returning,
        visits_today:            visitsToday ?? 0,
        online_now:              onlineNow ?? 0,
      },
      branches,
      last_updated: nowISO,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[kpis/global-summary] ERROR:', detail)
    return NextResponse.json({ error: 'Error calculando resumen global', detail }, { status: 500 })
  }
}
