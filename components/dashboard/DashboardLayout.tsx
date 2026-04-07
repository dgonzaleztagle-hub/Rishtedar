'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, CalendarCheck, BarChart3,
  Tag, UtensilsCrossed, Menu, X, ChevronRight, Truck, MapPin, LayoutGrid
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BranchOption } from './BranchLogin'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'Órdenes' },
  { href: '/dashboard/delivery', icon: Truck, label: 'Delivery' },
  { href: '/dashboard/reservations', icon: CalendarCheck, label: 'Reservas' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/promotions', icon: Tag, label: 'Promociones' },
  { href: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menú' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('rishtedar_branch')
    if (!stored) {
      router.replace('/dashboard/login')
      return
    }
    setBranch(JSON.parse(stored))
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isAdmin = branch?.id === 'admin'

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-warm-950 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-warm-800">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-gold-500" />
            <span className="font-display text-lg italic text-ivory">Rishtedar</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-warm-500 hover:text-warm-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Branch badge */}
        <div className="px-4 py-3 border-b border-warm-800">
          <div className="flex items-center gap-2 px-2 py-2 bg-warm-900 rounded">
            {isAdmin
              ? <LayoutGrid size={13} className="text-gold-500 shrink-0" />
              : <MapPin size={13} className="text-warm-400 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${isAdmin ? 'text-gold-500' : 'text-ivory'}`}>
                {branch?.name}
              </p>
              <p className="text-[10px] text-warm-500 truncate">
                {isAdmin ? 'Vista consolidada' : 'Gerente de local'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-brand-800 text-ivory'
                    : 'text-warm-400 hover:text-warm-200 hover:bg-warm-800'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-warm-800 space-y-1">
          <button
            onClick={() => {
              localStorage.removeItem('rishtedar_branch')
              router.push('/dashboard/login')
            }}
            className="w-full flex items-center gap-2 text-warm-500 hover:text-warm-300 text-xs px-2 py-2 hover:bg-warm-900 transition-colors"
          >
            <ChevronRight size={12} className="rotate-180" />
            Cambiar sucursal
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-warm-600 hover:text-warm-400 text-xs px-2 py-2 hover:bg-warm-900 transition-colors"
          >
            <ChevronRight size={12} className="rotate-180" />
            Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-warm-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-warm-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <p className="text-warm-800 font-medium text-sm">Panel de gestión</p>
            {branch && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-1 font-medium tracking-wider uppercase"
                style={{
                  color: branch.accent,
                  backgroundColor: `${branch.accent}12`,
                }}
              >
                {isAdmin ? <LayoutGrid size={9} /> : <MapPin size={9} />}
                {branch.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
