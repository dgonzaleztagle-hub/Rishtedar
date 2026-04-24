'use client'

import { useState, useEffect } from 'react'
import { formatCLP } from '@/lib/utils'

interface DayRevenue {
  dia: string
  [branchId: string]: number | string
}

interface ChartData {
  revenue_trend: DayRevenue[]
  branches: { id: string; name: string }[]
}

export function RevenueChart({ branch = 'all' }: { branch?: string }) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/kpis/global-charts?branch=${branch}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [branch])

  const trend = data?.revenue_trend ?? []
  const branchIds = data?.branches?.map(b => b.id) ?? []

  const weekData = trend.map(d => {
    const revenue = branchIds.reduce((sum, id) => sum + ((d[id] as number) ?? 0), 0)
    return { dia: d.dia, revenue }
  })

  const totalRevenue = weekData.reduce((s, d) => s + d.revenue, 0)
  const maxRevenue = Math.max(...weekData.map(d => d.revenue), 1)
  const lastLabel = weekData[weekData.length - 1]?.dia ?? ''

  return (
    <div className="bg-white border border-warm-200 p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-medium text-warm-900">Revenue esta semana</h2>
        <p className="text-2xl font-semibold text-warm-900">
          {loading ? '—' : formatCLP(totalRevenue)}
        </p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32 mb-4">
        {loading
          ? [40, 55, 70, 50, 80, 90, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-warm-100 animate-pulse" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-warm-200">—</span>
              </div>
            ))
          : weekData.length === 0
          ? (
              <div className="flex-1 flex items-center justify-center text-warm-400 text-xs">
                Sin datos esta semana
              </div>
            )
          : weekData.map(d => {
              const height = (d.revenue / maxRevenue) * 100
              const isToday = d.dia === lastLabel
              return (
                <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full transition-all duration-500"
                    style={{ height: `${Math.max(height, d.revenue > 0 ? 4 : 0)}%`, background: isToday ? '#91226f' : '#e4d8d1' }}
                    title={formatCLP(d.revenue)}
                  />
                  <span className={`text-[10px] ${isToday ? 'text-brand-700 font-medium' : 'text-warm-400'}`}>
                    {d.dia.split(' ')[0]}
                  </span>
                </div>
              )
            })
        }
      </div>

      {/* Top dishes — disponible cuando Toteat esté configurado */}
      <div className="border-t border-warm-200 pt-5 mt-5">
        <h3 className="text-warm-500 text-xs tracking-wider uppercase mb-3">Top platos esta semana</h3>
        <div className="py-4 text-center text-warm-300 text-xs">
          Disponible cuando el menú esté sincronizado con Toteat
        </div>
      </div>
    </div>
  )
}
