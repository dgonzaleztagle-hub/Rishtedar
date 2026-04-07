'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Users, ShoppingBag, CalendarCheck } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

const PERIODS = ['Hoy', 'Esta semana', 'Este mes', 'Este año']

// Revenue by hour (index 0 = 11:00, ..., 12 = 23:00)
const HOURLY_REVENUE = [8200, 24500, 31800, 19200, 12400, 5600, 0, 0, 34600, 67800, 89200, 102400, 78300]
const HOURLY_LABELS = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']

const TOP_DISHES = [
  { name: 'Chicken Tikka Masala', sold: 34, revenue: 608200, pct: 100 },
  { name: 'Lamb Rogan Josh', sold: 28, revenue: 588000, pct: 82 },
  { name: 'Butter Chicken', sold: 26, revenue: 494000, pct: 76 },
  { name: 'Biryani Pollo', sold: 22, revenue: 396000, pct: 65 },
  { name: 'Paneer Tikka', sold: 19, revenue: 285000, pct: 56 },
  { name: 'Tandoori Mixed Grill', sold: 15, revenue: 450000, pct: 44 },
  { name: 'Dal Makhani', sold: 14, revenue: 168000, pct: 41 },
  { name: 'Gulab Jamun', sold: 41, revenue: 328000, pct: 100 },
]

const LOCAL_BREAKDOWN = [
  { name: 'Providencia', revenue: 1820400, orders: 48, pct: 40 },
  { name: 'Vitacura', revenue: 1367800, orders: 36, pct: 30 },
  { name: 'La Dehesa', revenue: 911600, orders: 24, pct: 20 },
  { name: 'La Reina', revenue: 455800, orders: 12, pct: 10 },
]

const WEEKLY_DATA = [
  { day: 'Lun', revenue: 445200, orders: 12 },
  { day: 'Mar', revenue: 612400, orders: 17 },
  { day: 'Mié', revenue: 389600, orders: 10 },
  { day: 'Jue', revenue: 534800, orders: 15 },
  { day: 'Vie', revenue: 823400, orders: 23 },
  { day: 'Sáb', revenue: 978200, orders: 28 },
  { day: 'Dom', revenue: 712600, orders: 20 },
]

const PROMO_ROI = [
  { name: 'San Valentín 40%', orders: 28, revenue: 1240600, discount: 497000, roi: 149 },
  { name: 'Miércoles -30%', orders: 45, revenue: 890400, discount: 267000, roi: 234 },
  { name: 'Happy Hour 18-19h', orders: 18, revenue: 342000, discount: 114000, roi: 200 },
]

function MiniBar({ value, max, color = 'bg-brand-700' }: { value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function HourBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
        <div
          className="w-full bg-brand-700 hover:bg-brand-600 transition-colors cursor-default"
          style={{ height: `${pct}%`, minHeight: value > 0 ? 2 : 0 }}
          title={formatCLP(value)}
        />
      </div>
      <span className="text-[9px] text-warm-400">{label}</span>
    </div>
  )
}

export function AnalyticsView() {
  const [period, setPeriod] = useState('Hoy')

  const hourMax = Math.max(...HOURLY_REVENUE)
  const weekMax = Math.max(...WEEKLY_DATA.map(d => d.revenue))

  const totalRevenue = LOCAL_BREAKDOWN.reduce((s, l) => s + l.revenue, 0)
  const totalOrders = LOCAL_BREAKDOWN.reduce((s, l) => s + l.orders, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Analytics</h1>
          <p className="text-warm-500 text-sm mt-0.5">ROI y métricas del negocio</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
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
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: formatCLP(445200), change: +23, icon: TrendingUp, color: 'text-gold-700 bg-gold-50' },
          { label: 'Órdenes', value: '12', change: +15, icon: ShoppingBag, color: 'text-brand-700 bg-brand-50' },
          { label: 'Ticket promedio', value: formatCLP(37100), change: +7, icon: BarChart3, color: 'text-purple-700 bg-purple-50' },
          { label: 'Cubiertos', value: '47', change: +8, icon: Users, color: 'text-blue-700 bg-blue-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          const pos = kpi.change >= 0
          return (
            <div key={kpi.label} className="bg-white border border-warm-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-warm-500 text-xs tracking-wider uppercase">{kpi.label}</p>
                <div className={`w-8 h-8 flex items-center justify-center ${kpi.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-warm-900">{kpi.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
                {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {pos ? '+' : ''}{kpi.change}% vs ayer
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue by hour */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-brand-700" />
            Revenue por hora
          </h2>
          <div className="flex items-end gap-1">
            {HOURLY_REVENUE.map((v, i) => (
              <HourBar key={i} value={v} max={hourMax} label={HOURLY_LABELS[i]} />
            ))}
          </div>
          <p className="text-warm-400 text-[10px] mt-3">Pico: 20:00 – 22:00 · {formatCLP(hourMax)} max/hora</p>
        </div>

        {/* Weekly revenue */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-700" />
            Semana actual
          </h2>
          <div className="flex items-end gap-2">
            {WEEKLY_DATA.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                  <div
                    className="w-full bg-gold-600 hover:bg-gold-500 transition-colors"
                    style={{ height: `${Math.round((d.revenue / weekMax) * 100)}%`, minHeight: 2 }}
                    title={formatCLP(d.revenue)}
                  />
                </div>
                <span className="text-[9px] text-warm-400">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-warm-400 mt-3">
            <span>Total semana: {formatCLP(WEEKLY_DATA.reduce((s, d) => s + d.revenue, 0))}</span>
            <span>{WEEKLY_DATA.reduce((s, d) => s + d.orders, 0)} órdenes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top dishes */}
        <div className="xl:col-span-2 bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4">Top platos más vendidos</h2>
          <div className="space-y-3">
            {TOP_DISHES.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="shrink-0 text-warm-400 text-xs w-4">{i + 1}</span>
                <span className="flex-1 text-warm-800 text-sm truncate">{d.name}</span>
                <MiniBar value={d.pct} max={100} />
                <span className="shrink-0 text-warm-700 text-xs font-medium w-6 text-right">{d.sold}</span>
                <span className="shrink-0 text-warm-500 text-xs w-20 text-right hidden sm:block">{formatCLP(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By local */}
        <div className="bg-white border border-warm-200 p-5">
          <h2 className="font-medium text-warm-900 text-sm mb-4">Revenue por local</h2>
          <div className="space-y-4">
            {LOCAL_BREAKDOWN.map(l => (
              <div key={l.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-warm-700">{l.name}</span>
                  <span className="text-warm-500 text-xs">{l.pct}%</span>
                </div>
                <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-700 rounded-full"
                    style={{ width: `${l.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-warm-400 mt-1">
                  <span>{formatCLP(l.revenue)}</span>
                  <span>{l.orders} órdenes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promo ROI */}
      <div className="bg-white border border-warm-200 p-5">
        <h2 className="font-medium text-warm-900 text-sm mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-600" />
          ROI de Promociones
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-warm-100">
                <th className="text-left text-[10px] uppercase tracking-wider text-warm-400 pb-2 font-normal">Promoción</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-warm-400 pb-2 font-normal">Órdenes</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-warm-400 pb-2 font-normal">Revenue</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-warm-400 pb-2 font-normal">Descuento dado</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-warm-400 pb-2 font-normal">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {PROMO_ROI.map(p => (
                <tr key={p.name} className="hover:bg-warm-50 transition-colors">
                  <td className="py-3 text-warm-800">{p.name}</td>
                  <td className="py-3 text-right text-warm-600">{p.orders}</td>
                  <td className="py-3 text-right text-warm-800 font-medium">{formatCLP(p.revenue)}</td>
                  <td className="py-3 text-right text-red-500">-{formatCLP(p.discount)}</td>
                  <td className="py-3 text-right">
                    <span className="text-emerald-700 font-semibold">{p.roi}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-warm-400 text-[10px] mt-3">ROI = (Revenue generado / Descuento dado) × 100</p>
      </div>

      {/* Conversion */}
      <div className="bg-white border border-warm-200 p-5">
        <h2 className="font-medium text-warm-900 text-sm mb-4">Embudo de conversión — Hoy</h2>
        {(() => {
          const steps = [
            { label: 'Visitantes únicos', value: 150, pct: 100, color: 'bg-warm-200' },
            { label: 'Vieron menú', value: 98, pct: 65, color: 'bg-blue-200' },
            { label: 'Agregaron al carrito', value: 34, pct: 23, color: 'bg-purple-300' },
            { label: 'Completaron pedido', value: 12, pct: 8, color: 'bg-brand-600' },
          ]
          return (
            <>
              {/* Bars row */}
              <div className="flex items-stretch gap-0">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex-1 flex items-center">
                    {i > 0 && <span className="shrink-0 text-warm-300 text-sm px-1">→</span>}
                    <div
                      className={`flex-1 flex items-center justify-center font-semibold text-lg py-4 ${step.color}`}
                      style={{ opacity: 0.4 + step.pct / 150 }}
                    >
                      {step.value}
                    </div>
                  </div>
                ))}
              </div>
              {/* Labels row */}
              <div className="flex mt-2">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex-1 flex items-start" style={{ marginLeft: i > 0 ? 20 : 0 }}>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-warm-500">{step.label}</p>
                      <p className="text-[10px] text-warm-400">{step.pct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        })()}
        <p className="text-warm-400 text-[10px] mt-3 text-center">Conversión final: 8% visitante → pedido</p>
      </div>
    </div>
  )
}
