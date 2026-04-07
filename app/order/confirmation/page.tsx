import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { OrderConfirmation } from '@/components/order/OrderConfirmation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pedido confirmado',
  robots: { index: false, follow: false },
}

export default function ConfirmationPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <OrderConfirmation />
      </main>
      <Footer />
    </>
  )
}
