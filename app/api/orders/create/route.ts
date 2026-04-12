import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculatePointsForOrder, awardPoints } from '@/lib/services/loyaltyService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      businessId, customerName, customerPhone, customerEmail,
      deliveryAddress, orderType, items, subtotal,
      discountApplied, finalPrice, promoId,
    } = body

    if (!businessId || !customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const orderNumber = `RSH-${Date.now().toString(36).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number:     orderNumber,
        business_id:      businessId,
        customer_name:    customerName,
        customer_phone:   customerPhone,
        customer_email:   customerEmail || null,
        delivery_address: deliveryAddress || null,
        order_type:       orderType,
        items_count:      items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
        subtotal,
        discount_applied: discountApplied || 0,
        final_price:      finalPrice,
        status:           'pending',
        payment_status:   'pending',
        promo_id:         promoId || null,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // UUID validation — demo IDs like "item-p01" are not valid UUIDs
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const toUuid = (id: string | null | undefined) =>
      id && UUID_RE.test(id) ? id : null

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map((item: { menuItemId: string; itemName: string; quantity: number; unitPrice: number; specialInstructions?: string }) => ({
          order_id:             order.id,
          menu_item_id:         toUuid(item.menuItemId),
          item_name:            item.itemName,
          quantity:             item.quantity,
          unit_price:           item.unitPrice,
          special_instructions: item.specialInstructions || null,
        }))
      )

    if (itemsError) throw itemsError

    const isMiami = businessId === 'miami-wynwood'
    let preferenceUrl: string | null = null

    if (!isMiami && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      // MercadoPago live flow
      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: items.map((item: { menuItemId: string; itemName: string; quantity: number; unitPrice: number }) => ({
            id:         item.menuItemId || 'item',
            title:      item.itemName,
            quantity:   item.quantity,
            unit_price: item.unitPrice,
            currency_id: 'CLP',
          })),
          payer: {
            name:  customerName,
            phone: { number: customerPhone },
            email: customerEmail || undefined,
          },
          external_reference: order.id,
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirmation?order=${order.id}`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/order/checkout?error=1`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirmation?order=${order.id}&status=pending`,
          },
          auto_return:      'approved',
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        }),
      })

      if (mpRes.ok) {
        const mpData = await mpRes.json()
        preferenceUrl = mpData.init_point
      }
    } else {
      // No payment credentials → auto-confirm (dev/pre-launch bypass)
      await supabase
        .from('orders')
        .update({ status: 'confirmed', payment_status: 'paid', payment_method: 'bypass' })
        .eq('id', order.id)

      if (customerPhone && finalPrice > 0) {
        const points = calculatePointsForOrder(finalPrice)
        await awardPoints({
          customerPhone,
          customerName,
          businessId,
          orderId:     order.id,
          orderNumber: `Pedido ${orderNumber} · $${finalPrice.toLocaleString('es-CL')}`,
          points,
          reason:      'order',
        })
      }
    }

    return NextResponse.json({ orderId: order.id, orderNumber, preferenceUrl })
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : JSON.stringify(error, Object.getOwnPropertyNames(error as object))
    console.error('[orders/create]', msg)
    return NextResponse.json({ error: 'Error interno del servidor', detail: msg }, { status: 500 })
  }
}
