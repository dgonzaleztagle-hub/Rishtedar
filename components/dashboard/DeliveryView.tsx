'use client'

import { useState } from 'react'
import {
  Truck, Clock, CheckCircle2, MapPin, Phone, User,
  Navigation, Package, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatCLP } from '@/lib/utils'

type DeliveryStatus = 'assigned' | 'pickup' | 'on_route' | 'delivered' | 'issue'
type DriverStatus = 'available' | 'on_route' | 'offline'

interface Driver {
  id: string
  name: string
  phone: string
  vehicle: string
  status: DriverStatus
  current_order?: string
  eta?: string
  zone: string
}

interface DeliveryOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  address: string
  neighborhood: string
  items: string[]
  total: number
  status: DeliveryStatus
  driver_id?: string
  pickup_time?: string
  estimated_delivery?: string
  distance_km: number
  notes?: string
}

const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Rodrigo Muñoz', phone: '+56 9 8123 4567', vehicle: 'Moto · ABCD12', status: 'on_route', current_order: 'RSH-ABC123', eta: '8 min', zone: 'Providencia' },
  { id: 'd2', name: 'Felipe Castro', phone: '+56 9 7234 5678', vehicle: 'Bici eléctrica', status: 'available', zone: 'Providencia / Ñuñoa' },
  { id: 'd3', name: 'Carlos Vera', phone: '+56 9 6345 6789', vehicle: 'Moto · EFGH34', status: 'on_route', current_order: 'RSH-GHI789', eta: '15 min', zone: 'Vitacura' },
  { id: 'd4', name: 'Andrés Silva', phone: '+56 9 5456 7890', vehicle: 'Moto · IJKL56', status: 'available', zone: 'Las Condes / Vitacura' },
  { id: 'd5', name: 'Matías Torres', phone: '+56 9 4567 8901', vehicle: 'Bici eléctrica', status: 'offline', zone: 'La Dehesa' },
]

const ORDERS: DeliveryOrder[] = [
  {
    id: 'ord-001', order_number: 'RSH-ABC123',
    customer_name: 'María González', customer_phone: '+56 9 8765 4321',
    address: 'Av. Providencia 1234, Depto 52', neighborhood: 'Providencia',
    items: ['Chicken Tikka Masala', 'Garlic Naan x2'],
    total: 27800, status: 'on_route', driver_id: 'd1',
    pickup_time: '19:42', estimated_delivery: '20:05',
    distance_km: 2.3,
  },
  {
    id: 'ord-003', order_number: 'RSH-GHI789',
    customer_name: 'Ana Martínez', customer_phone: '+56 9 6543 2109',
    address: 'Los Leones 890, Piso 3', neighborhood: 'Providencia',
    items: ['Biryani Pollo'],
    total: 15900, status: 'pickup', driver_id: 'd3',
    pickup_time: '19:55', estimated_delivery: '20:20',
    distance_km: 3.1,
  },
  {
    id: 'ord-new1', order_number: 'RSH-VWX234',
    customer_name: 'Diego Morales', customer_phone: '+56 9 3210 9876',
    address: 'Alonso de Córdova 4000, Depto 82', neighborhood: 'Vitacura',
    items: ['Butter Chicken', 'Palak Paneer', 'Mango Lassi'],
    total: 35400, status: 'assigned', driver_id: 'd4',
    estimated_delivery: '20:35',
    distance_km: 4.2,
    notes: 'Timbre 82, dejar con conserje',
  },
  {
    id: 'ord-new2', order_number: 'RSH-YZA567',
    customer_name: 'Sofía Herrera', customer_phone: '+56 9 4321 0987',
    address: 'Ricardo Lyon 222, Dpto 12', neighborhood: 'Providencia',
    items: ['Lamb Rogan Josh', 'Dal Makhani'],
    total: 33900, status: 'assigned',
    estimated_delivery: '20:40',
    distance_km: 1.8,
  },
  {
    id: 'ord-done1', order_number: 'RSH-BCD890',
    customer_name: 'Roberto Pérez', customer_phone: '+56 9 5432 1098',
    address: 'El Bosque Norte 500', neighborhood: 'Las Condes',
    items: ['Tandoori Mixed Grill', 'Gulab Jamun x2'],
    total: 46700, status: 'delivered',
    pickup_time: '18:30', estimated_delivery: '19:00',
    distance_km: 3.8,
  },
]

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; icon: typeof Clock; color: string; bg: string; step: number }> = {
  assigned: { label: 'Asignado', icon: User, color: 'text-amber-700', bg: 'bg-amber-50', step: 1 },
  pickup: { label: 'Recogiendo', icon: Package, color: 'text-blue-700', bg: 'bg-blue-50', step: 2 },
  on_route: { label: 'En camino', icon: Navigation, color: 'text-purple-700', bg: 'bg-purple-50', step: 3 },
  delivered: { label: 'Entregado', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', step: 4 },
  issue: { label: 'Problema', icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50', step: 0 },
}

const DRIVER_STATUS: Record<DriverStatus, { label: string; color: string; dot: string }> = {
  available: { label: 'Disponible', color: 'text-emerald-700', dot: 'bg-emerald-500' },
  on_route: { label: 'En ruta', color: 'text-blue-700', dot: 'bg-blue-500' },
  offline: { label: 'Offline', color: 'text-warm-400', dot: 'bg-warm-400' },
}

const STEPS = ['Asignado', 'Recogiendo', 'En camino', 'Entregado']

export function DeliveryView() {
  const [orders, setOrders] = useState(ORDERS)
  const [expanded, setExpanded] = useState<string | null>('ord-001')
  const [assignModal, setAssignModal] = useState<string | null>(null)

  function advanceStatus(orderId: string) {
    const next: Record<DeliveryStatus, DeliveryStatus> = {
      assigned: 'pickup',
      pickup: 'on_route',
      on_route: 'delivered',
      delivered: 'delivered',
      issue: 'assigned',
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next[o.status] } : o))
  }

  function assignDriver(orderId: string, driverId: string) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driver_id: driverId, status: 'assigned' } : o))
    setAssignModal(null)
  }

  const active = orders.filter(o => o.status !== 'delivered')
  const delivered = orders.filter(o => o.status === 'delivered')
  const unassigned = orders.filter(o => !o.driver_id && o.status === 'assigned')
  const availableDrivers = DRIVERS.filter(d => d.status === 'available')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Delivery</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            {active.length} en curso · {delivered.length} entregados hoy
            {unassigned.length > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {unassigned.length} sin repartidor</span>
            )}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tiempo real
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Orders column */}
        <div className="xl:col-span-2 space-y-3">

          {/* Active orders */}
          {active.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            const Icon = cfg.icon
            const driver = DRIVERS.find(d => d.id === order.driver_id)
            const isExpanded = expanded === order.id
            const canAdvance = order.status !== 'delivered' && order.driver_id
            const nextLabel: Record<DeliveryStatus, string> = {
              assigned: '→ Recogiendo',
              pickup: '→ En camino',
              on_route: '→ Entregado',
              delivered: '',
              issue: '',
            }

            return (
              <div key={order.id} className="bg-white border border-warm-200 overflow-hidden">
                {/* Progress bar */}
                <div className="h-0.5 bg-warm-100">
                  <div
                    className={`h-full transition-all duration-500 ${
                      order.status === 'delivered' ? 'bg-emerald-500' :
                      order.status === 'on_route' ? 'bg-purple-500' :
                      order.status === 'pickup' ? 'bg-blue-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${(cfg.step / 4) * 100}%` }}
                  />
                </div>

                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-warm-50 transition-colors"
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
                    <p className="text-warm-500 text-xs mt-0.5 truncate">
                      <MapPin size={9} className="inline mr-0.5" />
                      {order.address}
                    </p>
                  </div>

                  {/* ETA */}
                  <div className="shrink-0 text-right hidden sm:block">
                    {driver?.eta && order.status === 'on_route' ? (
                      <>
                        <p className="text-purple-700 font-medium text-sm">{driver.eta}</p>
                        <p className="text-warm-400 text-xs">ETA</p>
                      </>
                    ) : order.estimated_delivery ? (
                      <>
                        <p className="text-warm-700 font-medium text-sm">{order.estimated_delivery}</p>
                        <p className="text-warm-400 text-xs">estimado</p>
                      </>
                    ) : null}
                  </div>

                  {isExpanded ? <ChevronUp size={14} className="text-warm-400 shrink-0" /> : <ChevronDown size={14} className="text-warm-400 shrink-0" />}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-warm-100 px-5 py-4 bg-warm-50 space-y-4">
                    {/* Steps */}
                    <div className="flex items-center gap-0">
                      {STEPS.map((step, i) => {
                        const done = cfg.step > i
                        const current = cfg.step === i + 1
                        return (
                          <div key={step} className="flex-1 flex items-center">
                            <div className={`flex flex-col items-center gap-1 flex-1 ${i > 0 ? 'relative' : ''}`}>
                              {i > 0 && (
                                <div className={`absolute left-0 right-1/2 top-2.5 h-0.5 -translate-y-1/2 ${done || current ? 'bg-brand-700' : 'bg-warm-200'}`} />
                              )}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 text-[9px] font-bold ${
                                done ? 'bg-brand-700 text-ivory' :
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
                        {order.items.map(i => <p key={i} className="text-warm-700">· {i}</p>)}
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider text-[10px] mb-1">Destino</p>
                        <p className="text-warm-700">{order.address}</p>
                        {order.notes && <p className="text-amber-600 mt-1">⚠ {order.notes}</p>}
                      </div>
                      <div>
                        <p className="text-warm-400 uppercase tracking-wider text-[10px] mb-1">Total</p>
                        <p className="text-warm-900 font-semibold">{formatCLP(order.total)}</p>
                        <p className="text-warm-400 mt-1">{order.distance_km} km</p>
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
                            <p className="text-warm-400 text-[10px]">{driver.vehicle}</p>
                          </div>
                          <a href={`tel:${driver.phone}`} className="ml-2 p-1.5 text-warm-400 hover:text-warm-700 hover:bg-warm-50 transition-colors">
                            <Phone size={12} />
                          </a>
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
                          className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-900 text-ivory text-xs px-4 py-2 transition-colors"
                        >
                          <Truck size={12} />
                          {nextLabel[order.status]}
                        </button>
                      )}

                      <a href={`tel:${order.customer_phone}`}
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
                    <span className="text-warm-500 text-xs hidden sm:block">{order.neighborhood}</span>
                    <span className="text-warm-600 text-sm font-medium">{formatCLP(order.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drivers column */}
        <div className="space-y-4">
          {/* Mock map */}
          <div className="bg-white border border-warm-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-100 flex items-center gap-2">
              <MapPin size={13} className="text-brand-700" />
              <p className="text-xs font-medium text-warm-700">Mapa de repartos</p>
            </div>
            <div
              className="relative h-52 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #e8f0e4 0%, #d4e0d0 25%, #c8d8c4 50%, #d0dccc 75%, #e0e8dc 100%)',
              }}
            >
              {/* Street grid overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4a7a4a" strokeWidth="0.5"/>
                  </pattern>
                  <pattern id="blocks" width="120" height="80" patternUnits="userSpaceOnUse">
                    <rect width="120" height="80" fill="none" stroke="#3a6a3a" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect width="100%" height="100%" fill="url(#blocks)" opacity="0.5" />
                {/* Main roads */}
                <line x1="0" y1="40" x2="300" y2="40" stroke="#b8c8b0" strokeWidth="3" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="#b8c8b0" strokeWidth="4" />
                <line x1="0" y1="160" x2="300" y2="160" stroke="#b8c8b0" strokeWidth="3" />
                <line x1="80" y1="0" x2="80" y2="210" stroke="#b8c8b0" strokeWidth="3" />
                <line x1="160" y1="0" x2="160" y2="210" stroke="#b8c8b0" strokeWidth="4" />
                <line x1="240" y1="0" x2="240" y2="210" stroke="#b8c8b0" strokeWidth="3" />
              </svg>

              {/* Restaurant pin */}
              <div className="absolute" style={{ top: '38%', left: '42%' }}>
                <div className="w-6 h-6 bg-brand-800 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                  <UtensilsCrossed size={10} className="text-ivory" />
                </div>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] bg-warm-900 text-ivory px-1 py-0.5 rounded">
                  Providencia
                </div>
              </div>

              {/* Driver 1 - on route */}
              <div className="absolute animate-pulse" style={{ top: '22%', left: '65%' }}>
                <div className="w-5 h-5 bg-purple-600 border-2 border-white rounded-full flex items-center justify-center shadow">
                  <Truck size={9} className="text-white" />
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] bg-purple-700 text-white px-1 py-0.5 rounded whitespace-nowrap">
                  Rodrigo · 8 min
                </div>
              </div>

              {/* Driver 2 - pickup */}
              <div className="absolute" style={{ top: '52%', left: '55%' }}>
                <div className="w-5 h-5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow">
                  <Truck size={9} className="text-white" />
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] bg-blue-700 text-white px-1 py-0.5 rounded whitespace-nowrap">
                  Carlos
                </div>
              </div>

              {/* Delivery destination pin */}
              <div className="absolute" style={{ top: '15%', left: '72%' }}>
                <div className="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow" />
              </div>

              {/* Map attribution */}
              <div className="absolute bottom-2 right-2 text-[8px] text-warm-500/70 bg-white/60 px-1 rounded">
                Mapa demo · Google Maps en producción
              </div>
            </div>
          </div>

          {/* Drivers list */}
          <div className="bg-white border border-warm-200">
            <div className="px-4 py-3 border-b border-warm-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={13} className="text-brand-700" />
                <p className="text-xs font-medium text-warm-700">Repartidores</p>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                {availableDrivers.length} disponibles
              </span>
            </div>
            <div className="divide-y divide-warm-50">
              {DRIVERS.map(driver => {
                const dst = DRIVER_STATUS[driver.status]
                const activeOrder = ORDERS.find(o => o.driver_id === driver.id && o.status !== 'delivered')
                return (
                  <div key={driver.id} className={`flex items-center gap-3 px-4 py-3 ${driver.status === 'offline' ? 'opacity-40' : ''}`}>
                    <div className="relative">
                      <div className="w-8 h-8 bg-warm-100 flex items-center justify-center">
                        <User size={14} className="text-warm-600" />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${dst.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-warm-800 text-xs font-medium truncate">{driver.name}</p>
                      <p className="text-warm-400 text-[10px] truncate">{driver.vehicle}</p>
                      {activeOrder && (
                        <p className="text-[10px] text-blue-600 truncate">{activeOrder.order_number} · {driver.eta}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium ${dst.color}`}>{dst.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tiempo promedio', value: '28 min', sub: 'por entrega' },
              { label: 'En ruta ahora', value: '2', sub: 'repartidores' },
              { label: 'Entregados hoy', value: String(delivered.length), sub: 'pedidos' },
              { label: 'Sin asignar', value: String(unassigned.length), sub: 'pedidos', alert: unassigned.length > 0 },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-white border p-4 ${kpi.alert ? 'border-amber-300 bg-amber-50' : 'border-warm-200'}`}>
                <p className={`text-2xl font-semibold ${kpi.alert ? 'text-amber-700' : 'text-warm-900'}`}>{kpi.value}</p>
                <p className="text-[10px] text-warm-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assign driver modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-warm-200 flex items-center justify-between">
              <p className="font-medium text-warm-900">Asignar repartidor</p>
              <button onClick={() => setAssignModal(null)} className="text-warm-400 hover:text-warm-700">✕</button>
            </div>
            <div className="divide-y divide-warm-100">
              {DRIVERS.filter(d => d.status === 'available').map(driver => (
                <button
                  key={driver.id}
                  onClick={() => assignDriver(assignModal, driver.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-warm-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-warm-100 flex items-center justify-center">
                    <User size={16} className="text-warm-600" />
                  </div>
                  <div>
                    <p className="text-warm-800 text-sm font-medium">{driver.name}</p>
                    <p className="text-warm-400 text-xs">{driver.vehicle} · {driver.zone}</p>
                  </div>
                  <span className="ml-auto text-emerald-600 text-xs font-medium">Disponible</span>
                </button>
              ))}
              {DRIVERS.filter(d => d.status === 'available').length === 0 && (
                <div className="px-5 py-8 text-center text-warm-400 text-sm">
                  No hay repartidores disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UtensilsCrossed({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>
    </svg>
  )
}
