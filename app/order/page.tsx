import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

import { OrderFlow } from '@/components/order/OrderFlow'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pedir delivery',
  description: 'Pide tu comida india favorita a domicilio. Delivery rápido desde el local más cercano. Pago con Apple Pay, Google Pay y tarjetas.',
  alternates: { canonical: '/order' },
}

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string; item?: string }>
}) {
  const { local, item } = await searchParams

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <OrderFlow initialLocal={local} initialItem={item} />
      </main>
      <Footer />
    </>
  )
}
