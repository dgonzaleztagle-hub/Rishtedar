'use client'

import { useRouter } from 'next/navigation'
import { UtensilsCrossed, LayoutDashboard, MapPin } from 'lucide-react'

export interface BranchOption {
  id: string
  name: string
  address: string
  role: 'admin' | 'manager'
  color: string
  accent: string
}

const BRANCHES: BranchOption[] = [
  {
    id: 'admin',
    name: 'Admin Global',
    address: 'Todas las sucursales · Vista consolidada',
    role: 'admin',
    color: 'bg-warm-950',
    accent: '#c9952a',
  },
  {
    id: 'providencia',
    name: 'Providencia',
    address: 'Av. Providencia 2124',
    role: 'manager',
    color: 'bg-brand-900',
    accent: '#7c5cbf',
  },
  {
    id: 'vitacura',
    name: 'Vitacura',
    address: 'Av. Vitacura 3600',
    role: 'manager',
    color: 'bg-emerald-900',
    accent: '#10b981',
  },
  {
    id: 'la-reina',
    name: 'La Reina',
    address: 'Av. Ossa 100',
    role: 'manager',
    color: 'bg-blue-900',
    accent: '#3b82f6',
  },
  {
    id: 'la-dehesa',
    name: 'La Dehesa',
    address: 'El Rodeo 12840',
    role: 'manager',
    color: 'bg-rose-900',
    accent: '#f43f5e',
  },
  {
    id: 'miami-wynwood',
    name: 'Miami',
    address: 'Brickell Ave · Coming soon',
    role: 'manager',
    color: 'bg-warm-800',
    accent: '#6b7280',
  },
]

export function BranchLogin() {
  const router = useRouter()

  function select(branch: BranchOption) {
    if (branch.id === 'miami-wynwood') return
    localStorage.setItem('rishtedar_branch', JSON.stringify(branch))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-2">
        <UtensilsCrossed size={18} className="text-gold-500" />
        <span className="font-display text-2xl italic text-ivory">Rishtedar</span>
      </div>
      <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-10">Panel de Gestión</p>

      {/* Selector */}
      <div className="w-full max-w-2xl">
        <p className="text-warm-500 text-xs tracking-wider uppercase text-center mb-6">
          Selecciona tu acceso
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRANCHES.map(branch => {
            const isAdmin = branch.id === 'admin'
            const isMiami = branch.id === 'miami-wynwood'

            return (
              <button
                key={branch.id}
                onClick={() => select(branch)}
                disabled={isMiami}
                className={`
                  relative text-left p-5 border transition-all duration-200 group
                  ${isAdmin
                    ? 'sm:col-span-2 border-gold-700/40 hover:border-gold-600/70 bg-warm-900/60'
                    : isMiami
                      ? 'border-warm-800 opacity-40 cursor-not-allowed bg-warm-900/30'
                      : 'border-warm-800 hover:border-warm-600 bg-warm-900/40 hover:bg-warm-900/70'
                  }
                `}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(to right, transparent, ${branch.accent}80, transparent)`,
                    opacity: isMiami ? 0.3 : 1,
                  }}
                />

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${branch.accent}15`, border: `1px solid ${branch.accent}30` }}
                  >
                    {isAdmin
                      ? <LayoutDashboard size={15} style={{ color: branch.accent }} />
                      : <MapPin size={15} style={{ color: branch.accent }} />
                    }
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-ivory font-medium text-sm">{branch.name}</p>
                      {isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 tracking-wider uppercase font-medium"
                          style={{ color: branch.accent, backgroundColor: `${branch.accent}15` }}>
                          Dueño
                        </span>
                      )}
                      {isMiami && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-warm-800 text-warm-500 tracking-wider uppercase font-medium">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <p className="text-warm-500 text-xs mt-0.5">{branch.address}</p>
                    {!isMiami && (
                      <p className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ color: branch.accent }}>
                        Ingresar →
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-warm-700 text-[10px] mt-10">
        Solo acceso autorizado · Rishtedar Staff
      </p>
    </div>
  )
}
