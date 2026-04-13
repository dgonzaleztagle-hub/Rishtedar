import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Rishtedar',
  robots: { index: false, follow: false },
}

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <div className="prose prose-warm max-w-none text-warm-600 text-sm leading-relaxed space-y-4">
            <p>
              En Rishtedar nos importa tu privacidad. Esta política describe cómo recopilamos,
              usamos y protegemos tu información personal.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Datos que recopilamos</h2>
            <p>
              Recopilamos únicamente la información necesaria para prestarte nuestros servicios:
              nombre, número de teléfono y local favorito para el programa Circle;
              dirección de entrega y datos de pago para pedidos de delivery.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Uso de la información</h2>
            <p>
              Usamos tu información exclusivamente para gestionar tu cuenta Circle, procesar pedidos
              y enviarte comunicaciones relacionadas con tu experiencia en Rishtedar.
              No vendemos ni compartimos tus datos con terceros con fines comerciales.
            </p>
            <h2 className="font-display text-2xl italic text-warm-900 mt-8 mb-3">Contacto</h2>
            <p>
              Para consultas sobre privacidad, escríbenos a{' '}
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
