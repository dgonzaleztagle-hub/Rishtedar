import Link from 'next/link'
import { Share2, ExternalLink, UtensilsCrossed, MapPin, Phone, Mail } from 'lucide-react'
import { LOCATIONS } from '@/lib/locations'

export function Footer() {
  const santiago = LOCATIONS.filter(l => l.country === 'CL')
  const miami = LOCATIONS.filter(l => l.country === 'US')

  return (
    <footer className="bg-warm-950 text-warm-300 border-t border-warm-800">
      {/* Newsletter strip */}
      <div className="border-b border-warm-800 bg-brand-900/30">
        <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl italic text-ivory">Únete al círculo Rishtedar</p>
            <p className="text-warm-400 text-sm mt-1">Recibe promociones exclusivas, nuevos platos y eventos especiales.</p>
          </div>
          <form action="/api/newsletter/subscribe" method="POST" className="flex gap-0 w-full max-w-md">
            <input
              type="email"
              name="email"
              placeholder="tu@correo.com"
              required
              className="flex-1 bg-warm-900 border border-warm-700 border-r-0 px-4 py-3 text-warm-100 text-sm placeholder:text-warm-600 focus:outline-none focus:border-gold-600 transition-colors"
            />
            <button
              type="submit"
              className="bg-brand-700 hover:bg-brand-600 text-ivory px-6 py-3 text-xs tracking-widest uppercase font-medium transition-colors whitespace-nowrap"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center">
              <UtensilsCrossed size={12} className="text-gold-400" />
            </div>
            <span className="font-display text-xl italic text-ivory">Rishtedar</span>
          </Link>
          <p className="text-sm text-warm-400 leading-relaxed mb-6">
            Cocina india auténtica, presentada con la elegancia y calidez que merece.
            Una experiencia pensada para reunir.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/rishtedar"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 border border-warm-700 flex items-center justify-center hover:border-gold-600 hover:text-gold-400 transition-all"
              aria-label="Instagram"
            >
              <Share2 size={14} />
            </a>
            <a
              href="https://facebook.com/rishtedar"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 border border-warm-700 flex items-center justify-center hover:border-gold-600 hover:text-gold-400 transition-all"
              aria-label="Facebook"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Locales Santiago */}
        <div>
          <p className="text-gold-600 text-[10px] tracking-widest uppercase font-medium mb-5">Santiago</p>
          <ul className="space-y-4">
            {santiago.map(loc => (
              <li key={loc.id}>
                <Link
                  href={`/locales/${loc.slug}`}
                  className="group"
                >
                  <p className="text-warm-200 text-sm group-hover:text-gold-400 transition-colors">
                    {loc.name.replace('Rishtedar ', '')}
                  </p>
                  <p className="text-warm-500 text-xs mt-0.5 flex items-start gap-1">
                    <MapPin size={10} className="mt-0.5 shrink-0" />
                    {loc.address}
                  </p>
                  <p className="text-warm-500 text-xs mt-0.5 flex items-center gap-1">
                    <Phone size={10} className="shrink-0" />
                    {loc.phone}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-gold-600 text-[10px] tracking-widest uppercase font-medium mb-4">Miami</p>
            {miami.map(loc => (
              <div key={loc.id}>
                <p className="text-warm-200 text-sm">{loc.name.replace('Rishtedar ', '')}</p>
                <p className="text-warm-500 text-xs mt-0.5 flex items-start gap-1">
                  <MapPin size={10} className="mt-0.5" />
                  {loc.address}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div>
          <p className="text-gold-600 text-[10px] tracking-widest uppercase font-medium mb-5">Navegar</p>
          <ul className="space-y-2.5">
            {[
              { label: 'Nuestro menú', href: '/menu' },
              { label: 'Reservar mesa', href: '/reservar' },
              { label: 'Pedir delivery', href: '/order' },
              { label: 'Experiencias y eventos', href: '/eventos' },
              { label: 'Nuestros locales', href: '/locales' },
              { label: 'Búsqueda', href: '/search' },
            ].map(item => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-warm-400 hover:text-gold-400 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <p className="text-gold-600 text-[10px] tracking-widest uppercase font-medium mb-5">Contacto</p>
          <ul className="space-y-3">
            <li>
              <a href="mailto:contacto@rishtedar.com" className="flex items-center gap-2 text-warm-400 hover:text-gold-400 text-sm transition-colors">
                <Mail size={13} />
                contacto@rishtedar.com
              </a>
            </li>
            <li className="text-warm-400 text-sm">
              <p className="text-warm-500 text-xs uppercase tracking-wider mb-1">Reservas</p>
              <Link href="/reservar" className="hover:text-gold-400 transition-colors">
                Reservar en línea →
              </Link>
            </li>
            <li className="text-warm-400 text-sm">
              <p className="text-warm-500 text-xs uppercase tracking-wider mb-1">Delivery</p>
              <Link href="/order" className="hover:text-gold-400 transition-colors">
                Pedir ahora →
              </Link>
            </li>
            <li className="text-warm-400 text-sm">
              <p className="text-warm-500 text-xs uppercase tracking-wider mb-1">Catering & Eventos</p>
              <a href="mailto:eventos@rishtedar.com" className="hover:text-gold-400 transition-colors">
                eventos@rishtedar.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-warm-800">
        <div className="container mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-warm-600 text-xs">
            © {new Date().getFullYear()} Rishtedar. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'Política de privacidad', href: '/privacidad' },
              { label: 'Términos', href: '/terminos' },
              { label: 'Alérgenos', href: '/alergenos' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="text-warm-600 hover:text-warm-400 text-xs transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
