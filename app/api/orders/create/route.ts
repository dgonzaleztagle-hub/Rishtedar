import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculatePointsForOrder, awardPoints } from '@/lib/services/loyaltyService'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      businessId, customerName, customerPhone, customerEmail,
      deliveryAddress, orderType, items, promoId, customerNote,
    } = body

    if (!businessId || !customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // ── Recalcular precios server-side ────────────────────────────────────────
    // Separar items reales (UUID) de demo (no-UUID)
    type RawItem = { menuItemId?: string; itemName: string; quantity: number; unitPrice?: number; specialInstructions?: string }
    const realIds = (items as RawItem[])
      .map(i => i.menuItemId)
      .filter((id): id is string => !!id && UUID_RE.test(id))

    // Fetch precios reales desde BD
    const priceMap = new Map<string, number>()
    if (realIds.length > 0) {
      const { data: dbItems, error: priceError } = await supabase
        .from('menu_items')
        .select('id, price')
        .in('id', realIds)
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (priceError) throw priceError
      for (const row of dbItems ?? []) priceMap.set(row.id, row.price)
    }

    // Construir líneas de orden con precio verificado
    const resolvedItems = (items as RawItem[]).map(item => {
      const isReal = !!item.menuItemId && UUID_RE.test(item.menuItemId)
      if (isReal && !priceMap.has(item.menuItemId!)) {
        throw new Error(`Item no encontrado o inactivo: ${item.menuItemId}`)
      }
      // Demo items (no UUID) usan precio enviado por cliente — sólo válido en modo demo
      const unitPrice = isReal ? priceMap.get(item.menuItemId!)! : (item.unitPrice ?? 0)
      return { ...item, unitPrice }
    })

    const subtotal = resolvedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

    // ── Verificar y aplicar descuento server-side ─────────────────────────────
    let discountApplied = 0
    if (promoId && UUID_RE.test(promoId)) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: promo } = await supabase
        .from('promotions')
        .select('discount_type, discount_value, valid_from, valid_to, business_id, is_active')
        .eq('id', promoId)
        .single()

      if (
        promo &&
        promo.is_active &&
        promo.valid_from <= today &&
        promo.valid_to >= today &&
        (!promo.business_id || promo.business_id === businessId)
      ) {
        discountApplied = promo.discount_type === 'percent'
          ? Math.round(subtotal * (promo.discount_value / 100))
          : Math.round(promo.discount_value)
      }
    }

    const finalPrice = Math.max(0, subtotal - discountApplied)

    // ── Insertar orden ────────────────────────────────────────────────────────
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
        items_count:      resolvedItems.reduce((s, i) => s + i.quantity, 0),
        subtotal,
        discount_applied: discountApplied,
        final_price:      finalPrice,
        status:           'pending',
        payment_status:   'pending',
        promo_id:         promoId || null,
        customer_note:    customerNote || null,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        resolvedItems.map(item => ({
          order_id:             order.id,
          menu_item_id:         item.menuItemId && UUID_RE.test(item.menuItemId) ? item.menuItemId : null,
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
      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: resolvedItems.map(item => ({
            id:          item.menuItemId || 'item',
            title:       item.itemName,
            quantity:    item.quantity,
            unit_price:  item.unitPrice,
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
      // Sin pasarela activa → confirmar automáticamente (pre-launch)
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
