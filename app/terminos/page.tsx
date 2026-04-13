import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Rishtedar',
  robots: { index: false, follow: false },
}

export default function TerminosPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-ivory">
        <div className="container mx-auto px-6 py-16 max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-warm-500 hover:text-brand-700 text-sm mb-8 transition-colors"
          >
            ← Volver al inicio
          </Link>
          <p className="text-brand-600 text-[10px] tracking-[0.3em] uppercase mb-3">Legal</p>
          <h1 className="font-display text-4xl sm:text-5xl italic text-warm-950 mb-8">
            Términos y Condiciones
          </h1>
          <div className="text-warm-600 text-sm leading-relaxed space-y-4">
            <p>
              Al utilizar los servicios de Rishtedar — incluyendo nuestro sitio web, programa
              Circle y servicio de delivery — aceptas los presentes términos y condiciones.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Programa Circle</h2>
            <p>
              El programa de fidelidad Rishtedar Circle es gratuito y está disponible para
              clientes mayores de 18 años. Los puntos acumulados no tienen valor monetario y
              no son transferibles. Rishtedar se reserva el derecho de modificar o discontinuar
              el programa con aviso previo.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Pedidos y Delivery</h2>
            <p>
              Los pedidos realizados a través de nuestra plataforma están sujetos a disponibilidad
              y horarios de operación de cada local. Los tiempos de entrega son estimados y pueden
              variar según condiciones externas.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Contacto</h2>
            <p>
              Para consultas, escríbenos a{' '}
              <a href="mailto:hola@rishtedar.cl" className="text-brand-700 hover:text-brand-900">
                hola@rishtedar.cl
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
