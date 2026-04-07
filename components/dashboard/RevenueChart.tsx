'use client'

import { formatCLP } from '@/lib/utils'

// Demo weekly revenue data
const WEEK_DATA = [
  { day: 'Lun', revenue: 287000, orders: 8 },
  { day: 'Mar', revenue: 342000, orders: 11 },
  { day: 'Mié', revenue: 521000, orders: 16 },
  { day: 'Jue', revenue: 398000, orders: 13 },
  { day: 'Vie', revenue: 673000, orders: 21 },
  { day: 'Sáb', revenue: 892000, orders: 28 },
  { day: 'Hoy', revenue: 445200, orders: 12 },
]

const TOP_DISHES = [
  { name: 'Butter Chicken', count: 28, revenue: 389200 },
  { name: 'Biryani Cordero', count: 21, revenue: 333900 },
  { name: 'Tikka Masala', count: 19, revenue: 264100 },
  { name: 'Lamb Rogan Josh', count: 15, revenue: 253500 },
  { name: 'Dal Makhani', count: 14, revenue: 138600 },
]

export function RevenueChart() {
  const maxRevenue = Math.max(...WEEK_DATA.map(d => d.revenue))

  return (
    <div className="bg-white border border-warm-200 p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-medium text-warm-900">Revenue esta semana</h2>
        <p className="text-2xl font-semibold text-warm-900">
          {formatCLP(WEEK_DATA.reduce((s, d) => s + d.revenue, 0))}
        </p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32 mb-4">
        {WEEK_DATA.map(d => {
          const height = (d.revenue / maxRevenue) * 100
          const isToday = d.day === 'Hoy'
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full transition-all duration-500 cursor-pointer"
                style={{
                  height: `${height}%`,
                  background: isToday ? '#91226f' : '#e4d8d1',
                }}
                title={formatCLP(d.revenue)}
              />
              <span className={`text-[10px] ${isToday ? 'text-brand-700 font-medium' : 'text-warm-400'}`}>
                {d.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-warm-200 pt-5 mt-5">
        <h3 className="text-warm-500 text-xs tracking-wider uppercase mb-3">Top platos esta semana</h3>
        <div className="space-y-2">
          {TOP_DISHES.map((dish, i) => (
            <div key={dish.name} className="flex items-center gap-3">
              <span className="text-warm-300 text-xs w-4 text-right">{i + 1}</span>
              <div className="flex-1 relative h-5">
                <div
                  className="absolute inset-y-0 left-0 bg-brand-100"
                  style={{ width: `${(dish.count / TOP_DISHES[0].count) * 100}%` }}
                />
                <span className="relative text-xs text-warm-800 pl-2 leading-5">{dish.name}</span>
              </div>
              <span className="text-warm-500 text-xs shrink-0">{dish.count} vendidos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
