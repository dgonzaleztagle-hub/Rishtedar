// Capa unificada de tracking. Centraliza: nuestra DB, GA4, Meta Pixel.
// Llamar desde páginas y componentes cliente.

import { v4 as uuidv4 } from 'uuid'

const VISITOR_KEY = 'rsh_vid'
const SESSION_KEY = 'rsh_sid'
const SESSION_TS_KEY = 'rsh_sts'
const UTM_KEY = 'rsh_utm'
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 min

export type AnalyticsEvent =
  | 'page_view'
  | 'view_menu'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'reservation_started'
  | 'reservation_completed'
  | 'lead_captured'

interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_KEY)
    if (!vid) {
      vid = uuidv4()
      localStorage.setItem(VISITOR_KEY, vid)
    }
    return vid
  } catch {
    return uuidv4()
  }
}

function getOrCreateSession(): string {
  try {
    const now = Date.now()
    const lastTs = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10)
    let sid = localStorage.getItem(SESSION_KEY)

    if (!sid || now - lastTs > SESSION_TTL_MS) {
      sid = uuidv4()
      localStorage.setItem(SESSION_KEY, sid)
    }
    localStorage.setItem(SESSION_TS_KEY, String(now))
    return sid
  } catch {
    return uuidv4()
  }
}

function captureUtms(): UtmParams {
  try {
    const params = new URLSearchParams(window.location.search)
    const utms: UtmParams = {}
    if (params.get('utm_source')) utms.utm_source = params.get('utm_source')!
    if (params.get('utm_medium')) utms.utm_medium = params.get('utm_medium')!
    if (params.get('utm_campaign')) utms.utm_campaign = params.get('utm_campaign')!
    if (params.get('utm_content')) utms.utm_content = params.get('utm_content')!

    if (Object.keys(utms).length > 0) {
      localStorage.setItem(UTM_KEY, JSON.stringify(utms))
      return utms
    }
    const stored = localStorage.getItem(UTM_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile'
  return 'desktop'
}

// Ping de heartbeat — llamar cada 30 seg para mantener "online ahora" actualizado.
export function pingSession(): void {
  const sessionId = getOrCreateSession()
  fetch('/api/analytics/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  }).catch(() => {})
}

// Inicia o recupera sesión, registra en DB si es nueva.
export async function initSession(businessId?: string): Promise<string> {
  const visitorId = getOrCreateVisitorId()
  const sessionId = getOrCreateSession()
  const utms = captureUtms()

  // Registrar sesión (upsert — si ya existe no hace nada por UNIQUE session_id)
  await fetch('/api/analytics/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      business_id: businessId ?? null,
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      device: getDevice(),
      ...utms,
    }),
  }).catch(() => {}) // silencioso — nunca romper UX por analytics

  return sessionId
}

// Dispara un evento a nuestra DB + GA4 + Meta Pixel.
export async function trackEvent(
  eventName: AnalyticsEvent,
  payload: Record<string, unknown> = {},
  businessId?: string
): Promise<void> {
  const sessionId = getOrCreateSession()

  // 1. Nuestra DB
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, business_id: businessId, event_name: eventName, payload }),
  }).catch(() => {})

  // 2. GA4 (gtag — inyectado por layout.tsx)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const gtagName = GA4_EVENT_MAP[eventName]
    if (gtagName) {
      ;(window as any).gtag('event', gtagName, {
        ...payload,
        business_id: businessId,
      })
    }
  }

  // 3. Meta Pixel (fbq — inyectado por layout.tsx)
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const fbName = META_EVENT_MAP[eventName]
    if (fbName) {
      ;(window as any).fbq('track', fbName, { ...payload, content_category: businessId })
    }
  }
}

// Mapeo de eventos propios → GA4 standard events
const GA4_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  page_view: 'page_view',
  view_menu: 'view_item_list',
  add_to_cart: 'add_to_cart',
  remove_from_cart: 'remove_from_cart',
  begin_checkout: 'begin_checkout',
  purchase: 'purchase',
  reservation_started: 'begin_checkout',
  reservation_completed: 'purchase',
  lead_captured: 'generate_lead',
}

// Mapeo de eventos propios → Meta standard events
const META_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  page_view: 'PageView',
  view_menu: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  reservation_completed: 'Purchase',
  lead_captured: 'Lead',
}
