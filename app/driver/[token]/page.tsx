'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, Package, Navigation, CheckCircle2,
  Camera, Loader2, AlertCircle, ExternalLink, ChevronRight, MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCLP } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingStatus = 'assigned' | 'pickup' | 'in_transit' | 'delivered'

interface OrderItem {
  quantity: number
  unit_price: number
  item_name: string | null
  special_instructions: string | null
}

interface OrderData {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  delivery_address: string | null
  delivery_latitude: number | null
  delivery_longitude: number | null
  final_price: number
  customer_note?: string | null
}

interface TrackingData {
  order_id: string
  status: TrackingStatus
  driver_name: string | null
  delivery_photo_url: string | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_STEPS: { key: TrackingStatus; label: string; icon: typeof Package }[] = [
  { key: 'assigned',   label: 'Asignado',    icon: Package },
  { key: 'pickup',     label: 'Recogido',    icon: Package },
  { key: 'in_transit', label: 'En camino',   icon: Navigation },
  { key: 'delivered',  label: 'Entregado',   icon: CheckCircle2 },
]

const NEXT_STATUS: Record<TrackingStatus, TrackingStatus | null> = {
  assigned:   'pickup',
  pickup:     'in_transit',
  in_transit: 'delivered',
  delivered:  null,
}

const NEXT_ACTION: Record<TrackingStatus, string> = {
  assigned:   'Confirmé recogida en local',
  pickup:     'Salí a entregar',
  in_transit: 'Subir foto y marcar entregado',
  delivered:  'Entregado ✓',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [token, setToken]         = useState<string>('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [order, setOrder]         = useState<OrderData | null>(null)
  const [items, setItems]         = useState<OrderItem[]>([])
  const [tracking, setTracking]   = useState<TrackingData | null>(null)
  const [updating, setUpdating]   = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUrl, setPhotoUrl]   = useState<string | null>(null)
  const [driverNote, setDriverNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // ── Resolve params ─────────────────────────────────────────────────────────
  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (tkn: string) => {
    setLoading(true)

    // Demo mode — no DB needed
    if (tkn === 'demo-token') {
      setOrder({
        id: 'demo-order',
        order_number: 'RSH-DEMO01',
        customer_name: 'Sofía Herrera',
        customer_phone: '+56912345678',
        delivery_address: 'Ricardo Lyon 222, Dpto 12, Providencia',
        delivery_latitude: -33.4245,
        delivery_longitude: -70.6083,
        final_price: 33900,
      })
      setItems([
        { quantity: 1, unit_price: 18900, item_name: 'Lamb Rogan Josh', special_instructions: null },
        { quantity: 1, unit_price: 15000, item_name: 'Dal Makhani', special_instructions: 'Sin picante' },
      ])
      setTracking({ order_id: 'demo-order', status: 'assigned', driver_name: 'Repartidor Demo', delivery_photo_url: null })
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/delivery/${tkn}`)
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Link inválido o entrega ya completada')
        return
      }
      const json = await res.json()
      setOrder(json.order)
      setItems(json.items ?? [])
      setTracking(json.tracking)
      setPhotoUrl(json.tracking?.delivery_photo_url ?? null)
      setDriverNote(json.tracking?.driver_note ?? '')
    } catch {
      setError('Error al cargar los datos del pedido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) fetchData(token)
  }, [token, fetchData])

  // ── Update status ─────────────────────────────────────────────────────────
  async function updateStatus(newStatus: TrackingStatus, uploadedPhotoUrl?: string) {
    if (!token || !tracking) return
    setUpdating(true)

    // Demo mode — solo actualiza UI
    if (token === 'demo-token') {
      await new Promise(r => setTimeout(r, 600))
      setTracking(prev => prev ? { ...prev, status: newStatus } : prev)
      if (uploadedPhotoUrl) setPhotoUrl(uploadedPhotoUrl)
      setUpdating(false)
      return
    }

    try {
      const body: Record<string, string> = { status: newStatus }
      if (uploadedPhotoUrl) body.delivery_photo_url = uploadedPhotoUrl

      const res = await fetch(`/api/delivery/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setTracking(prev => prev ? { ...prev, status: newStatus } : prev)
      if (uploadedPhotoUrl) setPhotoUrl(uploadedPhotoUrl)
    } catch {
      // Silencioso — actualizamos UI igual
      setTracking(prev => prev ? { ...prev, status: newStatus } : prev)
    } finally {
      setUpdating(false)
    }
  }

  // ── Save driver note ──────────────────────────────────────────────────────
  async function saveDriverNote() {
    if (!token || token === 'demo-token') { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); return }
    setSavingNote(true)
    try {
      await fetch(`/api/delivery/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_note: driverNote }),
      })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } finally {
      setSavingNote(false)
    }
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !order) return
    setPhotoUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${order.id}.${ext}`
      const { error: upError } = await supabase.storage
        .from('delivery-photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (upError) throw upError

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(path)

      await updateStatus('delivered', publicUrl)
    } catch {
      // Fallback: marcar entregado sin foto
      await updateStatus('delivered')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Google Maps link ──────────────────────────────────────────────────────
  function getMapsUrl(): string {
    if (!order) return '#'
    if (order.delivery_latitude && order.delivery_longitude) {
      return `https://maps.google.com/?q=${order.delivery_latitude},${order.delivery_longitude}`
    }
    return `https://maps.google.com/?q=${encodeURIComponent(order.delivery_address ?? '')}`
  }

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <Loader2 size={28} className="text-warm-600 animate-spin" />
      </div>
    )
  }

  // ── Render: Error ─────────────────────────────────────────────────────────
  if (error || !order || !tracking) {
    return (
      <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h1 className="font-display text-2xl italic text-ivory mb-2">Link inválido</h1>
        <p className="text-warm-500 text-sm">{error ?? 'Esta entrega ya fue completada o el link expiró.'}</p>
      </div>
    )
  }

  const stepIndex     = STATUS_STEPS.findIndex(s => s.key === tracking.status)
  const nextStatus    = NEXT_STATUS[tracking.status]
  const isDelivered   = tracking.status === 'delivered'
  const needsPhoto    = tracking.status === 'in_transit'

  // ── Render: Active ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-warm-950 text-ivory pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-warm-800">
        <p className="text-warm-500 text-[10px] tracking-[0.25em] uppercase mb-1">Rishtedar · Delivery</p>
        <h1 className="font-display text-2xl italic text-ivory leading-tight">
          {isDelivered ? 'Entrega completada' : 'Delivery en curso'}
        </h1>
        <p className="text-warm-600 text-xs mt-0.5">{order.order_number}</p>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Progress steps ──────────────────────────────────────────────── */}
        <div className="flex items-start">
          {STATUS_STEPS.map((step, i) => {
            const done    = i < stepIndex
            const current = i === stepIndex
            const StepIcon = step.icon
            return (
              <div key={step.key} className="flex items-start flex-1">
                {/* circle + label */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done    ? 'bg-gold-700 border-gold-600' :
                    current ? 'bg-brand-700 border-brand-500 ring-2 ring-brand-800' :
                              'bg-warm-900 border-warm-700'
                  }`}>
                    {done
                      ? <CheckCircle2 size={14} className="text-ivory" />
                      : <StepIcon size={13} className={current ? 'text-ivory' : 'text-warm-600'} />
                    }
                  </div>
                  <span className={`text-[9px] text-center leading-tight ${current ? 'text-brand-400 font-medium' : done ? 'text-warm-500' : 'text-warm-700'}`}>
                    {step.label}
                  </span>
                </div>
                {/* connector line */}
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-4 ${done ? 'bg-gold-700' : 'bg-warm-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Customer card ────────────────────────────────────────────────── */}
        <div className="bg-warm-900 border border-warm-800 p-4 space-y-3">
          <p className="text-warm-500 text-[10px] tracking-wider uppercase">Cliente</p>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-ivory font-medium">{order.customer_name}</p>
              <div className="flex items-start gap-1.5 mt-2">
                <MapPin size={12} className="text-warm-500 mt-0.5 shrink-0" />
                <p className="text-warm-400 text-sm leading-snug">{order.delivery_address ?? 'Dirección no disponible'}</p>
              </div>
              {order.customer_note && (
                <div className="mt-2 flex items-start gap-1.5 bg-amber-950/40 border border-amber-800/40 px-3 py-2">
                  <MessageSquare size={11} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-300 text-xs leading-snug">{order.customer_note}</p>
                </div>
              )}
            </div>
            <a
              href={`tel:${order.customer_phone}`}
              className="w-9 h-9 bg-warm-800 border border-warm-700 flex items-center justify-center shrink-0 hover:bg-warm-700 transition-colors"
            >
              <Phone size={14} className="text-warm-300" />
            </a>
          </div>
          <a
            href={getMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-warm-800 hover:bg-warm-700 border border-warm-700 px-4 py-2.5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Navigation size={13} className="text-brand-400" />
              <span className="text-ivory text-sm">Abrir en Google Maps</span>
            </div>
            <ExternalLink size={12} className="text-warm-500" />
          </a>
        </div>

        {/* ── Order items ──────────────────────────────────────────────────── */}
        <div className="bg-warm-900 border border-warm-800 p-4">
          <p className="text-warm-500 text-[10px] tracking-wider uppercase mb-3">Pedido</p>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-warm-200 text-sm">
                      <span className="text-warm-500 mr-1">{item.quantity}×</span>
                      {item.item_name ?? 'Ítem sin nombre'}
                    </p>
                    {item.special_instructions && (
                      <p className="text-amber-500 text-xs mt-0.5">⚠ {item.special_instructions}</p>
                    )}
                  </div>
                  <p className="text-warm-400 text-xs shrink-0">{formatCLP(item.unit_price * item.quantity)}</p>
                </div>
              ))
            ) : (
              <p className="text-warm-600 text-sm">Sin detalle de ítems</p>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-warm-800 flex justify-between">
            <span className="text-warm-500 text-sm">Total</span>
            <span className="text-ivory font-semibold">{formatCLP(order.final_price)}</span>
          </div>
        </div>

        {/* ── Photo preview if uploaded ────────────────────────────────────── */}
        <AnimatePresence>
          {photoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warm-900 border border-emerald-800/40 p-4"
            >
              <p className="text-warm-500 text-[10px] tracking-wider uppercase mb-2">Foto de entrega</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Foto de entrega" className="w-full rounded object-cover max-h-48" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Driver note ─────────────────────────────────────────────────── */}
        <div className="bg-warm-900 border border-warm-800 p-4">
          <p className="text-warm-500 text-[10px] tracking-wider uppercase mb-2">Nota interna</p>
          <textarea
            value={driverNote}
            onChange={e => setDriverNote(e.target.value)}
            placeholder="Ej: cliente complicado, interfono no funciona, 2do piso..."
            rows={3}
            className="w-full bg-warm-800 border border-warm-700 text-ivory text-sm px-3 py-2 resize-none placeholder:text-warm-600 focus:outline-none focus:border-warm-500"
          />
          <button
            onClick={saveDriverNote}
            disabled={savingNote}
            className="mt-2 w-full bg-warm-800 hover:bg-warm-700 border border-warm-700 text-warm-300 text-xs py-2 transition-colors disabled:opacity-60"
          >
            {savingNote ? 'Guardando…' : noteSaved ? '✓ Guardado' : 'Guardar nota'}
          </button>
        </div>

        {/* ── Delivered success ────────────────────────────────────────────── */}
        <AnimatePresence>
          {isDelivered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-950/60 border border-emerald-800/40 p-5 text-center"
            >
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-300 font-medium">¡Entrega completada!</p>
              <p className="text-warm-500 text-sm mt-1">Gracias, {tracking.driver_name ?? 'repartidor'}. El pedido fue confirmado.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed action button ───────────────────────────────────────────── */}
      {!isDelivered && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-warm-950 border-t border-warm-800">

          {/* Photo upload input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {needsPhoto ? (
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading || updating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white py-4 text-sm font-medium transition-colors"
              >
                {photoUploading
                  ? <><Loader2 size={16} className="animate-spin" /> Subiendo foto...</>
                  : <><Camera size={16} /> Tomar foto + Marcar entregado</>
                }
              </button>
              <button
                onClick={() => updateStatus('delivered')}
                disabled={photoUploading || updating}
                className="w-full text-warm-500 hover:text-warm-300 text-xs py-2 transition-colors"
              >
                Marcar entregado sin foto
              </button>
            </div>
          ) : (
            <button
              onClick={() => nextStatus && updateStatus(nextStatus)}
              disabled={updating || !nextStatus}
              className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-ivory py-4 text-sm font-medium transition-colors"
            >
              {updating
                ? <><Loader2 size={16} className="animate-spin" /> Actualizando...</>
                : <>{NEXT_ACTION[tracking.status]} <ChevronRight size={16} /></>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
