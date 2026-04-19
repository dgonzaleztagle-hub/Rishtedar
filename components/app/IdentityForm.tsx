'use client'

interface IdentityFormValues {
  name:          string
  phone:         string
  favoriteLocal: string
}

interface IdentityFormProps {
  form:      IdentityFormValues
  onChange:  (values: IdentityFormValues) => void
  onSubmit:  () => void
  error?:    string | null
  loading?:  boolean
}

export function IdentityForm({ form, onChange, onSubmit, error, loading }: IdentityFormProps) {
  const set = (key: keyof IdentityFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-1">Rishtedar Circle</p>
        <h2 className="font-display text-4xl italic text-ivory mb-6">Únete gratis</h2>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Tu nombre"
            value={form.name}
            onChange={set('name')}
            disabled={loading}
            className="w-full bg-warm-900 border border-warm-700 text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors disabled:opacity-50"
          />
          <div>
            <input
              type="tel"
              placeholder="+56 9 XXXX XXXX"
              value={form.phone}
              onChange={set('phone')}
              disabled={loading}
              className={`w-full bg-warm-900 border text-ivory text-sm px-4 py-3 placeholder:text-warm-600 focus:outline-none transition-colors disabled:opacity-50 ${
                error ? 'border-red-500 focus:border-red-400' : 'border-warm-700 focus:border-gold-600'
              }`}
            />
            {error && (
              <p className="text-red-400 text-[11px] mt-1.5 px-1">{error}</p>
            )}
          </div>
          <select
            value={form.favoriteLocal}
            onChange={set('favoriteLocal')}
            disabled={loading}
            className="w-full bg-warm-900 border border-warm-700 text-warm-400 text-sm px-4 py-3 focus:outline-none focus:border-gold-600 transition-colors disabled:opacity-50"
          >
            <option value="">Local favorito</option>
            <option value="providencia">Providencia</option>
            <option value="vitacura">Vitacura</option>
            <option value="la-reina">La Reina</option>
            <option value="la-dehesa">La Dehesa</option>
          </select>
        </div>

        <button
          onClick={onSubmit}
          disabled={!form.name || !form.phone || loading}
          className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-40 text-warm-950 py-4 text-xs tracking-widest uppercase font-medium transition-colors"
        >
          {loading ? 'Verificando…' : 'Activar Circle →'}
        </button>
        <p className="text-warm-600 text-[10px] text-center mt-3">
          Gratis · Solo usamos tus datos para acumular puntos
        </p>
      </div>
    </div>
  )
}
