'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Phone, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

function ConfirmationContent() {
  const params = useSearchParams()
  const orderId = params.get('order')
  const status = params.get('status')

  const isPending = status === 'pending'

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center mx-auto mb-6">
          {isPending ? (
            <Clock size={32} className="text-brand-600" />
          ) : (
            <CheckCircle2 size={32} className="text-brand-600" />
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl italic text-warm-950 mb-3">
          {isPending ? '¡Pedido recibido!' : '¡Pedido confirmado!'}
        </h1>
        <p className="text-warm-500 mb-8">
          {isPending
            ? 'Tu pago está siendo procesado. Te confirmaremos cuando esté listo.'
            : 'Tu pedido ha sido recibido y está en preparación.'}
        </p>

        {/* Timeline */}
        <div className="bg-white border border-warm-200 p-6 text-left mb-8">
          <div className="space-y-4">
            {[
              { icon: CheckCircle2, label: 'Pedido recibido', active: true },
              { icon: UtensilsCrossed, label: 'En preparación', active: !isPending },
              { icon: Clock, label: 'En camino', active: false },
              { icon: CheckCircle2, label: 'Entregado', active: false },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={step.active ? 'text-brand-600' : 'text-warm-300'}
                  />
                  <span className={`text-sm ${step.active ? 'text-warm-800 font-medium' : 'text-warm-400'}`}>
                    {step.label}
                  </span>
                  {step.active && i === 0 && (
                    <span className="ml-auto text-xs bg-brand-50 text-brand-600 border border-brand-200 px-2 py-0.5">
                      Ahora
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Estimated time */}
        <div className="flex items-center justify-center gap-2 bg-gold-50 border border-gold-200 px-6 py-4 mb-8">
          <Clock size={16} className="text-gold-600" />
          <p className="text-warm-800 text-sm">
            Tiempo estimado de entrega: <span className="font-medium text-warm-900">40–50 minutos</span>
          </p>
        </div>

        {/* Contact */}
        <p className="text-warm-400 text-sm mb-6 flex items-center justify-center gap-2">
          <Phone size={13} />
          ¿Tienes alguna consulta? Llámanos a tu local más cercano
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-warm-300 text-warm-700 hover:border-warm-400 px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center bg-brand-700 hover:bg-brand-800 text-ivory px-8 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
          >
            Ver menú
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export function OrderConfirmation() {
  return (
    <Suspense fallback={<div className="container mx-auto px-6 py-16 text-center text-warm-400">Cargando...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
