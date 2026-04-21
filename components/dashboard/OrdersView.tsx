'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Clock, ChefHat, CheckCircle2, XCircle,
  Search, Eye
} from 'lucide-react'
import { formatCLP } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { LOCATIONS } from '@/lib/locations'
import type { OrderStatus } from '@/types'

// ─── Local name map ───────────────────────────────────────────────────────────

const LOCAL_NAMES: Record<string, string> = Object.fromEntries(
  LOCATIONS.map(l => [l.id, l.name.replace(/^Rishtedar\s+/i, '')])
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id:             string
  order_number:   string
  customer_name:  string
  customer_phone: string
  order_type:     string
  final_price:    number
  status:         OrderStatus
  items:          string[]
  items_count:    number
  address:        string
  created_at:     string
  business_id:    string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  icon: Clock,         color: 'text-amber-700',  bg: 'bg-amber-50'  },
  confirmed: { label: 'Confirmado', icon: CheckCircle2,  color: 'text-blue-700',   bg: 'bg-blue-50'   },
  preparing: { label: 'Preparando', icon: ChefHat,       color: 'text-purple-700', bg: 'bg-purple-50' },
  ready:     { label: 'Listo',      icon: CheckCircle2,  color: 'text-emerald-700',bg: 'bg-emerald-50'},
  completed: { label: 'Completado', icon: CheckCircle2,  color: 'text-warm-600',   bg: 'bg-warm-100'  },
  cancelled: { label: 'Cancelado',  icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50'    },
}

const TYPE_LABEL: Record<string, string> = {
  delivery: '🛵 Delivery',
  dine_in:  '🪑 Local',
  takeaway: '📦 Retiro',
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'completed',
  completed: null,
  cancelled: null,
}

const NEXT_LABEL: Record<string, string> = {
  pending:   'Confirmar',
  confirmed: 'Preparando',
  preparing: 'Listo',
  ready:     'Completar',
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'all',       label: 'Todas'      },
  { key: 'pending',   label: 'Pendiente'  },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready',     label: 'Listo'      },
  { key: 'completed', label: 'Completado' },
]

function getBusinessId(): string {
  if (typeof window === 'undefined') return ''
  try {
    return JSON.parse(localStorage.getItem('rishtedar_branch') || '{}')?.id ?? ''
  } catch { return '' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersView() {
  const [orders,   setOrders]   = useState<OrderRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const businessId = getBusinessId()
    if (!businessId) return
    try {
      const res = await fetch(`/api/orders?business_id=${businessId}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setOrders(json.orders ?? [])
    } catch (err) {
      console.error('[OrdersView] fetchOrders', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Initial load + realtime ────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders()

    const supabase    = createClient()
    const businessId  = getBusinessId()
    const isAdmin     = !businessId || businessId === 'admin'

    const insertCfg = isAdmin
      ? { event: 'INSERT' as const, schema: 'public', table: 'orders' }
      : { event: 'INSERT' as const, schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` }

    const updateCfg = isAdmin
      ? { event: 'UPDATE' as const, schema: 'public', table: 'orders' }
      : { event: 'UPDATE' as const, schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` }

    const channel = supabase
      .channel('orders-view')
      // Nueva orden → refetch para traer items completos
      .on('postgres_changes', insertCfg, () => {
        fetchOrders()
      })
      // Cambio de estado → actualizar en local state directamente
      .on('postgres_changes', updateCfg, (payload) => {
        const updated = payload.new as { id: string; status: OrderStatus }
        if (!updated?.id) return
        setOrders(prev => prev.map(o =>
          o.id === updated.id ? { ...o, status: updated.status } : o
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  // ── Advance status ─────────────────────────────────────────────────────────
  async function advance(id: string) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const next = NEXT_STATUS[order.status]
    if (!next) return

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o))
    setAdvancing(id)

    try {
      const res = await fetch('/api/orders', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status: next }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (err) {
      console.error('[OrdersView] advance', err)
      // Revertir
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: order.status } : o))
    } finally {
      setAdvancing(null)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Órdenes</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {loading ? '…' : `${active} activas · ${orders.length} en las últimas 24 h`}
          </p>
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
          {loading && (
            <div className="px-6 py-12 text-center text-warm-400 text-sm">Cargando órdenes…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-warm-400 text-sm">
              No hay órdenes que coincidan
            </div>
          )}
          {filtered.map(order => {
            const cfg        = STATUS_CONFIG[order.status]
            const Icon       = cfg.icon
            const isExpanded = expanded === order.id
            const canAdvance = NEXT_STATUS[order.status] !== null
            const isAdv      = advancing === order.id
            const localName  = LOCAL_NAMES[order.business_id] ?? order.business_id

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
                      {TYPE_LABEL[order.order_type] ?? order.order_type} · {localName}
                      {order.items_count > 0 ? ` · ${order.items_count} platos` : ''}
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
                        disabled={isAdv}
                        className="bg-brand-800 hover:bg-brand-900 text-ivory text-xs px-3 py-1.5 transition-colors hidden sm:block disabled:opacity-50"
                      >
                        {isAdv ? '…' : NEXT_LABEL[order.status]}
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
                        {order.items.length > 0
                          ? <ul className="space-y-0.5">{order.items.map((i, idx) => <li key={idx} className="text-warm-700">· {i}</li>)}</ul>
                          : <p className="text-warm-400">Sin detalle</p>
                        }
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider mb-1">
                          {order.order_type === 'delivery' ? 'Dirección' : 'Tipo'}
                        </p>
                        <p className="text-warm-700">
                          {order.order_type === 'delivery' ? (order.address || 'Sin dirección') : TYPE_LABEL[order.order_type]}
                        </p>
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
                        disabled={isAdv}
                        className="mt-3 sm:hidden bg-brand-800 text-ivory text-xs px-4 py-2 transition-colors disabled:opacity-50"
                      >
                        → {NEXT_LABEL[order.status]}
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
