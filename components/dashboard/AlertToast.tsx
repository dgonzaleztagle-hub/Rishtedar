'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, CalendarCheck, Truck } from 'lucide-react'
import type { DashboardAlert, AlertType } from '@/hooks/useRealtimeAlerts'

// ─── Config visual por tipo ───────────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertType, {
  icon:    typeof ShoppingBag
  border:  string
  bg:      string
  iconBg:  string
  iconColor: string
  label:   string
}> = {
  order: {
    icon:      ShoppingBag,
    border:    'border-l-amber-500',
    bg:        'bg-white',
    iconBg:    'bg-amber-50',
    iconColor: 'text-amber-600',
    label:     'Pedido',
  },
  reservation: {
    icon:      CalendarCheck,
    border:    'border-l-blue-500',
    bg:        'bg-white',
    iconBg:    'bg-blue-50',
    iconColor: 'text-blue-600',
    label:     'Reserva',
  },
  delivery: {
    icon:      Truck,
    border:    'border-l-emerald-500',
    bg:        'bg-white',
    iconBg:    'bg-emerald-50',
    iconColor: 'text-emerald-600',
    label:     'Delivery',
  },
}

const AUTO_DISMISS_MS = 8000

// ─── Single toast ─────────────────────────────────────────────────────────────

function Toast({ alert, onDismiss }: { alert: DashboardAlert; onDismiss: (id: string) => void }) {
  const cfg  = ALERT_CONFIG[alert.type]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => onDismiss(alert.id), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [alert.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 64, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`flex items-start gap-3 w-80 shadow-lg border border-warm-200 border-l-4 ${cfg.border} ${cfg.bg} px-4 py-3`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center ${cfg.iconBg}`}>
        <Icon size={15} className={cfg.iconColor} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-warm-900 text-sm font-semibold leading-tight">{alert.title}</p>
        <p className="text-warm-500 text-xs mt-0.5 leading-snug">{alert.body}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 text-warm-300 hover:text-warm-600 transition-colors pt-0.5"
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}

// ─── Toast stack ──────────────────────────────────────────────────────────────

export function AlertToastStack({
  alerts,
  onDismiss,
}: {
  alerts:    DashboardAlert[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {alerts.map(alert => (
          <div key={alert.id} className="pointer-events-auto">
            <Toast alert={alert} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
