'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Save, Power, AlertCircle, CheckCircle2, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

interface DayConfig {
  active: boolean
  open: string
  close: string
}

type WeekSchedule = Record<DayKey, DayConfig>
type ScheduleType = 'delivery' | 'reservations'

interface LocalSchedule {
  delivery: WeekSchedule
  reservations: WeekSchedule
  isOpen: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

const LOCAL_BRANCHES = [
  { id: 'providencia', name: 'Providencia' },
  { id: 'vitacura',    name: 'Vitacura' },
  { id: 'la-reina',   name: 'La Reina' },
  { id: 'la-dehesa',  name: 'La Dehesa' },
]

const DEFAULT_DELIVERY: WeekSchedule = {
  lun: { active: true, open: '12:00', close: '23:00' },
  mar: { active: true, open: '12:00', close: '23:00' },
  mie: { active: true, open: '12:00', close: '23:00' },
  jue: { active: true, open: '12:00', close: '23:00' },
  vie: { active: true, open: '12:30', close: '23:30' },
  sab: { active: true, open: '12:30', close: '23:30' },
  dom: { active: true, open: '12:30', close: '22:30' },
}

const DEFAULT_RESERVATIONS: WeekSchedule = {
  lun: { active: true, open: '12:00', close: '21:00' },
  mar: { active: true, open: '12:00', close: '21:00' },
  mie: { active: true, open: '12:00', close: '21:00' },
  jue: { active: true, open: '12:00', close: '21:00' },
  vie: { active: true, open: '12:30', close: '22:00' },
  sab: { active: true, open: '12:30', close: '22:00' },
  dom: { active: true, open: '12:30', close: '21:00' },
}

function defaultLocalSchedule(): LocalSchedule {
  return {
    delivery: structuredClone(DEFAULT_DELIVERY),
    reservations: structuredClone(DEFAULT_RESERVATIONS),
    isOpen: true,
  }
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
      <button
        onClick={() => onChange(dayKey, { ...config, active: !config.active })}
        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none ${config.active ? 'bg-brand-600' : 'bg-warm-300'}`}
      >
        <span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm font-medium text-warm-700 w-20 shrink-0">{label}</span>
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
  type, schedule, onChange, onSave, saved, saving,
}: {
  type: ScheduleType
  schedule: WeekSchedule
  onChange: (key: DayKey, config: DayConfig) => void
  onSave: () => void
  saved: boolean
  saving: boolean
}) {
  const label = type === 'delivery' ? 'Delivery' : 'Reservas'

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
          disabled={saving}
          className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-ivory text-xs px-3 py-1.5 tracking-wide uppercase font-medium transition-colors focus:outline-none"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle2 size={12} /> : <Save size={12} />}
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
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
              className="text-[10px] px-2 py-1 border border-warm-300 text-warm-500 hover:border-brand-400 hover:text-brand-600 transition-colors focus:outline-none"
            >
              {dayLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── LocalScheduleEditor ──────────────────────────────────────────────────────

function LocalScheduleEditor({
  businessId,
  localName,
  scheduleData,
  onUpdate,
}: {
  businessId: string
  localName: string
  scheduleData: LocalSchedule
  onUpdate: (updated: Partial<LocalSchedule>) => void
}) {
  const [savedDelivery, setSavedDelivery] = useState(false)
  const [savedReservations, setSavedReservations] = useState(false)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [savingReservations, setSavingReservations] = useState(false)

  function updateDelivery(key: DayKey, config: DayConfig) {
    onUpdate({ delivery: { ...scheduleData.delivery, [key]: config } })
  }

  function updateReservations(key: DayKey, config: DayConfig) {
    onUpdate({ reservations: { ...scheduleData.reservations, [key]: config } })
  }

  async function saveSchedule(type: ScheduleType, schedule: WeekSchedule, is_open: boolean) {
    const setLoading = type === 'delivery' ? setSavingDelivery : setSavingReservations
    const setDone = type === 'delivery' ? setSavedDelivery : setSavedReservations

    setLoading(true)
    try {
      const res = await fetch('/api/admin/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, type, schedule, is_open }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch {
      toast.error(`Error al guardar horario de ${type === 'delivery' ? 'Delivery' : 'Reservas'}`)
    } finally {
      setLoading(false)
    }
  }

  function saveDelivery() { saveSchedule('delivery', scheduleData.delivery, scheduleData.isOpen) }
  function saveReservations() { saveSchedule('reservations', scheduleData.reservations, scheduleData.isOpen) }

  return (
    <div className="space-y-4">
      {/* On/Off override */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-4 border ${scheduleData.isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
      >
        <div className="flex items-center gap-3">
          <Power size={16} className={scheduleData.isOpen ? 'text-emerald-600' : 'text-red-500'} />
          <div>
            <p className={`text-sm font-medium ${scheduleData.isOpen ? 'text-emerald-800' : 'text-red-800'}`}>
              {scheduleData.isOpen ? `${localName} abierto` : `${localName} cerrado (override)`}
            </p>
            <p className={`text-xs mt-0.5 ${scheduleData.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
              {scheduleData.isOpen
                ? 'Siguiendo el horario configurado'
                : 'Pedidos y reservas bloqueados hasta reapertura'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onUpdate({ isOpen: !scheduleData.isOpen })}
          className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${scheduleData.isOpen ? 'bg-emerald-500' : 'bg-red-400'}`}
        >
          <span className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform ${scheduleData.isOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </motion.div>

      {!scheduleData.isOpen && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          El override de cierre afecta a este local únicamente. Los horarios configurados se respetarán cuando vuelvas a abrir.
        </div>
      )}

      <SchedulePanel
        type="delivery"
        schedule={scheduleData.delivery}
        onChange={updateDelivery}
        onSave={saveDelivery}
        saved={savedDelivery}
        saving={savingDelivery}
      />
      <SchedulePanel
        type="reservations"
        schedule={scheduleData.reservations}
        onChange={updateReservations}
        onSave={saveReservations}
        saved={savedReservations}
        saving={savingReservations}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HorariosView() {
  const [branch] = useState<{ id: string; name: string } | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('rishtedar_branch')
    return stored ? JSON.parse(stored) : null
  })

  const isAdmin = branch?.id === 'admin'
  const [activeLocal, setActiveLocal] = useState(LOCAL_BRANCHES[0].id)
  const [schedules, setSchedules] = useState<Record<string, LocalSchedule>>(() => {
    const map: Record<string, LocalSchedule> = {}
    LOCAL_BRANCHES.forEach(b => { map[b.id] = defaultLocalSchedule() })
    return map
  })
  const [loading, setLoading] = useState(false)

  const currentBranchId = isAdmin ? activeLocal : (branch?.id ?? '')

  const loadSchedule = useCallback(async (businessId: string) => {
    if (!businessId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/hours?business_id=${businessId}`)
      const data = await res.json()
      if (data.delivery || data.reservations) {
        setSchedules(prev => ({
          ...prev,
          [businessId]: {
            delivery:     data.delivery?.schedule     ?? defaultLocalSchedule().delivery,
            reservations: data.reservations?.schedule ?? defaultLocalSchedule().reservations,
            isOpen:       data.delivery?.is_open ?? true,
          },
        }))
      }
    } catch {
      // mantiene los defaults si falla
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchedule(currentBranchId)
  }, [currentBranchId, loadSchedule])

  function updateLocalSchedule(localId: string, partial: Partial<LocalSchedule>) {
    setSchedules(prev => ({
      ...prev,
      [localId]: { ...prev[localId], ...partial },
    }))
  }

  const localName = isAdmin
    ? (LOCAL_BRANCHES.find(b => b.id === activeLocal)?.name ?? '')
    : (branch?.name ?? 'Local')

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-warm-900 mb-1">Horarios del local</h1>
        <p className="text-warm-500 text-sm">
          Configura horarios independientes para delivery y reservas por cada local.
        </p>
      </div>

      {/* Admin: local selector tabs */}
      {isAdmin && (
        <div className="flex gap-0 mb-6 border border-warm-200 bg-warm-50 overflow-x-auto">
          {LOCAL_BRANCHES.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveLocal(b.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors focus:outline-none border-r border-warm-200 last:border-r-0 ${
                activeLocal === b.id
                  ? 'bg-brand-700 text-ivory'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
              }`}
            >
              <MapPin size={11} />
              {b.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-warm-400" />
        </div>
      ) : (
        <LocalScheduleEditor
          key={currentBranchId}
          businessId={currentBranchId}
          localName={localName}
          scheduleData={schedules[currentBranchId] ?? defaultLocalSchedule()}
          onUpdate={partial => updateLocalSchedule(currentBranchId, partial)}
        />
      )}
    </div>
  )
}
