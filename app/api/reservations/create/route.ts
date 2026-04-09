import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      businessId, customerName, customerPhone, customerEmail,
      reservationDate, reservationTime, partySize,
      tablePreference, specialRequests,
    } = body

    if (!businessId || !customerName || !customerPhone || !reservationDate || !reservationTime || !partySize) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const reservationNumber = `RSV-${Date.now().toString(36).toUpperCase()}`

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        reservation_number: reservationNumber,
        business_id: businessId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        party_size: partySize,
        table_preference: tablePreference || null,
        special_requests: specialRequests || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    // Send confirmation email via Resend
    if (customerEmail && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reservas@rishtedar.cl',
        to: customerEmail,
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

    return NextResponse.json({
      reservationId: reservation.id,
      reservationNumber,
    })
  } catch (error) {
    console.error('[reservations/create]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
