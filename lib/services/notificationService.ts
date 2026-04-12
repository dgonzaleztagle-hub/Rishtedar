/**
 * notificationService — Consolidated email (Resend) + push (web-push) sending.
 *
 * Used by:
 *  - app/api/reservations/create/route.ts
 *  - app/api/newsletter/subscribe/route.ts
 *  - app/api/push/send/route.ts
 *
 * Server-side only. All functions are no-ops when the relevant env vars are missing.
 */

import { createAdminClient } from '@/lib/supabase/server'

const APP_URL       = process.env.NEXT_PUBLIC_APP_URL  ?? 'https://rishtedar.cl'
const FROM_RESERVAS = process.env.RESEND_FROM_EMAIL    ?? 'reservas@rishtedar.cl'
const FROM_HOLA     = process.env.RESEND_FROM_EMAIL    ?? 'hola@rishtedar.cl'

// ─── Email ────────────────────────────────────────────────────────────────────

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  const { Resend } = await import('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export interface ReservationEmailParams {
  to:                 string
  customerName:       string
  reservationNumber:  string
  reservationDate:    string
  reservationTime:    string
  partySize:          number
}

export async function sendReservationConfirmationEmail(params: ReservationEmailParams): Promise<void> {
  const resend = await getResend()
  if (!resend) return

  const { to, customerName, reservationNumber, reservationDate, reservationTime, partySize } = params

  await resend.emails.send({
    from:    FROM_RESERVAS,
    to,
    subject: `Reserva confirmada #${reservationNumber} · Rishtedar`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #faf7f0;">
        <h1 style="font-style: italic; font-weight: 400; color: #1a1209; margin-bottom: 8px;">¡Reserva confirmada!</h1>
        <p style="color: #6b5240; font-size: 14px;">Hola ${customerName}, tu mesa está reservada.</p>
        <div style="background: white; border: 1px solid #e4d8d1; padding: 24px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #8c6f5a; padding: 4px 0;">Reserva</td>
              <td style="color: #1a1209; font-weight: 500; text-align: right;">#${reservationNumber}</td>
            </tr>
            <tr>
              <td style="color: #8c6f5a; padding: 4px 0;">Fecha</td>
              <td style="color: #1a1209; font-weight: 500; text-align: right;">${reservationDate}</td>
            </tr>
            <tr>
              <td style="color: #8c6f5a; padding: 4px 0;">Hora</td>
              <td style="color: #1a1209; font-weight: 500; text-align: right;">${reservationTime} hrs</td>
            </tr>
            <tr>
              <td style="color: #8c6f5a; padding: 4px 0;">Personas</td>
              <td style="color: #1a1209; font-weight: 500; text-align: right;">${partySize}</td>
            </tr>
          </table>
        </div>
        <p style="color: #8c6f5a; font-size: 13px;">
          Si necesitas modificar tu reserva, llámanos con al menos 2 horas de anticipación.
          <br/>¡Te esperamos!
        </p>
        <p style="color: #c9952a; font-style: italic; font-size: 18px; margin-top: 32px;">Rishtedar</p>
      </div>
    `,
  }).catch(console.error)
}

export interface WelcomeEmailParams {
  to:        string
  firstName: string | null
}

export async function sendNewsletterWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const resend = await getResend()
  if (!resend) return

  const { to, firstName } = params

  await resend.emails.send({
    from:    FROM_HOLA,
    to,
    subject: `Bienvenido/a al círculo Rishtedar${firstName ? `, ${firstName}` : ''}!`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #faf7f0;">
        <p style="color: #c9952a; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Rishtedar Circle</p>
        <h1 style="font-style: italic; font-weight: 300; color: #1a1209; font-size: 32px; margin: 8px 0 16px;">
          ¡Bienvenido/a${firstName ? `, ${firstName}` : ''}!
        </h1>
        <p style="color: #6b5240; font-size: 15px; line-height: 1.7;">
          Ya eres parte del círculo Rishtedar. Pronto recibirás promociones exclusivas,
          adelantos de nuevos platos y beneficios especiales en tu cumpleaños.
        </p>
        <div style="margin: 32px 0; background: white; border: 1px solid #e4d8d1; padding: 20px;">
          <p style="color: #1a1209; font-size: 14px; margin: 0;">
            Recuerda que puedes pedir delivery directamente desde nuestro sitio, sin intermediarios,
            con la mejor experiencia de pago.
          </p>
        </div>
        <a href="${APP_URL}/menu"
          style="display: inline-block; background: #91226f; color: white; padding: 14px 32px;
          text-decoration: none; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">
          Ver menú →
        </a>
        <p style="color: #c9952a; font-style: italic; font-size: 24px; margin-top: 40px;">Rishtedar</p>
      </div>
    `,
  }).catch(console.error)
}

// ─── Push ─────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string
  body?:  string
  url?:   string
}

/**
 * Send a web push notification to all subscriptions for a given customer phone.
 * Cleans up expired subscriptions (410 Gone) automatically.
 * No-op if VAPID keys are not configured.
 */
export async function sendPushToPhone(
  phone:      string,
  payload:    PushPayload,
): Promise<{ sent: number; total: number }> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return { sent: 0, total: 0 }
  }

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:info@rishtedar.cl',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const supabase = await createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys_p256dh, keys_auth')
    .eq('customer_phone', phone)

  if (!subs?.length) return { sent: 0, total: 0 }

  const pushBody = JSON.stringify({
    title: payload.title,
    body:  payload.body  ?? '',
    icon:  '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url:   payload.url   ?? '/app',
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        pushBody,
      )
    )
  )

  // Clean up expired subscriptions
  const expiredEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410) expiredEndpoints.push(subs[i].endpoint)
    }
  })
  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  return { sent, total: subs.length }
}
