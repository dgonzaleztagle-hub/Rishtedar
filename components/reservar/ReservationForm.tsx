'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isBefore, startOfDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MapPin, Users, User, Phone, Mail,
  MessageSquare, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { LOCATIONS } from '@/lib/locations'
import { toast } from 'sonner'

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20]

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
]

type Step = 1 | 2 | 3 | 4

export function ReservationForm({ initialLocal }: { initialLocal?: string }) {
  // Validate initialLocal against known active locations
  const preselectedLocal = initialLocal && LOCATIONS.some(l => l.id === initialLocal && l.is_active)
    ? initialLocal
    : null

  const [step, setStep] = useState<Step>(1)
  const [selectedLocal, setSelectedLocal] = useState<string | null>(preselectedLocal)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(2)
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    tablePreference: '', specialRequests: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState<{ number: string } | null>(null)

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Calendar helpers
  const today = startOfDay(new Date())

  function buildCalendarDays() {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
    const days: (Date | null)[] = []
    // Padding (Mon=0...Sun=6)
    const firstDay = (start.getDay() + 6) % 7 // Convert Sun=0 to Mon=0
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d))
    }
    return days
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) {
      toast.error('Por favor completa nombre y teléfono')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedLocal,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email || null,
          reservationDate: format(selectedDate!, 'yyyy-MM-dd'),
          reservationTime: selectedTime,
          partySize,
          tablePreference: form.tablePreference || null,
          specialRequests: form.specialRequests || null,
        }),
      })

      if (!res.ok) throw new Error('Error')

      const data = await res.json()
      setConfirmed({ number: data.reservationNumber })
      setStep(4)
    } catch {
      toast.error('No se pudo completar la reserva. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const calendarDays = buildCalendarDays()
  const selectedLocalData = LOCATIONS.find(l => l.id === selectedLocal)

  if (confirmed) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-brand-600" />
          </div>
          <h2 className="font-display text-4xl italic text-warm-950 mb-2">¡Reserva confirmada!</h2>
          <p className="text-warm-500 mb-6">
            Reserva #{confirmed.number} confirmada.{form.email ? ' Te hemos enviado los detalles al correo.' : ' Guarda este número como referencia.'}
          </p>
          <div className="bg-white border border-warm-200 p-6 text-left mb-8 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">Local</span>
              <span className="text-warm-800 font-medium">{selectedLocalData?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">Fecha</span>
              <span className="text-warm-800 font-medium">
                {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">Hora</span>
              <span className="text-warm-800 font-medium">{selectedTime} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">Personas</span>
              <span className="text-warm-800 font-medium">{partySize}</span>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-brand-700 hover:bg-brand-800 text-ivory px-8 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
          >
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {([1, 2, 3] as const).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                step >= s
                  ? 'bg-brand-700 text-ivory'
                  : 'bg-warm-200 text-warm-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-px flex-1 w-12 transition-all ${step > s ? 'bg-brand-700' : 'bg-warm-200'}`} />}
          </div>
        ))}
        <span className="ml-3 text-warm-400 text-sm">
          {step === 1 ? 'Local y fecha' : step === 2 ? 'Hora y personas' : 'Tus datos'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Local + Date */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Local selector — collapsed if pre-selected from URL */}
            <div>
              {preselectedLocal ? (
                // Pre-selected: show as confirmation badge, allow changing
                <div className="flex items-center justify-between p-4 border-2 border-brand-600 bg-brand-50">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-brand-600 shrink-0" />
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-brand-500 mb-0.5">Reservando en</p>
                      <p className="font-medium text-brand-800">
                        {LOCATIONS.find(l => l.id === selectedLocal)?.name.replace('Rishtedar ', '')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLocal(null)}
                    className="text-xs text-brand-600 underline underline-offset-2 hover:text-brand-800 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                // Normal selector
                <>
                  <h2 className="font-display text-3xl italic text-warm-950 mb-5">¿En qué local?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {LOCATIONS.filter(l => l.is_active).map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocal(loc.id)}
                        className={`flex items-start gap-3 p-4 border-2 text-left transition-all ${
                          selectedLocal === loc.id
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-warm-200 hover:border-warm-300'
                        }`}
                      >
                        <MapPin size={16} className={`mt-0.5 shrink-0 ${selectedLocal === loc.id ? 'text-brand-600' : 'text-warm-400'}`} />
                        <div>
                          <p className={`font-medium text-sm ${selectedLocal === loc.id ? 'text-brand-700' : 'text-warm-800'}`}>
                            {loc.name.replace('Rishtedar ', '')}
                          </p>
                          <p className="text-warm-500 text-xs mt-0.5">{loc.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date picker */}
            {selectedLocal && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-3xl italic text-warm-950 mb-5">¿Qué día?</h2>
                <div className="bg-white border border-warm-200 p-6">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-1.5 text-warm-400 hover:text-warm-600 disabled:opacity-30"
                      disabled={calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear()}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <p className="font-medium text-warm-800 capitalize">
                      {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                    </p>
                    <button
                      onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-1.5 text-warm-400 hover:text-warm-600"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                      <div key={d} className="text-center text-warm-400 text-xs font-medium py-1">{d}</div>
                    ))}
                  </div>
                  {/* Days */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`empty-${i}`} />
                      const isPast = isBefore(startOfDay(day), today)
                      const isSelected = selectedDate?.toDateString() === day.toDateString()
                      const isCurrentDay = isToday(day)

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => !isPast && setSelectedDate(day)}
                          disabled={isPast}
                          className={`h-9 w-full flex items-center justify-center text-sm transition-all ${
                            isSelected
                              ? 'bg-brand-700 text-ivory font-medium'
                              : isPast
                              ? 'text-warm-300 cursor-not-allowed'
                              : isCurrentDay
                              ? 'bg-warm-100 text-warm-800 font-medium hover:bg-brand-50'
                              : 'text-warm-700 hover:bg-warm-50'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedLocal || !selectedDate}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors"
            >
              Continuar →
            </button>
          </motion.div>
        )}

        {/* Step 2: Time + party size */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display text-3xl italic text-warm-950 mb-1">¿A qué hora?</h2>
              <p className="text-warm-400 text-sm mb-5">
                {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : ''}
              </p>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {TIME_SLOTS.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 text-sm font-medium border transition-all ${
                      selectedTime === time
                        ? 'bg-brand-700 border-brand-700 text-ivory'
                        : 'border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl italic text-warm-950 mb-5">¿Cuántos son?</h2>
              <div className="flex flex-wrap gap-2">
                {PARTY_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setPartySize(size)}
                    className={`w-12 h-12 flex items-center justify-center border transition-all ${
                      partySize === size
                        ? 'bg-brand-700 border-brand-700 text-ivory font-medium'
                        : 'border-warm-200 text-warm-700 hover:border-brand-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-warm-400 text-sm">
                <Users size={14} />
                <span>{partySize} {partySize === 1 ? 'persona' : 'personas'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 border border-warm-300 text-warm-600 px-6 py-4 text-xs tracking-widest uppercase font-medium hover:border-warm-400 transition-colors"
              >
                <ChevronLeft size={13} /> Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTime}
                className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors"
              >
                Continuar →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Customer info */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="font-display text-3xl italic text-warm-950">Tus datos</h2>

            {/* Summary */}
            <div className="bg-warm-50 border border-warm-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-warm-400 text-xs uppercase tracking-wider mb-0.5">Local</p>
                <p className="text-warm-800 font-medium">{selectedLocalData?.name.replace('Rishtedar ', '')}</p>
              </div>
              <div>
                <p className="text-warm-400 text-xs uppercase tracking-wider mb-0.5">Fecha</p>
                <p className="text-warm-800 font-medium">
                  {selectedDate ? format(selectedDate, 'd MMM', { locale: es }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-warm-400 text-xs uppercase tracking-wider mb-0.5">Hora</p>
                <p className="text-warm-800 font-medium">{selectedTime} hrs</p>
              </div>
              <div>
                <p className="text-warm-400 text-xs uppercase tracking-wider mb-0.5">Personas</p>
                <p className="text-warm-800 font-medium">{partySize}</p>
              </div>
            </div>

            <div className="bg-white border border-warm-200 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <User size={11} /> Nombre *
                  </span>
                  <input
                    type="text" name="name" value={form.name} onChange={handleFormChange}
                    required placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <Phone size={11} /> Teléfono *
                  </span>
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleFormChange}
                    required placeholder="+56 9 1234 5678"
                    className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <Mail size={11} /> Email
                  </span>
                  <input
                    type="email" name="email" value={form.email} onChange={handleFormChange}
                    placeholder="para recibir confirmación"
                    className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Preferencia de mesa</span>
                  <select
                    name="tablePreference" value={form.tablePreference} onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm focus:outline-none focus:border-brand-400 transition-colors"
                  >
                    <option value="">Sin preferencia</option>
                    <option value="interior">Interior</option>
                    <option value="terraza">Terraza</option>
                    <option value="privado">Sala privada</option>
                    <option value="ventana">Junto a la ventana</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={11} /> Solicitudes especiales
                  </span>
                  <textarea
                    name="specialRequests" value={form.specialRequests} onChange={handleFormChange}
                    placeholder="Cumpleaños, alergias, silla para bebé..."
                    rows={2}
                    className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors resize-none"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 border border-warm-300 text-warm-600 px-6 py-4 text-xs tracking-widest uppercase font-medium hover:border-warm-400 transition-colors"
              >
                <ChevronLeft size={13} /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-70 disabled:cursor-not-allowed text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors"
              >
                {loading ? 'Confirmando...' : 'Confirmar reserva →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
