import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const DEMO_ORDER = {
  id: 'demo',
  order_number: 'RSH-2024-001',
  status: 'preparing',
  final_price: 28500,
  business_id: 'providencia',
  estimated_delivery_at: null,
  items: ['2× Butter Chicken', '1× Garlic Naan', '1× Mango Lassi'],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  if (orderId === 'demo') {
    return NextResponse.json(DEMO_ORDER)
  }

  const supabase = await createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, status, final_price, business_id, estimated_delivery_at')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('item_name, quantity')
    .eq('order_id', orderId)

  return NextResponse.json({
    ...order,
    items: (items ?? []).map(i => `${i.quantity}× ${i.item_name}`),
  })
}
