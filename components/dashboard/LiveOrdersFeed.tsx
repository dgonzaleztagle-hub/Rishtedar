'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCLP } from '@/lib/utils'
import { Clock, CheckCircle2, ChefHat, Truck, XCircle, ShoppingBag } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmado', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  preparing: { label: 'Preparando', icon: ChefHat, color: 'text-purple-600', bg: 'bg-purple-50' },
  ready: { label: 'Listo', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  completed: { label: 'Completado', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
}

// Demo orders (in production loaded from Supabase + Realtime subscription)
const DEMO_ORDERS: Partial<Order>[] = [
  {
    id: 'ord-001', order_number: 'RSH-ABC123', customer_name: 'María González',
    order_type: 'delivery', final_price: 27800, status: 'preparing',
    items_count: 2, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-002', order_number: 'RSH-DEF456', customer_name: 'Carlos Rodríguez',
    order_type: 'dine_in', final_price: 43500, status: 'ready',
    items_count: 4, created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-003', order_number: 'RSH-GHI789', customer_name: 'Ana Martínez',
    order_type: 'delivery', final_price: 15900, status: 'confirmed',
    items_count: 1, created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-004', order_number: 'RSH-JKL012', customer_name: 'Roberto Pérez',
    order_type: 'takeaway', final_price: 22300, status: 'pending',
    items_count: 2, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-005', order_number: 'RSH-MNO345', customer_name: 'Sofia Herrera',
    order_type: 'dine_in', final_price: 58700, status: 'completed',
    items_count: 5, created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
]

function timeAgo(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  return `hace ${Math.floor(mins / 60)}h`
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  delivery: 'Delivery',
  dine_in: 'Local',
  takeaway: 'Retiro',
}

export function LiveOrdersFeed() {
  const [orders, setOrders] = useState<Partial<Order>[]>(DEMO_ORDERS)
  const [_, setTick] = useState(0)

  // Tick every minute to update "time ago"
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // In production: Supabase Realtime subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || !supabaseUrl.startsWith('http')) return

    const supabase = createClient()
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev].slice(0, 20))
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev =>
            prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o)
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function updateStatus(orderId: string, status: OrderStatus) {
    // Demo: update locally
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))

    // In production:
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', orderId)
  }

  return (
    <div className="bg-white border border-warm-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-200">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-brand-700" />
          <h2 className="font-medium text-warm-900">Órdenes en curso</h2>
          <span className="flex items-center gap-1 text-emerald-600 text-xs ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tiempo real
          </span>
        </div>
        <span className="text-warm-500 text-xs">{orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} activas</span>
      </div>

      <div className="divide-y divide-warm-100">
        {orders.map(order => {
          const status = order.status as OrderStatus
          const cfg = STATUS_CONFIG[status]
          const Icon = cfg.icon

          return (
            <div key={order.id} className="px-4 py-3 hover:bg-warm-50 transition-colors">
              {/* Top row: name + time + price */}
              <div className="flex items-center gap-2 min-w-0">
                <p className="flex-1 font-medium text-warm-900 text-sm truncate">{order.customer_name}</p>
                <span className="shrink-0 text-warm-400 text-xs">{timeAgo(order.created_at!)}</span>
                <p className="shrink-0 text-warm-800 font-medium text-sm">{formatCLP(order.final_price!)}</p>
              </div>
              {/* Bottom row: status + type + action */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className={`flex items-center gap-1 px-2 py-1 ${cfg.bg} ${cfg.color} text-[10px] font-medium`}>
                  <Icon size={10} />
                  {cfg.label}
                </div>
                <span className="text-warm-400 text-xs">{ORDER_TYPE_LABEL[order.order_type!]} · {order.items_count} platos</span>
                <span className="hidden sm:inline text-warm-300 text-xs">{order.order_number}</span>
                {status === 'pending' && (
                  <button onClick={() => updateStatus(order.id!, 'confirmed')} className="ml-auto shrink-0 bg-brand-700 hover:bg-brand-800 text-ivory text-xs px-3 py-1 transition-colors">Confirmar</button>
                )}
                {status === 'confirmed' && (
                  <button onClick={() => updateStatus(order.id!, 'preparing')} className="ml-auto shrink-0 bg-purple-600 hover:bg-purple-700 text-ivory text-xs px-3 py-1 transition-colors">Preparando</button>
                )}
                {status === 'preparing' && (
                  <button onClick={() => updateStatus(order.id!, 'ready')} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-ivory text-xs px-3 py-1 transition-colors">Listo</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
