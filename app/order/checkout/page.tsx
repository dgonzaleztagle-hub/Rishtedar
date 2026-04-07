import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CheckoutForm } from '@/components/order/CheckoutForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Completa tu pedido. Pago seguro con Apple Pay, Google Pay y tarjetas.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <div className="mb-8">
            <h1 className="font-display text-4xl italic text-warm-950">Checkout</h1>
            <p className="text-warm-500 text-sm mt-1">Pago seguro y encriptado</p>
          </div>
          <CheckoutForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
