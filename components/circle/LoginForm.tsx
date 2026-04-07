'use client'

import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <input
        type="email"
        placeholder="tu@correo.com"
        className="w-full bg-warm-900 border border-warm-700 text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors"
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="w-full bg-warm-900 border border-warm-700 text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors"
      />
      <button
        onClick={() => router.push('/circle/dashboard')}
        className="w-full bg-gold-600 hover:bg-gold-500 text-warm-950 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
      >
        Ingresar
      </button>
    </div>
  )
}
