'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, CalendarCheck, Users } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

// Demo data - in production comes from Supabase view
const DEMO_KPIs = {
  revenue: 445200,
  revenueVsYesterday: 23,
  orders: 12,
  ordersVsYesterday: 15,
  reservations: 18,
  reservationsVsYesterday: -5,
  covers: 47,
  coversVsYesterday: 8,
}

interface KPI {
  label: string
  value: string
  change: number
  icon: typeof TrendingUp
  color: string
}

function KPICard({ kpi }: { kpi: KPI }) {
  const Icon = kpi.icon
  const positive = kpi.change >= 0

  return (
    <div className="bg-white border border-warm-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-warm-500 text-xs tracking-wider uppercase">{kpi.label}</p>
        <div className={`w-9 h-9 flex items-center justify-center ${kpi.color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-warm-900 mb-1">{kpi.value}</p>
      <p className={`text-xs flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        <TrendingUp size={11} className={positive ? '' : 'rotate-180'} />
        {positive ? '+' : ''}{kpi.change}% vs ayer
      </p>
    </div>
  )
}

export function KPICards() {
  const [kpis] = useState<KPI[]>([
    {
      label: 'Revenue hoy',
      value: formatCLP(DEMO_KPIs.revenue),
      change: DEMO_KPIs.revenueVsYesterday,
      icon: TrendingUp,
      color: 'bg-gold-50 text-gold-700',
    },
    {
      label: 'Órdenes',
      value: String(DEMO_KPIs.orders),
      change: DEMO_KPIs.ordersVsYesterday,
      icon: ShoppingBag,
      color: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Reservas',
      value: String(DEMO_KPIs.reservations),
      change: DEMO_KPIs.reservationsVsYesterday,
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Cubiertos',
      value: String(DEMO_KPIs.covers),
      change: DEMO_KPIs.coversVsYesterday,
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
  ])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => <KPICard key={kpi.label} kpi={kpi} />)}
    </div>
  )
}
