import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Crown, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/circle/LoginForm'

export const metadata: Metadata = {
  title: 'Rishtedar Circle — Acceso',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-warm-950 flex items-center justify-center relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, #c9952a14 0%, transparent 70%)' }}
        />
        {/* Gold top line */}
        <div className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-700/30 to-transparent" />

        <div className="relative w-full max-w-md mx-6">
          {/* Back to Circle */}
          <Link
            href="/circle"
            className="inline-flex items-center gap-1.5 text-warm-600 hover:text-warm-400 transition-colors text-xs tracking-wider uppercase mb-8"
          >
            <ArrowLeft size={12} />
            Volver al Circle
          </Link>

          <div className="bg-warm-900/60 border border-warm-800 p-8 sm:p-10">
            {/* Gold accent top */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold-600/50 to-transparent mb-8" />

            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 bg-warm-800 border border-warm-700 flex items-center justify-center shrink-0">
                <Crown size={16} className="text-gold-500" />
              </div>
              <div>
                <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-0.5">Rishtedar</p>
                <h1 className="font-display text-3xl italic text-ivory leading-tight">Circle</h1>
                <p className="text-warm-500 text-xs mt-1">Accede para ver tus puntos, reservas y beneficios.</p>
              </div>
            </div>

            {/* Form */}
            <LoginForm />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-warm-800" />
              <span className="text-warm-700 text-xs">o</span>
              <div className="flex-1 h-px bg-warm-800" />
            </div>

            {/* Register CTA */}
            <div className="text-center">
              <p className="text-warm-600 text-sm mb-3">¿Aún no eres miembro?</p>
              <Link
                href="/circle"
                className="inline-flex items-center gap-2 border border-gold-700/50 text-gold-500 hover:border-gold-600 hover:text-gold-400 px-6 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
              >
                Unirme al Circle gratis
              </Link>
            </div>
          </div>

          <p className="text-warm-700 text-[10px] text-center mt-6">
            ¿Problemas para ingresar?{' '}
            <a href="mailto:contacto@rishtedar.cl" className="hover:text-warm-500 transition-colors underline">
              Contáctanos
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
