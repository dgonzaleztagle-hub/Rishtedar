'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Menu, X, ShoppingBag, User, Search,
  ChevronDown, Phone, Clock, UtensilsCrossed
} from 'lucide-react'
import { LOCATIONS } from '@/lib/locations'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  {
    label: 'Locales',
    href: '/locales',
    dropdown: {
      columns: [
        {
          title: 'Santiago',
          items: LOCATIONS.filter(l => l.country === 'CL').map(l => ({
            label: l.name.replace('Rishtedar ', ''),
            href: `/locales/${l.slug}`,
            sub: l.address,
          })),
        },
        {
          title: 'Internacional',
          items: LOCATIONS.filter(l => l.country === 'US').map(l => ({
            label: l.name.replace('Rishtedar ', ''),
            href: `/locales/${l.slug}`,
            sub: l.address,
          })),
        },
      ],
    },
  },
  {
    label: 'Menú',
    href: '/menu',
    dropdown: {
      columns: [
        {
          title: 'Categorías',
          items: [
            { label: 'Entradas', href: '/menu?cat=entradas' },
            { label: 'Platos principales', href: '/menu?cat=principales' },
            { label: 'Tandoor', href: '/menu?cat=tandoor' },
            { label: 'Biryanis', href: '/menu?cat=biryani' },
          ],
        },
        {
          title: 'Especiales',
          items: [
            { label: 'Vegetariano', href: '/menu?tag=vegetarian' },
            { label: 'Sin gluten', href: '/menu?tag=gluten-free' },
            { label: 'Menú ejecutivo', href: '/menu?cat=ejecutivo' },
            { label: 'Postres', href: '/menu?cat=postres' },
          ],
        },
      ],
    },
  },
  {
    label: 'Experiencias',
    href: '/eventos',
    dropdown: {
      columns: [
        {
          title: 'Eventos',
          items: [
            { label: 'Cenas especiales', href: '/eventos#cenas' },
            { label: 'Catering', href: '/eventos#catering' },
            { label: 'Grupos', href: '/eventos#grupos' },
            { label: 'Cumpleaños', href: '/eventos#cumpleanos' },
          ],
        },
      ],
    },
  },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(label)
  }

  function closeDropdown() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120)
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled || !isHome
            ? 'bg-warm-950/97 backdrop-blur-md shadow-lg shadow-black/20'
            : 'bg-gradient-to-b from-black/60 to-transparent'
        )}
      >
        {/* Top bar — contact info (hidden on mobile) */}
        <div
          className={cn(
            'hidden md:block border-b border-gold-700/20 transition-all duration-500 overflow-hidden',
            scrolled || !isHome ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
          )}
        >
          <div className="container mx-auto px-6 flex items-center justify-between py-1.5">
            <div className="flex items-center gap-6">
              {LOCATIONS.slice(0, 2).map(loc => (
                <a
                  key={loc.id}
                  href={`tel:${loc.phone}`}
                  className="flex items-center gap-1.5 text-warm-300 hover:text-gold-400 transition-colors text-xs"
                >
                  <Phone size={11} />
                  <span>{loc.name.replace('Rishtedar ', '')}: {loc.phone}</span>
                </a>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-warm-300 text-xs">
              <Clock size={11} />
              <span>Lun–Jue 12:00–23:00 · Vie–Sáb 12:30–23:30</span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center">
                <UtensilsCrossed size={14} className="text-gold-400" />
              </div>
              <span className="font-display text-2xl md:text-3xl text-ivory tracking-tight italic">
                Rishtedar
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8" ref={dropdownRef}>
              {NAV_ITEMS.map(item => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={closeDropdown}
                >
                  <button className="flex items-center gap-1 text-warm-200 hover:text-gold-400 transition-colors text-xs tracking-widest uppercase font-medium py-2">
                    {item.label}
                    {item.dropdown && (
                      <ChevronDown
                        size={12}
                        className={cn(
                          'transition-transform duration-200',
                          activeDropdown === item.label && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.dropdown && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-warm-950 border border-warm-800 shadow-2xl min-w-[320px] p-6"
                        onMouseEnter={() => openDropdown(item.label)}
                        onMouseLeave={closeDropdown}
                      >
                        <div
                          className={cn(
                            'grid gap-6',
                            item.dropdown.columns.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                          )}
                        >
                          {item.dropdown.columns.map(col => (
                            <div key={col.title}>
                              <p className="text-gold-600 text-[10px] tracking-widest uppercase font-medium mb-3 pb-2 border-b border-warm-800">
                                {col.title}
                              </p>
                              <ul className="space-y-1">
                                {col.items.map(i => (
                                  <li key={i.label}>
                                    <Link
                                      href={i.href}
                                      className="group flex flex-col py-1.5 hover:text-gold-400 transition-colors"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      <span className="text-warm-200 group-hover:text-gold-400 text-sm transition-colors">
                                        {i.label}
                                      </span>
                                      {'sub' in i && i.sub && (
                                        <span className="text-warm-500 text-xs mt-0.5">{i.sub}</span>
                                      )}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="hidden md:flex p-2 text-warm-300 hover:text-gold-400 transition-colors"
                aria-label="Buscar"
              >
                <Search size={18} />
              </Link>
              <Link
                href="/login"
                className="hidden md:flex p-2 text-warm-300 hover:text-gold-400 transition-colors"
                aria-label="Mi cuenta"
              >
                <User size={18} />
              </Link>
              <Link
                href="/order"
                className="hidden md:flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory text-xs tracking-widest uppercase font-medium px-5 py-2.5 transition-colors"
              >
                <ShoppingBag size={14} />
                Pedir ahora
              </Link>
              <Link
                href="/reservar"
                className="hidden md:flex items-center gap-2 border border-gold-600 text-gold-400 hover:bg-gold-600 hover:text-warm-950 text-xs tracking-widest uppercase font-medium px-5 py-2.5 transition-all duration-300"
              >
                Reservar
              </Link>
              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 text-warm-200 hover:text-gold-400 transition-colors"
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Menú"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-warm-950 flex flex-col overflow-y-auto"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-warm-800">
              <span className="font-display text-2xl text-ivory italic">Rishtedar</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-warm-400"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 px-6 py-8 space-y-1">
              {NAV_ITEMS.map(item => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-4 border-b border-warm-800 text-warm-200 hover:text-gold-400 transition-colors"
                  >
                    <span className="font-display text-2xl italic">{item.label}</span>
                    <ChevronDown size={16} className="text-warm-600" />
                  </Link>
                  {item.dropdown && (
                    <div className="pl-4 py-2 space-y-1">
                      {item.dropdown.columns.flatMap(col =>
                        col.items.map(i => (
                          <Link
                            key={i.label}
                            href={i.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 text-warm-400 hover:text-gold-400 transition-colors text-sm"
                          >
                            {i.label}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="px-6 pb-10 space-y-3">
              <Link
                href="/order"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 bg-brand-700 text-ivory w-full py-4 text-xs tracking-widest uppercase font-medium hover:bg-brand-800 transition-colors"
              >
                <ShoppingBag size={15} />
                Pedir delivery
              </Link>
              <Link
                href="/reservar"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center border border-gold-600 text-gold-400 w-full py-4 text-xs tracking-widest uppercase font-medium hover:bg-gold-600 hover:text-warm-950 transition-all"
              >
                Reservar mesa
              </Link>
              <div className="pt-4 flex items-center gap-4">
                <Link href="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-warm-400 hover:text-warm-200 transition-colors text-sm">
                  <Search size={16} /> Buscar
                </Link>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-warm-400 hover:text-warm-200 transition-colors text-sm">
                  <User size={16} /> Mi cuenta
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
