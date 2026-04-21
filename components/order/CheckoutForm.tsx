'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import { formatCLP } from '@/lib/utils'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics/tracker'
import {
  MapPin, Phone, User, ChevronRight, Lock,
  Smartphone, CreditCard, Banknote, Tag
} from 'lucide-react'

type OrderType = 'delivery' | 'takeaway'

interface CheckoutData {
  name: string
  phone: string
  email: string
  orderType: OrderType
  address: string
  instructions: string
}

export function CheckoutForm() {
  const router = useRouter()
  const items = useCartStore(s => s.items)
  const subtotal = useCartStore(s => s.subtotal())
  const discount = useCartStore(s => s.discount())
  const total = useCartStore(s => s.total())
  const appliedPromotion = useCartStore(s => s.appliedPromotion)
  const businessId = useCartStore(s => s.businessId)
  const clear = useCartStore(s => s.clear)

  const [orderType, setOrderType] = useState<OrderType>('delivery')
  const [form, setForm] = useState<CheckoutData>({
    name: '', phone: '', email: '',
    orderType: 'delivery', address: '', instructions: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (items.length === 0) router.push('/order')
  }, [items.length, router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Por favor completa nombre y teléfono')
      return
    }
    if (orderType === 'delivery' && !form.address) {
      toast.error('Ingresa tu dirección de entrega')
      return
    }

    setLoading(true)
    trackEvent('begin_checkout', { total, items_count: items.length }, businessId ?? undefined)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId || 'providencia',
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
          deliveryAddress: orderType === 'delivery' ? form.address : null,
          orderType,
          items: items.map(i => ({
            menuItemId: i.menu_item.id,
            itemName: i.menu_item.name,
            quantity: i.quantity,
            unitPrice: i.menu_item.price,
            specialInstructions: i.special_instructions,
          })),
          subtotal,
          discountApplied: discount,
          finalPrice: total,
          promoId: appliedPromotion?.id ?? null,
        }),
      })

      if (!res.ok) throw new Error('Error al crear el pedido')

      const { orderId, preferenceUrl } = await res.json()

      // Redirect to MercadoPago checkout
      trackEvent('purchase', {
        order_id: orderId,
        total,
        items_count: items.length,
        order_type: orderType,
      }, businessId ?? undefined)

      if (preferenceUrl) {
        clear()
        window.location.href = preferenceUrl
      } else {
        clear()
        router.push(`/order/confirmation?order=${orderId}`)
      }
    } catch {
      toast.error('Error al procesar el pedido. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — customer info + delivery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order type selector */}
          <div className="bg-white border border-warm-200 p-6">
            <h2 className="text-warm-900 font-medium mb-4">¿Cómo lo recibirás?</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'delivery', label: 'Delivery a domicilio', icon: MapPin },
                { value: 'takeaway', label: 'Retiro en local', icon: Banknote },
              ] as const).map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOrderType(opt.value)}
                    className={`flex items-center gap-3 p-4 border-2 text-left transition-all ${
                      orderType === opt.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-warm-200 text-warm-600 hover:border-warm-300'
                    }`}
                  >
                    <Icon size={18} className={orderType === opt.value ? 'text-brand-600' : 'text-warm-400'} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white border border-warm-200 p-6 space-y-4">
            <h2 className="text-warm-900 font-medium">Tus datos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Nombre *</span>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                    className="w-full pl-9 pr-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Teléfono *</span>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+56 9 1234 5678"
                    className="w-full pl-9 pr-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </label>
              <label className="block md:col-span-2">
                <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Email (para confirmación)</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </label>
            </div>
          </div>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <div className="bg-white border border-warm-200 p-6 space-y-4">
              <h2 className="text-warm-900 font-medium">Dirección de entrega</h2>
              <label className="block">
                <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Dirección completa *</span>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3.5 text-warm-400" />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required={orderType === 'delivery'}
                    placeholder="Av. Providencia 1234, Piso 5, Dpto 502"
                    className="w-full pl-9 pr-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-warm-500 text-xs tracking-wider uppercase mb-1.5 block">Instrucciones adicionales</span>
                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  placeholder="Timbre no funciona, llamar al llegar..."
                  rows={2}
                  className="w-full px-4 py-3 border border-warm-200 text-warm-900 text-sm placeholder:text-warm-400 focus:outline-none focus:border-brand-400 transition-colors resize-none"
                />
              </label>
            </div>
          )}

          {/* Payment methods info */}
          <div className="bg-white border border-warm-200 p-6">
            <h2 className="text-warm-900 font-medium mb-4">Método de pago</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: Smartphone, label: 'Apple Pay' },
                { icon: Smartphone, label: 'Google Pay' },
                { icon: CreditCard, label: 'Tarjeta' },
              ].map(method => {
                const Icon = method.icon
                return (
                  <div key={method.label} className="flex flex-col items-center gap-2 p-3 bg-warm-50 border border-warm-200">
                    <Icon size={20} className="text-warm-600" />
                    <span className="text-warm-600 text-xs">{method.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-warm-400 text-xs flex items-center gap-1.5">
              <Lock size={11} />
              Al confirmar serás redirigido a MercadoPago para el pago seguro
            </p>
          </div>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white border border-warm-200 p-6">
            <h2 className="text-warm-900 font-medium mb-4">Resumen del pedido</h2>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {items.map(i => (
                <div key={i.menu_item.id} className="flex justify-between text-sm">
                  <span className="text-warm-700 flex-1 truncate pr-2">{i.quantity}× {i.menu_item.name}</span>
                  <span className="text-warm-600 shrink-0">{formatCLP(i.menu_item.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            {appliedPromotion && discount > 0 && (
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 px-3 py-2 mb-3">
                <Tag size={12} className="text-brand-600" />
                <span className="text-brand-700 text-xs flex-1">{appliedPromotion.title}</span>
                <span className="text-brand-700 text-sm font-medium">−{formatCLP(discount)}</span>
              </div>
            )}

            <div className="border-t border-warm-200 pt-3 space-y-1.5 mb-5">
              <div className="flex justify-between text-sm text-warm-500">
                <span>Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento</span>
                  <span>−{formatCLP(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-warm-900 pt-1 border-t border-warm-100">
                <span>Total</span>
                <span className="font-display text-2xl text-gold-600">{formatCLP(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-70 disabled:cursor-not-allowed text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors"
            >
              {loading ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  Confirmar y pagar
                  <ChevronRight size={14} />
                </>
              )}
            </button>
            <p className="text-warm-400 text-[11px] text-center mt-2">
              Pago seguro via MercadoPago
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}
