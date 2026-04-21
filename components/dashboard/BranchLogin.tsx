'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, LayoutDashboard, MapPin, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Branch metadata ──────────────────────────────────────────────────────────

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
    id:      'admin',
    name:    'Admin Global',
    address: 'Todas las sucursales · Vista consolidada',
    role:    'admin',
    color:   'bg-warm-950',
    accent:  '#c9952a',
  },
  {
    id:      'providencia',
    name:    'Providencia',
    address: 'Av. Providencia 2124',
    role:    'manager',
    color:   'bg-brand-900',
    accent:  '#7c5cbf',
  },
  {
    id:      'vitacura',
    name:    'Vitacura',
    address: 'Av. Vitacura 3600',
    role:    'manager',
    color:   'bg-emerald-900',
    accent:  '#10b981',
  },
  {
    id:      'la-reina',
    name:    'La Reina',
    address: 'Av. Ossa 100',
    role:    'manager',
    color:   'bg-blue-900',
    accent:  '#3b82f6',
  },
  {
    id:      'la-dehesa',
    name:    'La Dehesa',
    address: 'El Rodeo 12840',
    role:    'manager',
    color:   'bg-rose-900',
    accent:  '#f43f5e',
  },
]

const EMAIL_DOMAIN = 'rishtedar.local'

// ─── Component ────────────────────────────────────────────────────────────────

export function BranchLogin() {
  const router = useRouter()
  const [selected, setSelected]     = useState<BranchOption | null>(null)
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const passwordRef                 = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  function handleSelectBranch(branch: BranchOption) {
    setSelected(branch)
    setPassword('')
    setError(null)
    // Pequeño delay para que la animación empiece antes del focus
    setTimeout(() => passwordRef.current?.focus(), 200)
  }

  function handleBack() {
    setSelected(null)
    setPassword('')
    setError(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !password) return

    setLoading(true)
    setError(null)

    const email = `${selected.id}@${EMAIL_DOMAIN}`
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setLoading(false)
      setError('Contraseña incorrecta')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo — siempre visible */}
      <motion.div
        className="flex flex-col items-center mb-10"
        animate={{ opacity: selected ? 0.5 : 1, scale: selected ? 0.92 : 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <UtensilsCrossed size={18} className="text-gold-500" />
          <span className="font-display text-2xl italic text-ivory">Rishtedar</span>
        </div>
        <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase">Panel de Gestión</p>
      </motion.div>

      {/* ── Contenedor principal ── */}
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Branch selector ── */}
          {!selected && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <p className="text-warm-500 text-xs tracking-wider uppercase text-center mb-6">
                Selecciona tu acceso
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BRANCHES.map(branch => {
                  const isAdmin = branch.id === 'admin'
                  return (
                    <button
                      key={branch.id}
                      onClick={() => handleSelectBranch(branch)}
                      className={`
                        relative text-left p-5 border transition-all duration-200 group
                        ${isAdmin
                          ? 'sm:col-span-2 border-gold-700/40 hover:border-gold-600/70 bg-warm-900/60'
                          : 'border-warm-800 hover:border-warm-600 bg-warm-900/40 hover:bg-warm-900/70'
                        }
                      `}
                    >
                      {/* Accent line top */}
                      <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: `linear-gradient(to right, transparent, ${branch.accent}80, transparent)` }}
                      />

                      <div className="flex items-start gap-4">
                        <div
                          className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${branch.accent}15`, border: `1px solid ${branch.accent}30` }}
                        >
                          {isAdmin
                            ? <LayoutDashboard size={15} style={{ color: branch.accent }} />
                            : <MapPin size={15} style={{ color: branch.accent }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-ivory font-medium text-sm">{branch.name}</p>
                            {isAdmin && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 tracking-wider uppercase font-medium"
                                style={{ color: branch.accent, backgroundColor: `${branch.accent}15` }}
                              >
                                Dueño
                              </span>
                            )}
                          </div>
                          <p className="text-warm-500 text-xs mt-0.5">{branch.address}</p>
                          <p
                            className="text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            style={{ color: branch.accent }}
                          >
                            Ingresar →
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Password entry ── */}
          {selected && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center"
            >
              {/* Selected branch badge */}
              <div
                className="flex items-center gap-3 px-5 py-3 mb-8 border w-full max-w-sm"
                style={{ borderColor: `${selected.accent}40`, backgroundColor: `${selected.accent}08` }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selected.accent}15`, border: `1px solid ${selected.accent}30` }}
                >
                  {selected.id === 'admin'
                    ? <LayoutDashboard size={14} style={{ color: selected.accent }} />
                    : <MapPin size={14} style={{ color: selected.accent }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ivory font-medium text-sm">{selected.name}</p>
                  <p className="text-warm-500 text-xs truncate">{selected.address}</p>
                </div>
              </div>

              {/* Password form */}
              <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                <div className="space-y-1.5">
                  <label className="text-warm-400 text-xs tracking-wider uppercase">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`
                        w-full bg-warm-900 border px-4 py-3 text-ivory text-sm
                        placeholder-warm-700 focus:outline-none transition-colors pr-11
                        ${error
                          ? 'border-red-500/60 focus:border-red-500'
                          : 'border-warm-700 focus:border-warm-500'
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-600 hover:text-warm-400 transition-colors"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-xs pt-0.5"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium
                    transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: selected.accent,
                    color: '#0a0807',
                  }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Ingresando…</>
                    : 'Ingresar →'
                  }
                </button>

                {/* Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-1.5 text-warm-600
                    hover:text-warm-400 text-xs py-1.5 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Elegir otro acceso
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <p className="text-warm-700 text-[10px] mt-10">
        Solo acceso autorizado · Rishtedar Staff
      </p>
    </div>
  )
}
