import Link from 'next/link'

export function LoginForm() {
  return (
    <div className="space-y-3">
      <Link
        href="/app"
        className="block w-full text-center bg-gold-600 hover:bg-gold-500 text-warm-950 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
      >
        Acceder a mi Circle →
      </Link>
      <p className="text-warm-600 text-[10px] text-center">
        El acceso es por teléfono — no necesitas contraseña.
      </p>
    </div>
  )
}
