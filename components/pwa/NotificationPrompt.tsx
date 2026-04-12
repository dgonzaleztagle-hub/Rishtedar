'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_DISMISSED  = 'rishtedar_notif_dismissed'
const LS_ASKED_AT   = 'rishtedar_notif_asked_at'
const ASK_COOLDOWN_DAYS = 30

// ─── Helper: subscribe to push ────────────────────────────────────────────────

async function subscribeToPush(customerPhone?: string, businessId?: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription:   sub.toJSON(),
        customer_phone: customerPhone,
        business_id:    businessId,
      }),
    })
    return true
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}

// ─── Auto-subscribe if already granted ────────────────────────────────────────
// Llamado desde SwRegistrar para suscripción silenciosa

export async function autoSubscribeIfGranted(customerPhone?: string, businessId?: string) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  await subscribeToPush(customerPhone, businessId)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationPromptProps {
  moment: 'post_order' | 'post_reservation' | 'circle_milestone'
  customerPhone?: string
  businessId?: string
}

const PROMPT_COPY: Record<NotificationPromptProps['moment'], { title: string; desc: string }> = {
  post_order:        { title: '¿Te avisamos cuando esté listo?', desc: 'Recibe una notificación cuando tu pedido esté en camino o listo para retirar.' },
  post_reservation:  { title: '¿Recordatorio de reserva?',       desc: 'Te avisamos 1 hora antes de tu reserva para que no se te pase.' },
  circle_milestone:  { title: '¿Activar avisos Circle?',          desc: 'Te notificamos cuando ganes premios o estés cerca de subir de tier.' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPrompt({ moment, customerPhone, businessId }: NotificationPromptProps) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    if (Notification.permission !== 'default') return false
    if (localStorage.getItem(LS_DISMISSED) === 'true') return false
    const askedAt = localStorage.getItem(LS_ASKED_AT)
    if (askedAt) {
      const diff = (Date.now() - parseInt(askedAt, 10)) / (1000 * 60 * 60 * 24)
      if (diff < ASK_COOLDOWN_DAYS) return false
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return false
    return true
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function handleAccept() {
    setLoading(true)
    localStorage.setItem(LS_ASKED_AT, String(Date.now()))

    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      await subscribeToPush(customerPhone, businessId)
      setDone(true)
      setTimeout(() => setVisible(false), 2000)
    } else if (permission === 'denied') {
      localStorage.setItem(LS_DISMISSED, 'true')
      setVisible(false)
    } else {
      setVisible(false)
    }
    setLoading(false)
  }

  function handleDismiss() {
    localStorage.setItem(LS_DISMISSED, 'true')
    setVisible(false)
  }

  const copy = PROMPT_COPY[moment]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className="mt-4 border border-brand-200 bg-brand-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
              {done
                ? <span className="text-base">✓</span>
                : <Bell size={15} className="text-brand-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-warm-900 text-sm font-medium">{done ? '¡Listo! Te avisaremos.' : copy.title}</p>
              {!done && <p className="text-warm-500 text-xs mt-0.5 leading-relaxed">{copy.desc}</p>}
            </div>
            {!done && (
              <button
                onClick={handleDismiss}
                className="text-warm-400 hover:text-warm-600 shrink-0 mt-0.5 transition-colors"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {!done && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-ivory py-2 text-xs tracking-wider uppercase font-medium transition-colors"
              >
                {loading ? 'Activando...' : 'Sí, avísame'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 border border-warm-300 text-warm-500 hover:text-warm-700 text-xs uppercase tracking-wider transition-colors"
              >
                No
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
