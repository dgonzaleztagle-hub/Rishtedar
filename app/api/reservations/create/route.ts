import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReservationConfirmationEmail } from '@/lib/services/notificationService'

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
        business_id:        businessId,
        customer_name:      customerName,
        customer_phone:     customerPhone,
        customer_email:     customerEmail || null,
        reservation_date:   reservationDate,
        reservation_time:   reservationTime,
        party_size:         partySize,
        table_preference:   tablePreference || null,
        special_requests:   specialRequests || null,
        status:             'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    if (customerEmail) {
      await sendReservationConfirmationEmail({
        to:                customerEmail,
        customerName,
        reservationNumber,
        reservationDate,
        reservationTime,
        partySize,
      })
    }

    return NextResponse.json({ reservationId: reservation.id, reservationNumber })
  } catch (error) {
    console.error('[reservations/create]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
