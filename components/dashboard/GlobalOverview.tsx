'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MapPin, ShoppingBag, CalendarCheck, ArrowRight, RefreshCw,
  TrendingUp, Users, Bike, Wifi, WifiOff, Trophy, AlertCircle, Lock, BarChart2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

// ─── Branch config ────────────────────────────────────────────────────────────

const BRANCHES: Record<string, { name: string; address: string; accent: string }> = {
  'providencia': { name: 'Providencia', address: 'Av. Providencia 2124', accent: '#7c5cbf' },
  'vitacura':    { name: 'Vitacura',    address: 'Av. Vitacura 3600',    accent: '#10b981' },
  'la-reina':    { name: 'La Reina',    address: 'Av. Ossa 100',         accent: '#3b82f6' },
  'la-dehesa':   { name: 'La Dehesa',   address: 'El Rodeo 12840',       accent: '#f43f5e' },
}

const BRANCH_LIST = [
  { id: 'providencia', name: 'Providencia', accent: '#7c5cbf' },
  { id: 'vitacura',    name: 'Vitacura',    accent: '#10b981' },
  { id: 'la-reina',   name: 'La Reina',    accent: '#3b82f6' },
  { id: 'la-dehesa',  name: 'La Dehesa',   accent: '#f43f5e' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchSummary {
  id: string; name: string; revenue: number; avg_ticket: number
  orders_completed: number; orders_active: number; reservations: number
  covers: number; score: number
}

interface GlobalSummary {
  today: {
    revenue: number; avg_ticket: number
    orders_completed: number; orders_active: number; orders_pending: number
    reservations_total: number; reservations_confirmed: number
    reservations_checkins: number; reservations_noshows: number; reservations_covers: number
    delivery_active: number; delivery_delivered: number; delivery_unassigned: number
    customers_unique: number; customers_new: number; customers_returning: number
    visits_today: number; online_now: number
  }
  branches: BranchSummary[]
}

interface ChartData {
  revenue_by_hour:    Record<string, number | string>[]
  revenue_trend:      Record<string, number | string>[]
  reservas_by_franja: Record<string, number | string>[]
  order_mix:          { local: string; delivery: number; dine_in: number; takeaway: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clp(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

function clpFull(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

function healthLabel(score: number, hasData: boolean) {
  if (!hasData) return { label: 'Sin actividad', color: '#9ca3af', bg: '#f3f4f6' }
  if (score >= 65) return { label: 'Activo',   color: '#10b981', bg: '#ecfdf5' }
  if (score >= 30) return { label: 'Moderado', color: '#f59e0b', bg: '#fffbeb' }
  return               { label: 'Bajo',        color: '#f43f5e', bg: '#fff1f2' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent = '#c9952a', alert = false }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: string; alert?: boolean
}) {
  return (
    <div className={`bg-white border flex items-start gap-3 px-4 py-4 ${alert ? 'border-amber-300' : 'border-warm-200'}`}>
      <div className="mt-0.5 p-1.5 rounded" style={{ backgroundColor: `${accent}18` }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-warm-500 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-2xl font-bold text-warm-900 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-warm-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, loading }: {
  title: string; subtitle?: string; children: React.ReactNode; loading?: boolean
}) {
  return (
    <div className="bg-white border border-warm-200 px-5 pt-4 pb-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-warm-900">{title}</p>
        {subtitle && <p className="text-xs text-warm-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading
        ? <div className="h-48 bg-warm-50 animate-pulse" />
        : children
      }
    </div>
  )
}

function BranchLegend() {
  return (
    <div className="flex flex-wrap gap-3 mb-3">
      {BRANCH_LIST.map(b => (
        <div key={b.id} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.accent }} />
          <span className="text-[11px] text-warm-500">{b.name}</span>
        </div>
      ))}
    </div>
  )
}

function LockedCard({ label, description }: { label: string; description: string }) {
  return (
    <div className="bg-warm-50 border border-warm-200 border-dashed px-4 py-4 flex items-start gap-3 opacity-60">
      <div className="mt-0.5 p-1.5 rounded bg-warm-100">
        <Lock size={14} className="text-warm-400" />
      </div>
      <div>
        <p className="text-[11px] text-warm-500 uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-xs text-warm-400">{description}</p>
      </div>
    </div>
  )
}

// Tooltip custom reutilizable
function ChartTooltip({ active, payload, label, prefix = '' }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>
  label?: string; prefix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-200 px-3 py-2.5 shadow-sm text-xs min-w-[140px]">
      <p className="text-warm-500 mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-warm-600">{p.name}</span>
          </div>
          <span className="font-medium text-warm-900">{prefix}{typeof p.value === 'number' && prefix === '$' ? clpFull(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── GlobalOverview ───────────────────────────────────────────────────────────

export function GlobalOverview({ onSelectBranch }: { onSelectBranch: (id: string) => void }) {
  const [data, setData]         = useState<GlobalSummary | null>(null)
  const [charts, setCharts]     = useState<ChartData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [error, setError]       = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [summaryRes, chartsRes] = await Promise.all([
        fetch('/api/kpis/global-summary'),
        fetch('/api/kpis/global-charts'),
      ])
      if (!summaryRes.ok) throw new Error('summary error')
      setData(await summaryRes.json())
      setLastUpdated(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))
      if (chartsRes.ok) setCharts(await chartsRes.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setChartsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const iv = setInterval(fetchAll, 60_000)
    return () => clearInterval(iv)
  }, [fetchAll])

  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const t = data?.today
  const branches = data?.branches ?? []

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-warm-900 font-display text-xl italic">Vista Global</h1>
          <p className="text-warm-500 text-sm capitalize">{today}</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-700 transition-colors disabled:opacity-40">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando…' : lastUpdated ? `Actualizado ${lastUpdated}` : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle size={14} />
          No se pudo cargar el resumen. Reintenta.
        </div>
      )}

      {/* ── Financiero ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Financiero — hoy</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard label="Ingresos del día" value={loading ? '—' : clpFull(t?.revenue ?? 0)}
            sub={loading ? undefined : `${t?.orders_completed ?? 0} pedidos completados`}
            icon={TrendingUp} accent="#c9952a" />
          <KpiCard label="Ticket promedio" value={loading ? '—' : clpFull(t?.avg_ticket ?? 0)}
            sub="por pedido completado" icon={BarChart2} accent="#c9952a" />
          <KpiCard label="Clientes únicos" value={loading ? '—' : t?.customers_unique ?? 0}
            sub={loading ? undefined : `${t?.customers_new ?? 0} nuevos · ${t?.customers_returning ?? 0} recurrentes`}
            icon={Users} accent="#c9952a" />
        </div>
      </div>

      {/* ── Operacional ────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Operacional — hoy</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Pedidos activos" value={loading ? '—' : t?.orders_active ?? 0}
            sub={loading ? undefined : t?.orders_pending ? `${t.orders_pending} sin atender` : 'al día'}
            icon={ShoppingBag} accent="#7c5cbf" alert={(t?.orders_pending ?? 0) > 0} />
          <KpiCard label="Reservas hoy" value={loading ? '—' : t?.reservations_total ?? 0}
            sub={loading ? undefined : `${t?.reservations_checkins ?? 0} check-ins · ${t?.reservations_covers ?? 0} comensales`}
            icon={CalendarCheck} accent="#7c5cbf" />
          <KpiCard label="Delivery activo" value={loading ? '—' : t?.delivery_active ?? 0}
            sub={loading ? undefined : t?.delivery_unassigned ? `${t.delivery_unassigned} sin conductor` : `${t?.delivery_delivered ?? 0} entregados`}
            icon={Bike} accent="#7c5cbf" alert={(t?.delivery_unassigned ?? 0) > 0} />
          <KpiCard label="Online ahora" value={loading ? '—' : t?.online_now ?? 0}
            sub={loading ? undefined : `${t?.visits_today ?? 0} visitas hoy`}
            icon={(t?.online_now ?? 0) > 0 ? Wifi : WifiOff} accent="#7c5cbf" />
        </div>
      </div>

      {/* ── Gráficos ───────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Tendencias</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Tendencia 7 días */}
          <ChartCard title="Revenue últimos 7 días" subtitle="por local" loading={chartsLoading}>
            <BranchLegend />
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={charts?.revenue_trend ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => clp(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip prefix="$" />} />
                {BRANCH_LIST.map(b => (
                  <Line key={b.id} type="monotone" dataKey={b.id} name={b.name}
                    stroke={b.accent} strokeWidth={2} dot={{ r: 3, fill: b.accent }}
                    activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue por hora */}
          <ChartCard title="Revenue por hora" subtitle="pedidos completados hoy" loading={chartsLoading}>
            <BranchLegend />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts?.revenue_by_hour ?? []} barSize={6} barGap={1}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => clp(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip prefix="$" />} />
                {BRANCH_LIST.map(b => (
                  <Bar key={b.id} dataKey={b.id} name={b.name} fill={b.accent} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Reservas por franja */}
          <ChartCard title="Reservas por franja horaria" subtitle="distribución de demanda hoy" loading={chartsLoading}>
            <BranchLegend />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts?.reservas_by_franja ?? []} barSize={10} barGap={2}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
                <XAxis dataKey="franja" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} />
                {BRANCH_LIST.map(b => (
                  <Bar key={b.id} dataKey={b.id} name={b.name} fill={b.accent} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Mix de tipos de pedido */}
          <ChartCard title="Mix de pedidos" subtitle="delivery · dine-in · takeaway por local" loading={chartsLoading}>
            <div className="flex items-center gap-4 mb-3">
              {[{ key: 'delivery', label: 'Delivery', color: '#c9952a' },
                { key: 'dine_in',  label: 'En local',  color: '#7c5cbf' },
                { key: 'takeaway', label: 'Takeaway',  color: '#3b82f6' }].map(t => (
                <div key={t.key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-[11px] text-warm-500">{t.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts?.order_mix ?? []} barSize={16} barGap={2}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
                <XAxis dataKey="local" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="delivery" name="Delivery" fill="#c9952a" radius={[2, 2, 0, 0]} />
                <Bar dataKey="dine_in"  name="En local"  fill="#7c5cbf" radius={[2, 2, 0, 0]} />
                <Bar dataKey="takeaway" name="Takeaway"  fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* ── Comparativa de locales ──────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Comparativa de locales — hoy</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="bg-white border border-warm-200 h-32 animate-pulse" />)
            : branches.map((branch, idx) => {
                const cfg    = BRANCHES[branch.id]
                const accent = cfg?.accent ?? '#c9952a'
                const hasData = branch.orders_completed > 0 || branch.reservations > 0
                const health  = healthLabel(branch.score, hasData)
                return (
                  <div key={branch.id} className="bg-white border border-warm-200 overflow-hidden"
                    style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                    <div className="px-4 py-3 flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 flex items-center justify-center mt-0.5 shrink-0"
                          style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
                          <MapPin size={11} style={{ color: accent }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-warm-900 text-sm">{cfg?.name ?? branch.name}</p>
                            {idx === 0 && branches.length > 1 && <Trophy size={11} className="text-amber-500" />}
                          </div>
                          <p className="text-warm-400 text-xs">{cfg?.address}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: health.color, backgroundColor: health.bg }}>
                        {health.label}
                      </span>
                    </div>
                    <div className="px-4 pb-3 grid grid-cols-4 gap-2">
                      {[
                        { label: 'Ingresos', value: clpFull(branch.revenue) },
                        { label: 'Pedidos',  value: branch.orders_completed },
                        { label: 'Activos',  value: branch.orders_active },
                        { label: 'Reservas', value: branch.reservations },
                      ].map(stat => (
                        <div key={stat.label} className="bg-warm-50 px-2 py-2 text-center">
                          <p className="text-[9px] text-warm-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                          <p className="text-sm font-bold text-warm-900 leading-none truncate">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-warm-100 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-[11px] text-warm-400">
                        {branch.covers > 0 ? `${branch.covers} comensales hoy` : 'Sin comensales aún'}
                      </p>
                      <button onClick={() => onSelectBranch(branch.id)}
                        className="flex items-center gap-1 text-[11px] transition-colors"
                        style={{ color: accent }}>
                        Ver detalle <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* ── Alertas ────────────────────────────────────────────────────────── */}
      {!loading && ((t?.reservations_noshows ?? 0) > 0 || (t?.orders_pending ?? 0) > 0) && (
        <div>
          <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Alertas del día</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(t?.reservations_noshows ?? 0) > 0 && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">{t!.reservations_noshows} no-shows hoy</p>
                  <p className="text-xs text-red-500">Reservas sin presentarse</p>
                </div>
              </div>
            )}
            {(t?.orders_pending ?? 0) > 0 && (
              <div className="bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
                <ShoppingBag size={14} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700">{t!.orders_pending} pedidos sin atender</p>
                  <p className="text-xs text-amber-500">Requieren acción inmediata</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Próximamente ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-warm-400 uppercase tracking-widest mb-2">Próximamente — requiere configuración</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LockedCard label="Tráfico web" description="Requiere configurar Google Analytics 4" />
          <LockedCard label="Fuentes de tráfico" description="Requiere parámetros UTM activos" />
          <LockedCard label="ROI campañas" description="Requiere Google Ads / Meta Ads API" />
        </div>
      </div>

    </div>
  )
}
