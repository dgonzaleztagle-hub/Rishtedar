'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, CalendarCheck, Users } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

interface KPIData {
  revenue:      { value: number; delta: number }
  orders:       { value: number; delta: number }
  reservations: { value: number; delta: number }
  covers:       { value: number; delta: number }
}

function KPICard({
  label, value, change, icon: Icon, color,
}: {
  label: string
  value: string
  change: number
  icon: typeof TrendingUp
  color: string
}) {
  const positive = change >= 0
  return (
    <div className="bg-white border border-warm-200 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-warm-500 text-[10px] sm:text-xs tracking-wider uppercase">{label}</p>
        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-warm-900 mb-1 truncate">{value}</p>
      <p className={`text-xs flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        <TrendingUp size={11} className={positive ? '' : 'rotate-180'} />
        {positive ? '+' : ''}{change}% vs ayer
      </p>
    </div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="bg-white border border-warm-200 p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 bg-warm-100 rounded w-24" />
        <div className="w-8 h-8 bg-warm-100 rounded" />
      </div>
      <div className="h-7 bg-warm-100 rounded w-32 mb-2" />
      <div className="h-3 bg-warm-100 rounded w-20" />
    </div>
  )
}

export function KPICards({ branch = 'all' }: { branch?: string }) {
  const [data, setData] = useState<KPIData | null>(null)

  useEffect(() => {
    fetch(`/api/kpis/today?branch=${branch}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [branch])

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
      </div>
    )
  }

  const cards = [
    { label: 'Revenue hoy',  value: formatCLP(data.revenue.value),      change: data.revenue.delta,      icon: TrendingUp,    color: 'bg-gold-50 text-gold-700' },
    { label: 'Órdenes',      value: String(data.orders.value),           change: data.orders.delta,       icon: ShoppingBag,   color: 'bg-brand-50 text-brand-700' },
    { label: 'Reservas',     value: String(data.reservations.value),     change: data.reservations.delta, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Cubiertos',    value: String(data.covers.value),           change: data.covers.delta,       icon: Users,         color: 'bg-blue-50 text-blue-700' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(kpi => <KPICard key={kpi.label} {...kpi} />)}
    </div>
  )
}
