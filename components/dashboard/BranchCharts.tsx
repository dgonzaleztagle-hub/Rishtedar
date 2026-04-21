'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'

// ─── Config ───────────────────────────────────────────────────────────────────

const BRANCH_ACCENT: Record<string, string> = {
  'providencia': '#7c5cbf',
  'vitacura':    '#10b981',
  'la-reina':    '#3b82f6',
  'la-dehesa':   '#f43f5e',
}

const ORDER_TYPES = [
  { key: 'delivery', label: 'Delivery',  color: '#c9952a' },
  { key: 'dine_in',  label: 'En local',  color: '#7c5cbf' },
  { key: 'takeaway', label: 'Takeaway',  color: '#3b82f6' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clp(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

function clpFull(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function ChartTooltip({ active, payload, label, isCurrency = false }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  isCurrency?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-200 px-3 py-2.5 shadow-sm text-xs min-w-[120px]">
      {label && <p className="text-warm-500 mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-warm-600">{p.name}</span>
          </div>
          <span className="font-medium text-warm-900">
            {isCurrency ? clpFull(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── BranchCharts ─────────────────────────────────────────────────────────────

interface Props {
  branchId: string
  branchName: string
}

interface ChartData {
  revenue_by_hour:    Record<string, number | string>[]
  revenue_trend:      Record<string, number | string>[]
  reservas_by_franja: Record<string, number | string>[]
  order_mix:          { local: string; delivery: number; dine_in: number; takeaway: number }[]
}

export function BranchCharts({ branchId, branchName }: Props) {
  const [data, setData]       = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const accent = BRANCH_ACCENT[branchId] ?? '#c9952a'

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/kpis/global-charts?branch=${branchId}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetch_()
    const iv = setInterval(fetch_, 120_000)
    return () => clearInterval(iv)
  }, [fetch_])

  // Datos para el donut de mix
  const mix = data?.order_mix?.[0]
  const pieData = mix
    ? ORDER_TYPES.map(t => ({ name: t.label, value: mix[t.key as keyof typeof mix] as number, color: t.color })).filter(d => d.value > 0)
    : []

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-warm-900">Operacional · {branchName}</p>
          <p className="text-xs text-warm-400">Tendencias y distribución de hoy y últimos 7 días</p>
        </div>
        <button
          onClick={fetch_}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tendencia 7 días */}
        <ChartCard title="Revenue últimos 7 días" subtitle="pedidos completados" loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data?.revenue_trend ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={clp} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip isCurrency />} />
              <Line
                type="monotone" dataKey={branchId} name={branchName}
                stroke={accent} strokeWidth={2.5}
                dot={{ r: 3, fill: accent, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: accent }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue por hora */}
        <ChartCard title="Revenue por hora" subtitle="pedidos completados hoy" loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.revenue_by_hour ?? []} barSize={14} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={clp} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip isCurrency />} />
              <Bar dataKey={branchId} name={branchName} fill={accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Reservas por franja */}
        <ChartCard title="Reservas por franja horaria" subtitle="distribución de demanda hoy" loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.reservas_by_franja ?? []} barSize={20} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" vertical={false} />
              <XAxis dataKey="franja" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey={branchId} name="Reservas" fill={accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Mix de pedidos — donut */}
        <ChartCard title="Mix de pedidos" subtitle="delivery · en local · takeaway" loading={loading}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ fontSize: 11, border: '1px solid #e5e0d8', borderRadius: 0 }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-warm-400 text-sm">
              Sin pedidos hoy
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  )
}
