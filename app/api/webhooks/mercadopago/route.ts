import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { awardLoyaltyPoints } from '@/app/api/orders/create/route'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MercadoPago sends type + data.id on payment notifications
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ received: true })

    // Fetch payment details from MercadoPago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    if (!mpRes.ok) throw new Error('MP payment fetch failed')

    const payment = await mpRes.json()
    const orderId = payment.external_reference

    if (!orderId) return NextResponse.json({ received: true })

    const supabase = await createAdminClient()

    if (payment.status === 'approved') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
        })
        .eq('id', orderId)

      // Award loyalty points now that payment is confirmed
      const { data: order } = await supabase
        .from('orders')
        .select('customer_phone, customer_name, business_id, order_number, final_price')
        .eq('id', orderId)
        .maybeSingle()

      if (order?.customer_phone) {
        await awardLoyaltyPoints(supabase, {
          customerPhone: order.customer_phone,
          customerName:  order.customer_name,
          businessId:    order.business_id,
          orderId,
          orderNumber:   order.order_number,
          finalPrice:    order.final_price,
        })
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await supabase
        .from('orders')
        .update({ payment_status: 'refunded', status: 'cancelled' })
        .eq('id', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook/mercadopago]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
