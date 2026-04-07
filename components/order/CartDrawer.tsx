'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, Tag } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { formatCLP } from '@/lib/utils'
import Link from 'next/link'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore(s => s.items)
  const subtotal = useCartStore(s => s.subtotal())
  const discount = useCartStore(s => s.discount())
  const total = useCartStore(s => s.total())
  const appliedPromotion = useCartStore(s => s.appliedPromotion)
  const updateQty = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-brand-700" />
                <h2 className="font-medium text-warm-900">Tu pedido</h2>
                {items.length > 0 && (
                  <span className="bg-brand-700 text-ivory text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 text-warm-400 hover:text-warm-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag size={40} className="text-warm-200 mb-4" />
                  <p className="font-display text-xl italic text-warm-400">Tu carrito está vacío</p>
                  <p className="text-warm-400 text-sm mt-2 mb-6">Explora nuestra carta y elige tus platos favoritos</p>
                  <Link
                    href="/menu"
                    onClick={onClose}
                    className="text-brand-700 text-sm underline underline-offset-4"
                  >
                    Ver menú →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.menu_item.id} className="flex gap-3 py-3 border-b border-warm-100 last:border-0">
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-warm-900 text-sm font-medium truncate">{item.menu_item.name}</p>
                        {item.special_instructions && (
                          <p className="text-warm-400 text-xs mt-0.5 truncate">{item.special_instructions}</p>
                        )}
                        <p className="text-gold-600 text-sm mt-1">{formatCLP(item.menu_item.price)}</p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.menu_item.id, item.quantity - 1)}
                          className="w-7 h-7 border border-warm-200 flex items-center justify-center hover:border-brand-300 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.menu_item.id, item.quantity + 1)}
                          className="w-7 h-7 border border-warm-200 flex items-center justify-center hover:border-brand-300 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(item.menu_item.id)}
                          className="ml-1 p-1 text-warm-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-warm-800">
                          {formatCLP(item.menu_item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — totals + checkout */}
            {items.length > 0 && (
              <div className="border-t border-warm-200 px-6 py-5 space-y-3">
                {/* Promotion applied */}
                {appliedPromotion && discount > 0 && (
                  <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 px-3 py-2">
                    <Tag size={13} className="text-brand-600" />
                    <span className="text-brand-700 text-sm flex-1">{appliedPromotion.title}</span>
                    <span className="text-brand-700 text-sm font-medium">−{formatCLP(discount)}</span>
                  </div>
                )}

                {/* Subtotal row */}
                <div className="flex justify-between text-sm text-warm-600">
                  <span>Subtotal</span>
                  <span>{formatCLP(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Descuento</span>
                    <span>−{formatCLP(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-warm-900 pt-1 border-t border-warm-200">
                  <span>Total</span>
                  <span className="font-display text-xl text-gold-600">{formatCLP(total)}</span>
                </div>

                <Link
                  href="/order/checkout"
                  onClick={onClose}
                  className="block w-full text-center bg-brand-700 hover:bg-brand-800 text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors mt-2"
                >
                  Ir al checkout →
                </Link>
                <p className="text-warm-400 text-xs text-center">
                  Pago seguro · Apple Pay · Google Pay · Tarjetas
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
