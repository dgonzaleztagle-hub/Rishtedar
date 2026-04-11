'use client'

import { motion } from 'framer-motion'
import { ChefHat, Bike, CheckCircle2, Clock } from 'lucide-react'

type ClientStatus = 'preparing' | 'on_the_way' | 'delivered'

interface Props {
  orderNumber: string
  status: ClientStatus
  estimatedTime?: string  // e.g. "20–30 min"
  items: string[]         // item names for display
  total: number
}

const STEPS: { key: ClientStatus; label: string; sublabel: string; icon: typeof ChefHat }[] = [
  { key: 'preparing',  label: 'Preparando',  sublabel: 'Tu pedido está en cocina',      icon: ChefHat },
  { key: 'on_the_way', label: 'En camino',   sublabel: 'El driver ya va hacia ti',      icon: Bike },
  { key: 'delivered',  label: 'Entregado',   sublabel: '¡Que lo disfrutes!',            icon: CheckCircle2 },
]

const STATUS_ORDER: Record<ClientStatus, number> = {
  preparing: 0,
  on_the_way: 1,
  delivered: 2,
}

export function OrderTracker({ orderNumber, status, estimatedTime, items, total }: Props) {
  const currentIdx = STATUS_ORDER[status]

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-warm-500 text-[10px] tracking-widest uppercase">Pedido</p>
          <p className="font-mono text-gold-400 text-sm tracking-widest">{orderNumber}</p>
        </div>
        {estimatedTime && status !== 'delivered' && (
          <div className="flex items-center gap-1.5 text-warm-400 text-xs">
            <Clock size={12} className="text-brand-400" />
            <span>{estimatedTime}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative mb-8">
        {/* Track line */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-warm-800" />
        <div
          className="absolute left-5 top-5 w-px bg-gold-600 transition-all duration-1000"
          style={{ height: `${Math.min(currentIdx / (STEPS.length - 1), 1) * 100}%` }}
        />

        <div className="space-y-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = i <= currentIdx
            const active = i === currentIdx

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-start gap-4 relative"
              >
                {/* Icon */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500 ${
                    done
                      ? 'bg-gold-600 border-gold-600'
                      : 'bg-warm-900 border-warm-800'
                  }`}
                >
                  <Icon size={16} className={done ? 'text-warm-950' : 'text-warm-700'} />
                  {active && (
                    <span className="absolute inset-0 rounded-full border border-gold-500 animate-ping opacity-40" />
                  )}
                </div>

                {/* Text */}
                <div className="pt-2">
                  <p className={`text-sm font-medium transition-colors ${done ? 'text-ivory' : 'text-warm-700'}`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-warm-500 text-xs mt-0.5">{step.sublabel}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="border border-warm-800 bg-warm-900/30 p-4">
        <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-3">Tu pedido</p>
        <ul className="space-y-1.5 mb-3">
          {items.map((item, i) => (
            <li key={i} className="text-warm-300 text-sm flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gold-700 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="border-t border-warm-800 pt-3 flex items-center justify-between">
          <span className="text-warm-500 text-xs uppercase tracking-wider">Total</span>
          <span className="text-gold-400 font-medium text-sm">${total.toLocaleString('es-CL')}</span>
        </div>
      </div>
    </div>
  )
}
