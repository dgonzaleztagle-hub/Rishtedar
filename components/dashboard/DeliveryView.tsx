'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Clock, CheckCircle2, MapPin, Phone, User,
  Navigation, Package, AlertCircle, ChevronDown, ChevronUp,
  Plus, Bike, Car, Footprints, MessageCircle, ToggleLeft, ToggleRight,
  Loader2, RefreshCw, ExternalLink,
} from 'lucide-react'
import { formatCLP } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Driver } from '@/types'

// ─── Local types ──────────────────────────────────────────────────────────────

type DeliveryStatus = 'assigned' | 'pickup' | 'on_route' | 'delivered' | 'issue'

interface DeliveryOrder {
  id:             string
  order_number:   string
  customer_name:  string
  customer_phone: string
  address:        string
  neighborhood:   string
  items:          string[]
  total:          number
  status:         DeliveryStatus
  driver_id?:     string
  driver_name?:   string
  driver_phone?:  string
  driver_token?:  string
  distance_km:    number
  notes?:         string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; icon: typeof Clock; color: string; bg: string; step: number }> = {
  assigned:  { label: 'Asignado',   icon: User,         color: 'text-amber-700',   bg: 'bg-amber-50',   step: 1 },
  pickup:    { label: 'Recogiendo', icon: Package,      color: 'text-blue-700',    bg: 'bg-blue-50',    step: 2 },
  on_route:  { label: 'En camino',  icon: Navigation,   color: 'text-purple-700',  bg: 'bg-purple-50',  step: 3 },
  delivered: { label: 'Entregado',  icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', step: 4 },
  issue:     { label: 'Problema',   icon: AlertCircle,  color: 'text-red-700',     bg: 'bg-red-50',     step: 0 },
}

const VEHICLE_ICON: Record<Driver['vehicle'], typeof Truck> = {
  moto:  Truck,
  bici:  Bike,
  auto:  Car,
  a_pie: Footprints,
}

const VEHICLE_LABEL: Record<Driver['vehicle'], string> = {
  moto:  'Moto',
  bici:  'Bicicleta',
  auto:  'Auto',
  a_pie: 'A pie',
}

const STEPS = ['Asignado', 'Recogiendo', 'En camino', 'Entregado']

const API_NEXT_STATUS: Record<DeliveryStatus, string | null> = {
  assigned:  'pickup',
  pickup:    'in_transit',
  on_route:  'delivered',
  delivered: null,
  issue:     null,
}

const UI_NEXT_STATUS: Record<DeliveryStatus, DeliveryStatus> = {
  assigned:  'pickup',
  pickup:    'on_route',
  on_route:  'delivered',
  delivered: 'delivered',
  issue:     'assigned',
}

const NEXT_LABEL: Record<DeliveryStatus, string> = {
  assigned:  '→ Recogiendo',
  pickup:    '→ En camino',
  on_route:  '→ Entregado',
  delivered: '',
  issue:     '',
}

type DriverForm = { name: string; phone: string; vehicle: Driver['vehicle']; zone: string }
const EMPTY_FORM: DriverForm = { name: '', phone: '', vehicle: 'moto', zone: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBusinessId(): string {
  if (typeof window === 'undefined') return 'providencia'
  try {
    return JSON.parse(localStorage.getItem('rishtedar_branch') || '{}')?.id || 'providencia'
  } catch { return 'providencia' }
}

// Mapear status del API → DeliveryStatus de UI
const API_TO_UI: Record<string, DeliveryStatus> = {
  assigned:   'assigned',
  pickup:     'pickup',
  in_transit: 'on_route',
  delivered:  'delivered',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryView() {
  const [orders, setOrders]                 = useState<DeliveryOrder[]>([])
  const [loadingOrders, setLoadingOrders]   = useState(true)
  const [drivers, setDrivers]               = useState<Driver[]>([])
  const [expanded, setExpanded]             = useState<string | null>(null)
  const [assignModal, setAssignModal]       = useState<string | null>(null)
  const [assigningId, setAssigningId]       = useState<string | null>(null)
  const [advancingId, setAdvancingId]       = useState<string | null>(null)
  const [waResult, setWaResult]             = useState<{ waUrl: string; driverName: string } | null>(null)
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [driverForm, setDriverForm]         = useState<DriverForm>(EMPTY_FORM)
  const [savingDriver, setSavingDriver]     = useState(false)
  const [requestingExternal, setRequestingExternal] = useState(false)

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const businessId = getBusinessId()
    try {
      const res = await fetch(`/api/orders?business_id=${businessId}&view=delivery`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      const mapped: DeliveryOrder[] = (json.orders ?? []).map((row: {
        id: string; order_number: string; customer_name: string; customer_phone: string
        address: string; neighborhood: string; items: string[]; total: number
        tracking_status: string | null; driver_id: string | null; driver_name: string | null
        driver_phone: string | null; driver_token: string | null
      }) => ({
        id:            row.id,
        order_number:  row.order_number,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        address:       row.address,
        neighborhood:  row.neighborhood,
        items:         row.items,
        total:         row.total,
        status:        row.tracking_status ? (API_TO_UI[row.tracking_status] ?? 'assigned') : 'assigned',
        driver_id:     row.driver_id    ?? undefined,
        driver_name:   row.driver_name  ?? undefined,
        driver_phone:  row.driver_phone ?? undefined,
        driver_token:  row.driver_token ?? undefined,
        distance_km:   0,
      }))

      setOrders(mapped)
      // Auto-expand el primero activo si no hay nada expandido
      setExpanded(prev => prev ?? mapped.find(o => o.status !== 'delivered')?.id ?? null)
    } catch (err) {
      console.error('[DeliveryView] fetchOrders', err)
      toast.error('Error al cargar pedidos')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  // ── Fetch drivers ──────────────────────────────────────────────────────────
  const fetchDrivers = useCallback(async () => {
    const businessId = getBusinessId()
    try {
      const res = await fetch(`/api/drivers?business_id=${businessId}`)
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.drivers)) setDrivers(json.drivers)
      }
    } catch { /* silencioso */ }
  }, [])

  // ── Realtime: delivery_tracking + nuevas órdenes ───────────────────────────
  useEffect(() => {
    fetchOrders()
    fetchDrivers()

    const supabase = createClient()
    const businessId = getBusinessId()

    const channel = supabase
      .channel('delivery_realtime')
      // Cambios en delivery_tracking → actualizar estado en UI
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_tracking' },
        (payload) => {
          const updated = payload.new as {
            order_id: string; status: string
            driver_name?: string; driver_id?: string; driver_token?: string
          }
          if (!updated?.order_id) return
          setOrders(prev => prev.map(o =>
            o.id === updated.order_id
              ? {
                  ...o,
                  status:       API_TO_UI[updated.status] ?? o.status,
                  driver_name:  updated.driver_name  ?? o.driver_name,
                  driver_id:    updated.driver_id    ?? o.driver_id,
                  driver_token: updated.driver_token ?? o.driver_token,
                }
              : o
          ))
        }
      )
      // Nueva orden de delivery → refetch para incluirla con sus items
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const newOrder = payload.new as { order_type: string }
          if (newOrder?.order_type === 'delivery') {
            fetchOrders()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders, fetchDrivers])

  // ── Assign driver ──────────────────────────────────────────────────────────
  async function handleAssign(orderId: string, driver: Driver) {
    setAssigningId(driver.id)
    try {
      const res = await fetch('/api/delivery/assign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order_id: orderId, driver_id: driver.id, business_id: driver.business_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, driver_id: driver.id, driver_name: driver.name, driver_phone: driver.phone, driver_token: json.token, status: 'assigned' }
          : o
      ))
      setWaResult({ waUrl: json.waUrl, driverName: driver.name })
    } catch (err) {
      toast.error('Error al asignar repartidor')
      console.error('[assign]', err)
    } finally {
      setAssigningId(null)
      setAssignModal(null)
    }
  }

  // ── Advance status (desde el dashboard) ───────────────────────────────────
  async function advanceStatus(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const nextApiStatus = API_NEXT_STATUS[order.status]
    if (!nextApiStatus) return

    // Optimistic update
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: UI_NEXT_STATUS[o.status] } : o
    ))

    if (!order.driver_token) {
      // Sin token aún no podemos persistir — la UI avanzó visualmente
      return
    }

    setAdvancingId(orderId)
    try {
      const res = await fetch(`/api/delivery/${order.driver_token}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: nextApiStatus }),
      })
      if (!res.ok) throw new Error('Error al actualizar estado')
    } catch {
      // Revertir optimistic update
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: order.status } : o
      ))
      toast.error('Error al actualizar estado del pedido')
    } finally {
      setAdvancingId(null)
    }
  }

  // ── Request external driver (Uber Direct) ─────────────────────────────────
  async function handleRequestExternal(orderId: string) {
    setRequestingExternal(true)
    try {
      const businessId = getBusinessId()
      const res = await fetch('/api/delivery/request-external', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order_id: orderId, business_id: businessId }),
      })
      const json = await res.json()
      if (!json.configured) {
        toast.info('Uber Direct: credenciales pendientes. Se activará automáticamente cuando estén configuradas.')
      }
    } catch {
      toast.error('Error al conectar con Uber Direct')
    } finally {
      setRequestingExternal(false)
    }
  }

  // ── Save new driver ────────────────────────────────────────────────────────
  async function handleSaveDriver(e: React.FormEvent) {
    e.preventDefault()
    if (!driverForm.name || !driverForm.phone) {
      toast.error('Nombre y teléfono son obligatorios')
      return
    }
    setSavingDriver(true)
    const businessId = getBusinessId()

    try {
      const res = await fetch('/api/drivers', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...driverForm, business_id: businessId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDrivers(prev => [json.driver, ...prev])
      toast.success(`${json.driver.name} registrado`)
    } catch (err) {
      toast.error('Error al registrar repartidor')
      console.error('[saveDriver]', err)
    } finally {
      setSavingDriver(false)
      setDriverForm(EMPTY_FORM)
      setShowDriverForm(false)
    }
  }

  // ── Toggle driver active ───────────────────────────────────────────────────
  async function toggleDriver(driver: Driver) {
    const newVal = !driver.is_active
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, is_active: newVal } : d))
    try {
      await fetch(`/api/drivers?id=${driver.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: newVal }),
      })
    } catch { /* silencioso */ }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const active        = orders.filter(o => o.status !== 'delivered')
  const delivered     = orders.filter(o => o.status === 'delivered')
  const unassigned    = orders.filter(o => !o.driver_id)
  const activeDrivers = drivers.filter(d => d.is_active)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Delivery</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {loadingOrders
              ? 'Cargando pedidos…'
              : `${active.length} en curso · ${delivered.length} entregados hoy`
            }
            {!loadingOrders && unassigned.length > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {unassigned.length} sin repartidor</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="p-1.5 text-warm-400 hover:text-warm-700 transition-colors disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} />
          </button>
          <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tiempo real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Orders column ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-3">

          {/* Loading skeleton */}
          {loadingOrders && (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="bg-white border border-warm-200 h-16 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingOrders && orders.length === 0 && (
            <div className="bg-white border border-warm-200 py-14 text-center">
              <Truck size={28} className="text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500 text-sm">No hay pedidos de delivery hoy</p>
              <p className="text-warm-400 text-xs mt-1">Los pedidos confirmados aparecerán aquí automáticamente</p>
            </div>
          )}

          {/* Active orders */}
          {active.map(order => {
            const cfg          = STATUS_CONFIG[order.status]
            const isUnassigned = !order.driver_id
            const Icon         = isUnassigned ? User : cfg.icon
            const driver       = drivers.find(d => d.id === order.driver_id)
            const isExpanded   = expanded === order.id
            const canAdvance   = order.status !== 'delivered' && !!order.driver_id

            return (
              <div key={order.id} className="bg-white border border-warm-200 overflow-hidden">
                {/* Progress bar */}
                <div className="h-0.5 bg-warm-100">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isUnassigned              ? 'bg-amber-300'  :
                      order.status === 'delivered' ? 'bg-emerald-500' :
                      order.status === 'on_route'  ? 'bg-purple-500' :
                      order.status === 'pickup'    ? 'bg-blue-500'   : 'bg-amber-400'
                    }`}
                    style={{ width: isUnassigned ? '5%' : `${(cfg.step / 4) * 100}%` }}
                  />
                </div>

                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-warm-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium w-28 ${isUnassigned ? 'bg-amber-50 text-amber-700' : `${cfg.bg} ${cfg.color}`}`}>
                    <Icon size={11} />
                    {isUnassigned ? 'Sin asignar' : cfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-warm-900 text-sm">{order.customer_name}</span>
                      <span className="text-warm-400 text-xs hidden sm:inline">{order.order_number}</span>
                    </div>
                    <p className="text-warm-500 text-xs mt-0.5 truncate">
                      <MapPin size={9} className="inline mr-0.5" />
                      {order.address}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-warm-700 font-medium text-sm">{formatCLP(order.total)}</p>
                  </div>
                  {isExpanded
                    ? <ChevronUp  size={14} className="text-warm-400 shrink-0" />
                    : <ChevronDown size={14} className="text-warm-400 shrink-0" />
                  }
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-warm-100 px-5 py-4 bg-warm-50 space-y-4">

                    {/* Progress steps */}
                    <div className="flex items-center gap-0">
                      {STEPS.map((step, i) => {
                        const done    = cfg.step > i
                        const current = cfg.step === i + 1
                        return (
                          <div key={step} className="flex-1 flex items-center">
                            <div className={`flex flex-col items-center gap-1 flex-1 ${i > 0 ? 'relative' : ''}`}>
                              {i > 0 && (
                                <div className={`absolute left-0 right-1/2 top-2.5 h-0.5 -translate-y-1/2 ${done || current ? 'bg-brand-700' : 'bg-warm-200'}`} />
                              )}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 text-[9px] font-bold ${
                                done    ? 'bg-brand-700 text-ivory' :
                                current ? 'bg-brand-700 text-ivory ring-2 ring-brand-200' :
                                          'bg-warm-200 text-warm-500'
                              }`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-[9px] text-center leading-tight ${current ? 'text-brand-700 font-medium' : 'text-warm-400'}`}>
                                {step}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider text-[10px] mb-1">Platos</p>
                        {order.items.length > 0
                          ? order.items.map(item => <p key={item} className="text-warm-700">· {item}</p>)
                          : <p className="text-warm-400 italic">Sin detalle</p>
                        }
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider text-[10px] mb-1">Destino</p>
                        <p className="text-warm-700 leading-snug">{order.address}</p>
                        {order.notes && <p className="text-amber-600 mt-1">⚠ {order.notes}</p>}
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider text-[10px] mb-1">Total</p>
                        <p className="text-warm-900 font-semibold">{formatCLP(order.total)}</p>
                      </div>
                    </div>

                    {/* Driver + actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {driver ? (
                        <div className="flex items-center gap-2 bg-white border border-warm-200 px-3 py-2">
                          <div className="w-7 h-7 bg-warm-100 flex items-center justify-center">
                            <User size={13} className="text-warm-600" />
                          </div>
                          <div>
                            <p className="text-warm-800 text-xs font-medium">{driver.name}</p>
                            <p className="text-warm-400 text-[10px]">{VEHICLE_LABEL[driver.vehicle]}{driver.zone ? ` · ${driver.zone}` : ''}</p>
                          </div>
                          <a href={`tel:${driver.phone}`} className="ml-2 p-1.5 text-warm-400 hover:text-warm-700 transition-colors">
                            <Phone size={12} />
                          </a>
                          {/* Link a app del repartidor */}
                          {order.driver_token && (
                            <a
                              href={`/driver/${order.driver_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 p-1.5 text-warm-400 hover:text-warm-700 transition-colors"
                              title="Ver app del repartidor"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssignModal(order.id)}
                          className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 hover:bg-amber-100 transition-colors"
                        >
                          <User size={12} />
                          Asignar repartidor
                        </button>
                      )}

                      {canAdvance && (
                        <button
                          onClick={() => advanceStatus(order.id)}
                          disabled={advancingId === order.id}
                          className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-ivory text-xs px-4 py-2 transition-colors"
                        >
                          {advancingId === order.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Truck size={12} />
                          }
                          {NEXT_LABEL[order.status]}
                        </button>
                      )}

                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex items-center gap-1.5 text-warm-500 hover:text-warm-700 text-xs border border-warm-200 px-3 py-2 hover:bg-warm-100 transition-colors"
                      >
                        <Phone size={11} />
                        Cliente
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Delivered */}
          {delivered.length > 0 && (
            <div className="bg-white border border-warm-200">
              <div className="px-5 py-3 border-b border-warm-100">
                <p className="text-xs font-medium text-warm-500 uppercase tracking-wider">Entregados hoy · {delivered.length}</p>
              </div>
              <div className="divide-y divide-warm-50">
                {delivered.map(order => (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3 opacity-60">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-warm-700 text-sm">{order.customer_name}</span>
                      <span className="text-warm-400 text-xs ml-2 hidden sm:inline">{order.order_number}</span>
                    </div>
                    <span className="text-warm-500 text-xs hidden sm:block truncate max-w-32">{order.neighborhood}</span>
                    <span className="text-warm-600 text-sm font-medium">{formatCLP(order.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Drivers column ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          <div className="bg-white border border-warm-200">
            <div className="px-4 py-3 border-b border-warm-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={13} className="text-brand-700" />
                <p className="text-xs font-medium text-warm-700">Repartidores</p>
              </div>
              <button
                onClick={() => setShowDriverForm(v => !v)}
                className="flex items-center gap-1 text-brand-700 hover:text-brand-900 text-xs font-medium transition-colors"
              >
                <Plus size={12} />
                Registrar
              </button>
            </div>

            {/* Driver enrollment form */}
            <AnimatePresence>
              {showDriverForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-warm-100"
                >
                  <form onSubmit={handleSaveDriver} className="px-4 py-4 space-y-3 bg-warm-50">
                    <p className="text-xs font-medium text-warm-700 mb-2">Nuevo repartidor</p>
                    <input
                      type="text" placeholder="Nombre completo *"
                      value={driverForm.name}
                      onChange={e => setDriverForm(v => ({ ...v, name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 bg-white"
                    />
                    <input
                      type="tel" placeholder="Teléfono (sin +56, ej: 912345678) *"
                      value={driverForm.phone}
                      onChange={e => setDriverForm(v => ({ ...v, phone: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 bg-white"
                    />
                    <select
                      value={driverForm.vehicle}
                      onChange={e => setDriverForm(v => ({ ...v, vehicle: e.target.value as Driver['vehicle'] }))}
                      className="w-full px-3 py-2 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 bg-white"
                    >
                      <option value="moto">Moto</option>
                      <option value="bici">Bicicleta</option>
                      <option value="auto">Auto</option>
                      <option value="a_pie">A pie</option>
                    </select>
                    <input
                      type="text" placeholder="Zona (ej: Providencia Norte)"
                      value={driverForm.zone}
                      onChange={e => setDriverForm(v => ({ ...v, zone: e.target.value }))}
                      className="w-full px-3 py-2 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 bg-white"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setShowDriverForm(false); setDriverForm(EMPTY_FORM) }}
                        className="flex-1 border border-warm-300 text-warm-600 py-2 text-xs uppercase tracking-wider hover:border-warm-400 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingDriver}
                        className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-ivory py-2 text-xs uppercase tracking-wider transition-colors"
                      >
                        {savingDriver ? 'Guardando…' : 'Registrar'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drivers list */}
            <div className="divide-y divide-warm-50">
              {drivers.length === 0 && (
                <p className="px-4 py-6 text-center text-warm-400 text-xs">
                  No hay repartidores. Registra el primero.
                </p>
              )}
              {drivers.map(driver => {
                const VehicleIcon = VEHICLE_ICON[driver.vehicle]
                return (
                  <div
                    key={driver.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-opacity ${!driver.is_active ? 'opacity-40' : ''}`}
                  >
                    <div className="w-8 h-8 bg-warm-100 flex items-center justify-center shrink-0">
                      <VehicleIcon size={14} className="text-warm-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-warm-800 text-xs font-medium truncate">{driver.name}</p>
                      <p className="text-warm-400 text-[10px] truncate">
                        {VEHICLE_LABEL[driver.vehicle]}{driver.zone ? ` · ${driver.zone}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleDriver(driver)}
                      className="shrink-0 text-warm-400 hover:text-warm-700 transition-colors"
                      title={driver.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {driver.is_active
                        ? <ToggleRight size={18} className="text-emerald-500" />
                        : <ToggleLeft  size={18} className="text-warm-300" />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Activos ahora',    value: String(activeDrivers.length), sub: 'repartidores' },
              { label: 'En curso',         value: String(active.length),        sub: 'pedidos' },
              { label: 'Entregados hoy',   value: String(delivered.length),     sub: 'pedidos' },
              { label: 'Sin asignar',      value: String(unassigned.length),    sub: 'pedidos', alert: unassigned.length > 0 },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-white border p-4 ${kpi.alert ? 'border-amber-300 bg-amber-50' : 'border-warm-200'}`}>
                <p className={`text-2xl font-semibold ${kpi.alert ? 'text-amber-700' : 'text-warm-900'}`}>{kpi.value}</p>
                <p className="text-[10px] text-warm-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Assign driver modal ───────────────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-warm-200 flex items-center justify-between">
              <p className="font-medium text-warm-900">Asignar repartidor</p>
              <button onClick={() => setAssignModal(null)} className="text-warm-400 hover:text-warm-700">✕</button>
            </div>

            {/* Drivers list */}
            <div className="divide-y divide-warm-100 max-h-60 overflow-y-auto">
              {activeDrivers.map(driver => {
                const VehicleIcon = VEHICLE_ICON[driver.vehicle]
                const isAssigning = assigningId === driver.id
                return (
                  <button
                    key={driver.id}
                    onClick={() => handleAssign(assignModal, driver)}
                    disabled={!!assigningId}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-warm-50 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="w-9 h-9 bg-warm-100 flex items-center justify-center shrink-0">
                      <VehicleIcon size={16} className="text-warm-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-warm-800 text-sm font-medium">{driver.name}</p>
                      <p className="text-warm-400 text-xs">{VEHICLE_LABEL[driver.vehicle]}{driver.zone ? ` · ${driver.zone}` : ''}</p>
                    </div>
                    {isAssigning
                      ? <Loader2 size={14} className="text-brand-600 animate-spin" />
                      : <span className="text-emerald-600 text-xs font-medium">Disponible</span>
                    }
                  </button>
                )
              })}
              {activeDrivers.length === 0 && (
                <div className="px-5 py-6 text-center text-warm-400 text-sm">
                  No hay repartidores activos
                </div>
              )}
            </div>

            {/* Uber Direct placeholder */}
            <div className="border-t border-warm-100 px-5 py-4 bg-warm-50">
              <p className="text-[10px] text-warm-400 uppercase tracking-wider mb-3">O solicitar repartidor externo</p>
              <button
                onClick={() => handleRequestExternal(assignModal)}
                disabled={requestingExternal}
                className="w-full flex items-center justify-between px-4 py-3 border border-warm-200 hover:border-warm-300 bg-white hover:bg-warm-50 transition-colors disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-black rounded flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">U</span>
                  </div>
                  <div className="text-left">
                    <p className="text-warm-800 text-sm font-medium">Uber Direct</p>
                    <p className="text-warm-400 text-xs">Repartidor bajo demanda · ~15 min</p>
                  </div>
                </div>
                {requestingExternal
                  ? <Loader2 size={14} className="text-warm-400 animate-spin" />
                  : <span className="text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5">Próximamente</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp result modal ─────────────────────────────────────────── */}
      {waResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-warm-900">Repartidor asignado</p>
              <p className="text-warm-500 text-sm mt-1">{waResult.driverName} fue asignado al pedido.</p>
            </div>
            <a
              href={waResult.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1db954] text-white py-3 text-sm font-medium transition-colors"
              onClick={() => setWaResult(null)}
            >
              <MessageCircle size={16} />
              Enviar link por WhatsApp
            </a>
            <button
              onClick={() => setWaResult(null)}
              className="text-warm-400 hover:text-warm-600 text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
