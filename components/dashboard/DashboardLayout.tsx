'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarCheck, BarChart3, Tag, UtensilsCrossed,
  Menu, X, ChevronRight, Truck, MapPin, LayoutGrid, Clock,
  QrCode, Gift, Bell, BellOff, ChevronDown, Users, LogOut,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useStaffSession } from '@/hooks/useStaffSession'
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts'
import { AlertToastStack } from './AlertToast'
import { GlobalOverview } from './GlobalOverview'

// ─── Branch metadata (display info only — no auth) ────────────────────────────

const BRANCH_META: Record<string, { name: string; address: string; accent: string }> = {
  '*':           { name: 'Vista Global',  address: 'Todas las sucursales', accent: '#c9952a' },
  admin:         { name: 'Admin Global',  address: 'Todas las sucursales', accent: '#c9952a' },
  providencia:   { name: 'Providencia',   address: 'Av. Providencia 2124', accent: '#7c5cbf' },
  vitacura:      { name: 'Vitacura',      address: 'Av. Vitacura 3600',    accent: '#10b981' },
  'la-reina':    { name: 'La Reina',      address: 'Av. Ossa 100',         accent: '#3b82f6' },
  'la-dehesa':   { name: 'La Dehesa',     address: 'El Rodeo 12840',       accent: '#f43f5e' },
}

const BRANCH_SWITCHER_OPTIONS = [
  { id: '*',           label: 'Vista Global',  accent: '#c9952a' },
  { id: 'providencia', label: 'Providencia',   accent: '#7c5cbf' },
  { id: 'vitacura',    label: 'Vitacura',      accent: '#10b981' },
  { id: 'la-reina',    label: 'La Reina',      accent: '#3b82f6' },
  { id: 'la-dehesa',   label: 'La Dehesa',     accent: '#f43f5e' },
]

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Overview'        },
  { href: '/dashboard/delivery',     icon: Truck,           label: 'Delivery'        },
  { href: '/dashboard/reservations', icon: CalendarCheck,   label: 'Reservas'        },
  { href: '/dashboard/analytics',    icon: BarChart3,       label: 'Analytics'       },
  { href: '/dashboard/promotions',   icon: Tag,             label: 'Promociones'     },
  { href: '/dashboard/menu',         icon: UtensilsCrossed, label: 'Menú'            },
  { href: '/dashboard/horarios',     icon: Clock,           label: 'Horarios'        },
  { href: '/dashboard/scanner',      icon: QrCode,          label: 'Escáner Circle'  },
  { href: '/dashboard/loyalty',      icon: Gift,            label: 'Loyalty & Premios'},
]

// ─── BranchSwitcher ───────────────────────────────────────────────────────────

function BranchSwitcher({
  activeBranch,
  onSelect,
}: {
  activeBranch: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = BRANCH_META[activeBranch] ?? BRANCH_META['*']

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-2 py-2 bg-warm-900 hover:bg-warm-800 transition-colors"
      >
        <LayoutGrid size={13} className="shrink-0" style={{ color: current.accent }} />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-medium truncate" style={{ color: current.accent }}>
            {current.name}
          </p>
          <p className="text-[10px] text-warm-300 truncate">
            {activeBranch === '*' ? 'Vista consolidada' : 'Gerente de local'}
          </p>
        </div>
        <ChevronDown
          size={12}
          className={cn('text-warm-500 shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-warm-900 border border-warm-700 shadow-xl">
          {BRANCH_SWITCHER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt.id); setOpen(false) }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left',
                activeBranch === opt.id
                  ? 'bg-warm-800 text-ivory'
                  : 'text-warm-200 hover:bg-warm-800 hover:text-white'
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: opt.accent }}
              />
              {opt.label}
              {activeBranch === opt.id && (
                <span className="ml-auto text-[9px] text-warm-400">activo</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname()
  const router      = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { profile, activeBranch, setActiveBranch, isLoading, signOut } = useStaffSession()

  const { alerts, dismiss, soundEnabled, toggleSound } = useRealtimeAlerts(
    activeBranch === '*' ? null : activeBranch
  )

  // Redirigir si no tiene sesión (el middleware debería atraparlo antes, pero
  // esto actúa como safety net en client-side)
  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace('/dashboard/login')
    }
  }, [isLoading, profile, router])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isSuperAdmin    = profile.role === 'super_admin'
  const isGlobalView    = isSuperAdmin && activeBranch === '*'
  const branchMeta      = BRANCH_META[activeBranch] ?? BRANCH_META['*']

  async function handleSignOut() {
    await signOut()
    router.push('/dashboard/login')
  }

  return (
    <div className="min-h-screen bg-warm-50 flex">

      {/* ── Sidebar ── */}
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

        {/* Branch badge / switcher */}
        <div className="px-4 py-3 border-b border-warm-800">
          {isSuperAdmin ? (
            <BranchSwitcher activeBranch={activeBranch} onSelect={setActiveBranch} />
          ) : (
            /* Manager: solo muestra su local, sin dropdown */
            <div className="flex items-center gap-2 px-2 py-2 bg-warm-900">
              <MapPin size={13} className="text-warm-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-ivory">{branchMeta.name}</p>
                <p className="text-[10px] text-warm-300 truncate">Gerente de local</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* En vista global, los nav items van a las vistas de cada local */}
          {isGlobalView ? null : NAV.map(item => {
            const Icon   = item.icon
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
                    : 'text-warm-200 hover:text-white hover:bg-warm-800'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}

          {/* En vista global: sí mostramos el nav pero como "ver local" */}
          {isGlobalView && (
            <p className="text-warm-400 text-[10px] px-3 py-2 uppercase tracking-wider">
              Selecciona un local para gestionar
            </p>
          )}
        </nav>

        {/* Admin nav item — solo super_admin */}
        {isSuperAdmin && (
          <div className="px-3 pb-2 border-t border-warm-800 pt-2">
            <Link
              href="/dashboard/admin/users"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-gold-900/40 text-gold-400'
                  : 'text-warm-300 hover:text-white hover:bg-warm-800'
              )}
            >
              <Users size={16} />
              Admin
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500" />
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-4 border-t border-warm-800 space-y-1">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-warm-200 text-[10px]">{profile.display_name}</p>
            <p className="text-warm-400 text-[10px]">
              {profile.role === 'super_admin' ? 'Super Admin' : 'Gerente'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-warm-300 hover:text-red-400 text-xs px-2 py-2 hover:bg-warm-900 transition-colors"
          >
            <LogOut size={12} />
            Cerrar sesión
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-warm-400 hover:text-warm-200 text-xs px-2 py-2 hover:bg-warm-900 transition-colors"
          >
            <ChevronRight size={12} className="rotate-180" />
            Volver al sitio
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0 overflow-x-hidden">

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
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-1 font-medium tracking-wider uppercase"
              style={{
                color:           branchMeta.accent,
                backgroundColor: `${branchMeta.accent}12`,
              }}
            >
              {isGlobalView
                ? <LayoutGrid size={9} />
                : <MapPin size={9} />
              }
              {branchMeta.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isGlobalView && (
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Silenciar alertas' : 'Activar alertas de sonido'}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 border transition-colors ${
                  soundEnabled
                    ? 'border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100'
                    : 'border-warm-200 text-warm-400 hover:text-warm-600 hover:border-warm-300'
                }`}
              >
                {soundEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                {soundEnabled ? 'Sonido On' : 'Sonido Off'}
              </button>
            )}
            {!isGlobalView && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {isGlobalView
            ? <GlobalOverview onSelectBranch={setActiveBranch} />
            : children
          }
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Realtime alert toasts */}
      {!isGlobalView && <AlertToastStack alerts={alerts} onDismiss={dismiss} />}
    </div>
  )
}
