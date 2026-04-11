'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Save, Power, AlertCircle, CheckCircle2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

interface DayConfig {
  active: boolean
  open: string
  close: string
}

type WeekSchedule = Record<DayKey, DayConfig>
type ScheduleType = 'delivery' | 'reservations'

// ─── Defaults ────────────────────────────────────────────────────────────────

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

const DEFAULT_SCHEDULE: WeekSchedule = {
  lun: { active: true,  open: '12:00', close: '23:00' },
  mar: { active: true,  open: '12:00', close: '23:00' },
  mie: { active: true,  open: '12:00', close: '23:00' },
  jue: { active: true,  open: '12:00', close: '23:00' },
  vie: { active: true,  open: '12:30', close: '23:30' },
  sab: { active: true,  open: '12:30', close: '23:30' },
  dom: { active: true,  open: '12:30', close: '22:30' },
}

const DEFAULT_RESERVATIONS: WeekSchedule = {
  lun: { active: true,  open: '12:00', close: '21:00' },
  mar: { active: true,  open: '12:00', close: '21:00' },
  mie: { active: true,  open: '12:00', close: '21:00' },
  jue: { active: true,  open: '12:00', close: '21:00' },
  vie: { active: true,  open: '12:30', close: '22:00' },
  sab: { active: true,  open: '12:30', close: '22:00' },
  dom: { active: true,  open: '12:30', close: '21:00' },
}

// ─── DayRow ───────────────────────────────────────────────────────────────────

function DayRow({
  dayKey, label, config, onChange,
}: {
  dayKey: DayKey
  label: string
  config: DayConfig
  onChange: (key: DayKey, updated: DayConfig) => void
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-3 border-b border-warm-200 last:border-0 ${!config.active ? 'opacity-40' : ''}`}>
      {/* Toggle */}
      <button
        onClick={() => onChange(dayKey, { ...config, active: !config.active })}
        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${config.active ? 'bg-brand-600' : 'bg-warm-300'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.active ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>

      {/* Day label */}
      <span className="text-sm font-medium text-warm-700 w-20 shrink-0">{label}</span>

      {/* Hours */}
      {config.active ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="time"
            value={config.open}
            onChange={e => onChange(dayKey, { ...config, open: e.target.value })}
            className="border border-warm-300 text-warm-800 text-sm px-3 py-1.5 focus:outline-none focus:border-brand-500 transition-colors w-28"
          />
          <span className="text-warm-400 text-xs">–</span>
          <input
            type="time"
            value={config.close}
            onChange={e => onChange(dayKey, { ...config, close: e.target.value })}
            className="border border-warm-300 text-warm-800 text-sm px-3 py-1.5 focus:outline-none focus:border-brand-500 transition-colors w-28"
          />
        </div>
      ) : (
        <span className="text-warm-400 text-sm">Cerrado</span>
      )}
    </div>
  )
}

// ─── SchedulePanel ────────────────────────────────────────────────────────────

function SchedulePanel({
  type, schedule, onChange, onSave, saved,
}: {
  type: ScheduleType
  schedule: WeekSchedule
  onChange: (key: DayKey, config: DayConfig) => void
  onSave: () => void
  saved: boolean
}) {
  const label = type === 'delivery' ? 'Delivery' : 'Reservas'

  // Apply all days with same hours
  function applyToAll(sourceKey: DayKey) {
    const source = schedule[sourceKey]
    DAY_LABELS.forEach(({ key }) => {
      if (key !== sourceKey) onChange(key, { ...source })
    })
  }

  return (
    <div className="bg-white border border-warm-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-warm-200 bg-warm-50">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-brand-600" />
          <p className="text-sm font-medium text-warm-800">Horario {label}</p>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-ivory text-xs px-3 py-1.5 tracking-wide uppercase font-medium transition-colors"
        >
          {saved ? <CheckCircle2 size={12} /> : <Save size={12} />}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div>
        {DAY_LABELS.map(({ key, label: dayLabel }) => (
          <DayRow
            key={key}
            dayKey={key}
            label={dayLabel}
            config={schedule[key]}
            onChange={onChange}
          />
        ))}
      </div>

      <div className="px-4 py-3 border-t border-warm-100 bg-warm-50">
        <p className="text-warm-500 text-xs mb-2">Aplicar horario del día a todos:</p>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.filter(d => schedule[d.key].active).map(({ key, label: dayLabel }) => (
            <button
              key={key}
              onClick={() => applyToAll(key)}
              className="text-[10px] px-2 py-1 border border-warm-300 text-warm-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              {dayLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HorariosView() {
  const [deliverySchedule, setDeliverySchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)
  const [reservationsSchedule, setReservationsSchedule] = useState<WeekSchedule>(DEFAULT_RESERVATIONS)
  const [isOpen, setIsOpen] = useState(true)
  const [savedDelivery, setSavedDelivery] = useState(false)
  const [savedReservations, setSavedReservations] = useState(false)

  function updateDelivery(key: DayKey, config: DayConfig) {
    setSavedDelivery(false)
    setDeliverySchedule(s => ({ ...s, [key]: config }))
  }

  function updateReservations(key: DayKey, config: DayConfig) {
    setSavedReservations(false)
    setReservationsSchedule(s => ({ ...s, [key]: config }))
  }

  function saveDelivery() {
    // TODO: POST /api/admin/hours { type: 'delivery', schedule: deliverySchedule }
    setSavedDelivery(true)
    setTimeout(() => setSavedDelivery(false), 3000)
  }

  function saveReservations() {
    // TODO: POST /api/admin/hours { type: 'reservations', schedule: reservationsSchedule }
    setSavedReservations(true)
    setTimeout(() => setSavedReservations(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-warm-900 mb-1">Horarios del local</h1>
        <p className="text-warm-500 text-sm">
          Configura horarios independientes para delivery y reservas. Los clientes no podrán pedir ni reservar fuera de estos horarios.
        </p>
      </div>

      {/* On/Off override */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-4 mb-6 border ${isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
      >
        <div className="flex items-center gap-3">
          <Power size={16} className={isOpen ? 'text-emerald-600' : 'text-red-500'} />
          <div>
            <p className={`text-sm font-medium ${isOpen ? 'text-emerald-800' : 'text-red-800'}`}>
              {isOpen ? 'Local abierto' : 'Local cerrado (override)'}
            </p>
            <p className={`text-xs mt-0.5 ${isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
              {isOpen
                ? 'Siguiendo el horario configurado'
                : 'Pedidos y reservas bloqueados hasta reapertura'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(v => !v)}
          className={`w-11 h-6 rounded-full transition-colors relative ${isOpen ? 'bg-emerald-500' : 'bg-red-400'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOpen ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </motion.div>

      {!isOpen && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 mb-6 text-xs text-amber-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          El override de cierre afecta a este local únicamente. Los horarios configurados se respetarán cuando vuelvas a abrir.
        </div>
      )}

      {/* Schedules */}
      <div className="space-y-6">
        <SchedulePanel
          type="delivery"
          schedule={deliverySchedule}
          onChange={updateDelivery}
          onSave={saveDelivery}
          saved={savedDelivery}
        />
        <SchedulePanel
          type="reservations"
          schedule={reservationsSchedule}
          onChange={updateReservations}
          onSave={saveReservations}
          saved={savedReservations}
        />
      </div>
    </div>
  )
}
