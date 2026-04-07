'use client'

import { useState } from 'react'
import {
  ShoppingBag, Clock, ChefHat, CheckCircle2, XCircle,
  Truck, Filter, Search, Eye
} from 'lucide-react'
import { formatCLP } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const DEMO_ORDERS = [
  {
    id: 'ord-001', order_number: 'RSH-ABC123', customer_name: 'María González',
    customer_phone: '+56 9 8765 4321',
    order_type: 'delivery', final_price: 27800, status: 'preparing' as OrderStatus,
    items_count: 2, local: 'Providencia',
    items: ['Chicken Tikka Masala', 'Garlic Naan'],
    address: 'Av. Providencia 1234, Depto 52',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-002', order_number: 'RSH-DEF456', customer_name: 'Carlos Rodríguez',
    customer_phone: '+56 9 7654 3210',
    order_type: 'dine_in', final_price: 43500, status: 'ready' as OrderStatus,
    items_count: 4, local: 'Vitacura',
    items: ['Lamb Rogan Josh', 'Paneer Tikka', 'Dal Makhani', 'Lassi Mango'],
    address: 'Mesa 4',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-003', order_number: 'RSH-GHI789', customer_name: 'Ana Martínez',
    customer_phone: '+56 9 6543 2109',
    order_type: 'delivery', final_price: 15900, status: 'confirmed' as OrderStatus,
    items_count: 1, local: 'Providencia',
    items: ['Biryani Pollo'],
    address: 'Los Leones 890, Piso 3',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-004', order_number: 'RSH-JKL012', customer_name: 'Roberto Pérez',
    customer_phone: '+56 9 5432 1098',
    order_type: 'takeaway', final_price: 22300, status: 'pending' as OrderStatus,
    items_count: 2, local: 'La Reina',
    items: ['Samosa x2', 'Chicken Korma'],
    address: 'Retiro en local',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-005', order_number: 'RSH-MNO345', customer_name: 'Sofía Herrera',
    customer_phone: '+56 9 4321 0987',
    order_type: 'dine_in', final_price: 58700, status: 'completed' as OrderStatus,
    items_count: 5, local: 'Providencia',
    items: ['Tandoori Mixed Grill', 'Saag Paneer', 'Gulab Jamun x2', 'Chai x3'],
    address: 'Mesa 7',
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-006', order_number: 'RSH-PQR678', customer_name: 'Diego Morales',
    customer_phone: '+56 9 3210 9876',
    order_type: 'delivery', final_price: 35400, status: 'completed' as OrderStatus,
    items_count: 3, local: 'La Dehesa',
    items: ['Butter Chicken', 'Palak Paneer', 'Mango Lassi'],
    address: 'El Rodeo 12840',
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-007', order_number: 'RSH-STU901', customer_name: 'Isabel Ruiz',
    customer_phone: '+56 9 2109 8765',
    order_type: 'delivery', final_price: 19200, status: 'cancelled' as OrderStatus,
    items_count: 2, local: 'Vitacura',
    items: ['Vegetable Biryani', 'Raita'],
    address: 'Alonso de Córdova 4000',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
]

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmado', icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-50' },
  preparing: { label: 'Preparando', icon: ChefHat, color: 'text-purple-700', bg: 'bg-purple-50' },
  ready: { label: 'Listo', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  completed: { label: 'Completado', icon: CheckCircle2, color: 'text-warm-600', bg: 'bg-warm-100' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
}

const TYPE_LABEL: Record<string, string> = {
  delivery: '🛵 Delivery',
  dine_in: '🪑 Local',
  takeaway: '📦 Retiro',
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready', label: 'Listo' },
  { key: 'completed', label: 'Completado' },
]

export function OrdersView() {
  const [orders, setOrders] = useState(DEMO_ORDERS)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  function advance(id: string) {
    const next: Record<OrderStatus, OrderStatus> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed',
      completed: 'completed',
      cancelled: 'cancelled',
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next[o.status] } : o))
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.order_number.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Órdenes</h1>
          <p className="text-warm-500 text-sm mt-0.5">{active} activas · {orders.length} hoy</p>
        </div>
        <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tiempo real
        </span>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente o número..."
            className="w-full pl-9 pr-4 py-2.5 border border-warm-200 bg-white text-sm text-warm-800 placeholder:text-warm-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 text-xs transition-colors ${
                filter === f.key
                  ? 'bg-brand-800 text-ivory'
                  : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-warm-200">
        <div className="divide-y divide-warm-100">
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-warm-400 text-sm">
              No hay órdenes que coincidan
            </div>
          )}
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            const Icon = cfg.icon
            const isExpanded = expanded === order.id
            const canAdvance = ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
            const nextLabel: Record<string, string> = {
              pending: 'Confirmar',
              confirmed: 'Preparando',
              preparing: 'Listo',
              ready: 'Completar',
            }

            return (
              <div key={order.id}>
                <div
                  className="flex items-center gap-3 px-5 py-4 hover:bg-warm-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  {/* Status */}
                  <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 ${cfg.bg} ${cfg.color} text-xs font-medium w-28`}>
                    <Icon size={11} />
                    {cfg.label}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-warm-900 text-sm">{order.customer_name}</span>
                      <span className="text-warm-400 text-xs hidden sm:inline">{order.order_number}</span>
                    </div>
                    <p className="text-warm-500 text-xs mt-0.5">
                      {TYPE_LABEL[order.order_type]} · {order.local} · {order.items_count} platos
                    </p>
                  </div>

                  {/* Time + Price */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-warm-800 font-medium text-sm">{formatCLP(order.final_price)}</p>
                    <p className="text-warm-400 text-xs">{timeAgo(order.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {canAdvance && (
                      <button
                        onClick={() => advance(order.id)}
                        className="bg-brand-800 hover:bg-brand-900 text-ivory text-xs px-3 py-1.5 transition-colors hidden sm:block"
                      >
                        {nextLabel[order.status]}
                      </button>
                    )}
                    <Eye size={14} className="text-warm-400" />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-4 bg-warm-50 border-t border-warm-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider mb-1">Platos</p>
                        <ul className="space-y-0.5">
                          {order.items.map(i => <li key={i} className="text-warm-700">· {i}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider mb-1">Dirección</p>
                        <p className="text-warm-700">{order.address}</p>
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider mb-1">Contacto</p>
                        <p className="text-warm-700">{order.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-warm-900 font-semibold">{formatCLP(order.final_price)}</p>
                        <p className="text-warm-500 mt-1">{timeAgo(order.created_at)} atrás</p>
                      </div>
                    </div>
                    {canAdvance && (
                      <button
                        onClick={() => advance(order.id)}
                        className="mt-3 sm:hidden bg-brand-800 text-ivory text-xs px-4 py-2 transition-colors"
                      >
                        → {nextLabel[order.status]}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
