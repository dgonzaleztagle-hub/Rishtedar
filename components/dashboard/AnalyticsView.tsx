'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, BarChart3, Users, ShoppingBag,
  ShoppingCart, Globe, RefreshCw, MapPin,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCLP } from '@/lib/utils'
import { LiveCounter } from './LiveCounter'
import { BranchCharts } from './BranchCharts'
import { useStaffSession } from '@/hooks/useStaffSession'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Overview {
  period: { from: string; to: string }
  branch: string
  orders: { count: number; total_revenue: number; avg_ticket: number }
  reservations: { count: number }
  sessions: { count: number; converted: number; conversion_rate: number }
  customers: { unique: number; new: number; returning: number; leads_captured: number }
  carts: { abandoned: number }
}

interface Traffic {
  total_sessions: number
  timeline: { date: string; sessions: number }[]
  sources: { name: string; sessions: number; converted: number; conversion_rate: number }[]
  devices: { device: string; count: number }[]
}

interface BranchData {
  id: string
  name: string
  orders: number
  revenue: number
  avg_ticket: number
  reservations: number
  sessions: number
  conversion_rate: number
  score: number
}

// ─── Periodos ─────────────────────────────────────────────────────────────────

type PeriodKey = 'Hoy' | 'Esta semana' | 'Este mes' | 'Este año'

function periodRange(p: PeriodKey): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  const from = new Date()
  if (p === 'Hoy') {
    from.setHours(0, 0, 0, 0)
  } else if (p === 'Esta semana') {
    const day = from.getDay()
    from.setDate(from.getDate() - ((day + 6) % 7))
    from.setHours(0, 0, 0, 0)
  } else if (p === 'Este mes') {
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
  } else {
    from.setMonth(0, 1)
    from.setHours(0, 0, 0, 0)
  }
  return { from: from.toISOString(), to }
}

// ─── Colores ──────────────────────────────────────────────────────────────────

const BRAND   = '#91226f'
const GOLD    = '#c9952a'
const SOFT    = ['#91226f', '#c9952a', '#4f7cac', '#5cb85c', '#e87c2a', '#9b59b6']
const DEVICE_COLORS: Record<string, string> = {
  mobile: BRAND, desktop: GOLD, tablet: '#4f7cac', unknown: '#ccc',
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, iconClass, loading,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconClass: string
  loading: boolean
}) {
  return (
    <div className="bg-white border border-warm-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-warm-500 text-xs tracking-wider uppercase">{label}</p>
        <div className={`w-8 h-8 flex items-center justify-center ${iconClass}`}>
          <Icon size={14} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-warm-100 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-semibold text-warm-900">{value}</p>
      )}
      {sub && !loading && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
      <div className="h-full bg-brand-700 rounded-full" style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }} />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-warm-400">
      <BarChart3 size={32} className="mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
      <p className="text-xs mt-1">Los datos aparecerán a medida que lleguen visitas y pedidos</p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const BRANCH_NAMES: Record<string, string> = {
  'providencia': 'Providencia',
  'vitacura':    'Vitacura',
  'la-reina':    'La Reina',
  'la-dehesa':   'La Dehesa',
}

export function AnalyticsView() {
  const { activeBranch } = useStaffSession()
  const [period, setPeriod]       = useState<PeriodKey>('Este mes')
  const [branch, setBranch]       = useState('all')
  const [loading, setLoading]     = useState(true)
  const [overview, setOverview]   = useState<Overview | null>(null)
  const [traffic, setTraffic]     = useState<Traffic | null>(null)
  const [branches, setBranches]   = useState<BranchData[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const { from, to } = periodRange(period)
    const qs = `branch=${branch}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

    const [ovRes, trRes, brRes] = await Promise.all([
      fetch(`/api/kpis/overview?${qs}`),
      fetch(`/api/kpis/traffic?${qs}`),
      fetch(`/api/kpis/branches?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    ])

    if (ovRes.ok) setOverview(await ovRes.json())
    if (trRes.ok) setTraffic(await trRes.json())
    if (brRes.ok) setBranches((await brRes.json()).branches ?? [])
    setLoading(false)
  }, [period, branch])

  useEffect(() => { load() }, [load])

  const ov = overview

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Analytics</h1>
          <p className="text-warm-500 text-sm mt-0.5">KPIs y métricas del negocio</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs border border-warm-200 text-warm-600 hover:border-warm-400 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-wrap">
          {(['Hoy', 'Esta semana', 'Este mes', 'Este año'] as PeriodKey[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs transition-colors ${
                period === p ? 'bg-brand-800 text-ivory' : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={branch}
          onChange={e => setBranch(e.target.value)}
          className="text-xs border border-warm-200 px-3 py-2 text-warm-700 bg-white"
        >
          <option value="all">Todos los locales</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Contador live */}
      <LiveCounter branch={branch} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Revenue"
          value={ov ? formatCLP(ov.orders.total_revenue) : '—'}
          sub={ov ? `${ov.orders.count} pedidos completados` : undefined}
          icon={TrendingUp}
          iconClass="text-gold-700 bg-gold-50"
          loading={loading}
        />
        <KPICard
          label="Ticket promedio"
          value={ov ? formatCLP(ov.orders.avg_ticket) : '—'}
          icon={BarChart3}
          iconClass="text-purple-700 bg-purple-50"
          loading={loading}
        />
        <KPICard
          label="Reservas"
          value={ov ? String(ov.reservations.count) : '—'}
          icon={Users}
          iconClass="text-blue-700 bg-blue-50"
          loading={loading}
        />
        <KPICard
          label="Conversión web"
          value={ov ? `${ov.sessions.conversion_rate}%` : '—'}
          sub={ov ? `${ov.sessions.count} sesiones` : undefined}
          icon={Globe}
          iconClass="text-emerald-700 bg-emerald-50"
          loading={loading}
        />
        <KPICard
          label="Clientes nuevos"
          value={ov ? String(ov.customers.new) : '—'}
          icon={Users}
          iconClass="text-brand-700 bg-brand-50"
          loading={loading}
        />
        <KPICard
          label="Recurrentes"
          value={ov ? String(ov.customers.returning) : '—'}
          icon={TrendingUp}
          iconClass="text-indigo-700 bg-indigo-50"
          loading={loading}
        />
        <KPICard
          label="Leads captados"
          value={ov ? String(ov.customers.leads_captured) : '—'}
          icon={ShoppingBag}
          iconClass="text-orange-700 bg-orange-50"
          loading={loading}
        />
        <KPICard
          label="Carritos abandonados"
          value={ov ? String(ov.carts.abandoned) : '—'}
          icon={ShoppingCart}
          iconClass="text-red-600 bg-red-50"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Timeline de sesiones */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4 flex items-center gap-2">
            <Globe size={14} className="text-brand-700" />
            Tráfico web por día
          </h2>
          {loading ? (
            <div className="h-40 bg-warm-50 animate-pulse rounded" />
          ) : !traffic?.timeline.length ? (
            <EmptyState text="Sin datos de tráfico aún" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={traffic.timeline} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #e5e0d8' }}
                  formatter={(v: unknown) => [String(v), 'Sesiones'] as [string, string]}
                  labelFormatter={(l: unknown) => `Fecha: ${l}`}
                />
                <Area type="monotone" dataKey="sessions" stroke={BRAND} fill="url(#sessGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fuentes de tráfico */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4">Fuentes de tráfico</h2>
          {loading ? (
            <div className="h-40 bg-warm-50 animate-pulse rounded" />
          ) : !traffic?.sources.length ? (
            <EmptyState text="Sin datos de fuentes aún" />
          ) : (
            <div className="space-y-3">
              {traffic.sources.slice(0, 7).map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-24 text-warm-700 text-xs truncate shrink-0">{s.name}</span>
                  <MiniBar value={s.sessions} max={traffic.sources[0]?.sessions ?? 1} />
                  <span className="text-warm-500 text-xs w-6 text-right shrink-0">{s.sessions}</span>
                  <span className="text-emerald-600 text-xs w-10 text-right shrink-0">{s.conversion_rate}%</span>
                </div>
              ))}
              <p className="text-[10px] text-warm-300 mt-2">Sesiones · Conversión</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Comparativa locales — barras */}
        <div className="xl:col-span-2 bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-brand-700" />
            Comparativa de locales
          </h2>
          {loading ? (
            <div className="h-40 bg-warm-50 animate-pulse rounded" />
          ) : !branches.length ? (
            <EmptyState text="Sin datos de locales aún" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={branches} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={n => n.split(' ')[0]} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #e5e0d8' }}
                  formatter={(v: unknown) => [formatCLP(v as number), 'Revenue'] as [string, string]}
                />
                <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                  {branches.map((_, i) => <Cell key={i} fill={SOFT[i % SOFT.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {!loading && branches.length > 0 && (
            <div className="mt-3 divide-y divide-warm-50">
              {branches.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 py-2 text-xs">
                  <span className="w-4 text-warm-300 text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-warm-800 truncate">{b.name}</span>
                  <span className="text-warm-500">{b.orders} órd.</span>
                  <span className="text-warm-500">{b.reservations} res.</span>
                  <span className="font-medium text-warm-800 w-24 text-right">{formatCLP(b.revenue)}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: SOFT[i % SOFT.length] + '22', color: SOFT[i % SOFT.length] }}
                  >
                    {b.score}pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispositivos */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4">Dispositivos</h2>
          {loading ? (
            <div className="h-40 bg-warm-50 animate-pulse rounded" />
          ) : !traffic?.devices.length ? (
            <EmptyState text="Sin datos aún" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={traffic.devices}
                    dataKey="count"
                    nameKey="device"
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={55}
                    paddingAngle={2}
                  >
                    {traffic.devices.map(d => (
                      <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: unknown, n: unknown) => [String(v), String(n)] as [string, string]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {traffic.devices.map(d => {
                  const total = traffic.devices.reduce((s, x) => s + x.count, 0)
                  return (
                    <div key={d.device} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DEVICE_COLORS[d.device] ?? '#ccc' }} />
                      <span className="flex-1 capitalize text-warm-700">{d.device}</span>
                      <span className="text-warm-500">{d.count}</span>
                      <span className="text-warm-400 w-8 text-right">{Math.round((d.count / total) * 100)}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Embudo de conversión */}
      <div className="bg-white border border-warm-200 p-5">
        <h2 className="font-medium text-warm-900 text-sm mb-4">Embudo de conversión</h2>
        {loading ? (
          <div className="h-20 bg-warm-50 animate-pulse rounded" />
        ) : !ov ? null : (() => {
          const addToCart = ov.orders.count + ov.carts.abandoned
          const steps = [
            { label: 'Sesiones', value: ov.sessions.count, color: 'bg-warm-200' },
            { label: 'Al carrito', value: addToCart, color: 'bg-blue-200' },
            { label: 'Checkout', value: ov.sessions.converted, color: 'bg-purple-300' },
            { label: 'Completados', value: ov.orders.count, color: 'bg-brand-600' },
          ]
          const max = steps[0].value || 1
          return (
            <>
              <div className="flex items-stretch gap-0">
                {steps.map((s, i) => (
                  <div key={s.label} className="flex-1 flex items-center">
                    {i > 0 && <span className="shrink-0 text-warm-300 text-sm px-1">→</span>}
                    <div
                      className={`flex-1 flex items-center justify-center font-semibold text-lg py-4 ${s.color}`}
                      style={{ opacity: 0.3 + (s.value / max) * 0.7 }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                {steps.map((s, i) => (
                  <div key={s.label} className="flex-1 text-center" style={{ marginLeft: i > 0 ? 20 : 0 }}>
                    <p className="text-[10px] text-warm-500">{s.label}</p>
                    <p className="text-[10px] text-warm-400">{max > 0 ? Math.round((s.value / max) * 100) : 0}%</p>
                  </div>
                ))}
              </div>
              <p className="text-warm-400 text-[10px] mt-3 text-center">
                Conversión final: {ov.sessions.conversion_rate}% sesión → pedido
              </p>
            </>
          )
        })()}
      </div>

      {/* Gráficos operacionales del local */}
      {activeBranch && activeBranch !== '*' && activeBranch !== 'all' && (
        <BranchCharts
          branchId={activeBranch}
          branchName={BRANCH_NAMES[activeBranch] ?? activeBranch}
        />
      )}

      {/* Nota cuando no hay data de APIs externas */}
      <div className="bg-warm-50 border border-warm-100 p-4 text-xs text-warm-500 space-y-1">
        <p className="font-medium text-warm-700">Métricas pendientes de configurar</p>
        <p>• Google Ads / GA4 — requiere Measurement ID del cliente (pendiente)</p>
        <p>• Meta Pixel — requiere Pixel ID del cliente (pendiente)</p>
        <p>• Toteat — pendiente credenciales del gerente</p>
        <p>Una vez configurados, estos datos se integrarán aquí automáticamente.</p>
      </div>
    </div>
  )
}
