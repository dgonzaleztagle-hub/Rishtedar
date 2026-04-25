import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaffSession, requireBranchAccess } from '@/lib/auth/session'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackingRow {
  order_id:     string
  status:       string
  driver_id?:   string | null
  driver_name:  string | null
  driver_phone: string | null
  driver_token?: string | null
  driver_note?:  string | null
}

interface ItemRow {
  item_name: string | null
  quantity:  number
}

interface DbOrderRow {
  id:               string
  order_number:     string
  customer_name:    string
  customer_phone:   string
  delivery_address: string | null
  final_price:      number
  created_at:       string
  order_items:      ItemRow[] | null
  customer_note?:   string | null
}

interface DbOrderAllRow {
  id:               string
  order_number:     string
  customer_name:    string
  customer_phone:   string
  delivery_address: string | null
  final_price:      number
  created_at:       string
  order_type:       string
  status:           string
  business_id:      string
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildOrderShape(row: DbOrderRow, tracking: TrackingRow | null) {
  const items = (row.order_items ?? [])
    .map(i => (i.item_name ? (i.quantity > 1 ? `${i.item_name} x${i.quantity}` : i.item_name) : null))
    .filter(Boolean) as string[]

  const neighborhood = row.delivery_address
    ? (row.delivery_address.split(',').pop()?.trim() ?? '')
    : ''

  return {
    id:             row.id,
    order_number:   row.order_number,
    customer_name:  row.customer_name,
    customer_phone: row.customer_phone,
    address:        row.delivery_address ?? 'Sin dirección',
    neighborhood,
    items,
    total:          row.final_price,
    customer_note:   row.customer_note ?? null,
    tracking_status: tracking?.status    ?? null,
    driver_id:       tracking?.driver_id  ?? null,
    driver_name:     tracking?.driver_name ?? null,
    driver_phone:    tracking?.driver_phone ?? null,
    driver_token:    tracking?.driver_token ?? null,
    driver_note:     tracking?.driver_note ?? null,
  }
}

// ─── Shared: fetch items by order IDs ────────────────────────────────────────

async function fetchItemsByOrder(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  orderIds: string[],
): Promise<Record<string, ItemRow[]>> {
  const itemsByOrder: Record<string, ItemRow[]> = {}

  const { data: itemsFull, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id, item_name, quantity')
    .in('order_id', orderIds)

  if (!itemsError && itemsFull) {
    for (const item of itemsFull as (ItemRow & { order_id: string })[]) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push(item)
    }
  } else {
    const { data: itemsBase } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', orderIds)

    if (itemsBase) {
      for (const item of (itemsBase as { order_id: string; quantity: number }[])) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
        itemsByOrder[item.order_id].push({ item_name: null, quantity: item.quantity })
      }
    }
  }

  return itemsByOrder
}

// ─── GET ─────────────────────────────────────────────────────────────────────
//
// ?business_id=X&view=delivery  → pedidos delivery con tracking (DeliveryView)
// ?business_id=X                → todos los tipos, hoy (OrdersView)
// business_id=admin skips the branch filter

export async function GET(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const business_id = searchParams.get('business_id')
  const view        = searchParams.get('view') ?? 'all'

  if (!business_id) {
    return NextResponse.json({ error: 'Falta business_id' }, { status: 400 })
  }

  const isAdmin = business_id === 'admin' && auth.profile.role === 'super_admin'

  if (!isAdmin && !requireBranchAccess(auth.profile, business_id)) {
    return NextResponse.json({ error: 'Sin acceso a esta sucursal' }, { status: 403 })
  }

  try {
    const supabase = await createAdminClient()

    // Últimas 24 h
    const since = new Date()
    since.setHours(since.getHours() - 24)

    // ── view=delivery: órdenes delivery con tracking ──────────────────────
    if (view === 'delivery') {
      let q = supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, delivery_address, final_price, created_at, customer_note')
        .eq('order_type', 'delivery')
        .in('status', ['confirmed', 'preparing', 'ready', 'completed'])
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (!isAdmin) q = q.eq('business_id', business_id)

      const { data: ordersData, error: ordersError } = await q
      if (ordersError) throw ordersError
      if (!ordersData?.length) return NextResponse.json({ orders: [] })

      const orderIds    = ordersData.map((o: { id: string }) => o.id)
      const itemsByOrder = await fetchItemsByOrder(supabase, orderIds)

      // tracking
      const trackingMap: Record<string, TrackingRow> = {}
      const { data: trackingFull, error: trackingFullError } = await supabase
        .from('delivery_tracking')
        .select('order_id, status, driver_id, driver_name, driver_phone, driver_token, driver_note')
        .in('order_id', orderIds)

      if (!trackingFullError && trackingFull) {
        for (const t of trackingFull as (TrackingRow & { order_id: string })[]) {
          trackingMap[t.order_id] = t
        }
      } else {
        const { data: trackingBase } = await supabase
          .from('delivery_tracking')
          .select('order_id, status, driver_name, driver_phone')
          .in('order_id', orderIds)
        if (trackingBase) {
          for (const t of trackingBase as (TrackingRow & { order_id: string })[]) {
            trackingMap[t.order_id] = t
          }
        }
      }

      const orders = (ordersData as DbOrderRow[]).map(row =>
        buildOrderShape(
          { ...row, order_items: itemsByOrder[row.id] ?? null },
          trackingMap[row.id] ?? null,
        )
      )
      return NextResponse.json({ orders })
    }

    // ── view=all (default): todos los tipos, para OrdersView ─────────────
    let q = supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, delivery_address, final_price, created_at, order_type, status, business_id')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (!isAdmin) q = q.eq('business_id', business_id)

    const { data: ordersData, error: ordersError } = await q
    if (ordersError) throw ordersError
    if (!ordersData?.length) return NextResponse.json({ orders: [] })

    const orderIds     = ordersData.map((o: { id: string }) => o.id)
    const itemsByOrder = await fetchItemsByOrder(supabase, orderIds)

    const orders = (ordersData as DbOrderAllRow[]).map(row => {
      const items = (itemsByOrder[row.id] ?? [])
        .map(i => (i.item_name ? (i.quantity > 1 ? `${i.item_name} x${i.quantity}` : i.item_name) : null))
        .filter(Boolean) as string[]

      return {
        id:             row.id,
        order_number:   row.order_number,
        customer_name:  row.customer_name,
        customer_phone: row.customer_phone,
        order_type:     row.order_type,
        final_price:    row.final_price,
        status:         row.status,
        items,
        items_count:    items.length,
        address:        row.delivery_address ?? '',
        created_at:     row.created_at,
        business_id:    row.business_id,
      }
    })

    return NextResponse.json({ orders })

  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[orders GET] ERROR:', detail)
    return NextResponse.json({ error: 'Error al obtener pedidos', detail }, { status: 500 })
  }
}

// ─── PATCH /api/orders ────────────────────────────────────────────────────────
// Actualiza el estado de una orden. Usado por OrdersView al avanzar el estado.

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffSession()
  if (!auth.ok) return auth.response
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verificar que la orden pertenece a una sucursal accesible para este staff
    if (auth.profile.role !== 'super_admin' && !auth.profile.branches.includes('*')) {
      const { data: order } = await supabase
        .from('orders')
        .select('business_id')
        .eq('id', id)
        .single()

      if (!order || !requireBranchAccess(auth.profile, order.business_id)) {
        return NextResponse.json({ error: 'Sin acceso a esta orden' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[orders PATCH] ERROR:', detail)
    return NextResponse.json({ error: 'Error al actualizar orden', detail }, { status: 500 })
  }
}
