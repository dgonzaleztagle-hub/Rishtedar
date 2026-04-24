'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedCircleQR {
  phone: string
  favoriteLocal: string
}

export interface CustomerData {
  found: boolean
  phone: string
  businessId: string
  name?: string
  points?: number
  totalPoints?: number
  tier?: 'bronze' | 'silver' | 'gold'
  totalVisits?: number
  lastVisit?: string
}

interface Props {
  businessId: string
  token?: string       // token de sucursal (scanner físico); omitir desde dashboard (usa sesión)
  defaultPoints?: number
  onAward?: (customer: CustomerData, points: number) => void
}

// ─── Parse QR ─────────────────────────────────────────────────────────────────

function parseQR(raw: string): ParsedCircleQR | null {
  // Formato: rishtedar:circle:{phone}:{local}
  const parts = raw.split(':')
  if (parts.length < 4 || parts[0] !== 'rishtedar' || parts[1] !== 'circle') return null
  return { phone: parts[2], favoriteLocal: parts[3] }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QRScannerCore({ businessId, token = '', defaultPoints = 100, onAward }: Props) {
  const scannerRef  = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const [scanning, setScanning]   = useState(false)
  const [customer, setCustomer]   = useState<CustomerData | null>(null)
  const [points, setPoints]       = useState(defaultPoints)
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  // ── Start scanner ───────────────────────────────────────────────────────────
  async function startScan() {
    setCustomer(null)
    setStatus('idle')
    setScanning(true)
  }

  // ── Stop scanner ────────────────────────────────────────────────────────────
  async function stopScan() {
    if (instanceRef.current) {
      await instanceRef.current.stop().catch(() => null)
      instanceRef.current = null
    }
    setScanning(false)
  }

  // ── Init html5-qrcode when scanning starts ──────────────────────────────────
  useEffect(() => {
    if (!scanning || !scannerRef.current) return

    let stopped = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped || !scannerRef.current) return

      const qr = new Html5Qrcode('qr-reader')
      instanceRef.current = qr

      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          const parsed = parseQR(decoded)
          if (!parsed) return

          await qr.stop().catch(() => null)
          instanceRef.current = null
          setScanning(false)
          setStatus('loading')

          const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ''
          const res = await fetch(
            `/api/staff/customer?phone=${encodeURIComponent(parsed.phone)}&business_id=${businessId}${tokenParam}`
          )
          const data: CustomerData = await res.json()
          setCustomer(data)
          setStatus('idle')
        },
        () => { /* frame errors silenciados */ }
      ).catch(() => {
        setScanning(false)
        setStatus('error')
        setStatusMsg('No se pudo acceder a la cámara')
      })
    })

    return () => {
      stopped = true
      instanceRef.current?.stop().catch(() => null)
    }
  }, [scanning, businessId, token])

  // ── Award points ────────────────────────────────────────────────────────────
  async function handleAward() {
    if (!customer) return
    setStatus('loading')

    const res = await fetch('/api/staff/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone:      customer.phone,
        name:       customer.name ?? customer.phone,
        businessId,
        points,
        reason:     'manual',
        ...(token ? { token } : {}),
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setStatusMsg(`+${points} pts · Total: ${data.newTotal} pts`)
      onAward?.(customer, points)
      setCustomer(prev => prev ? { ...prev, points: data.newTotal } : prev)
    } else {
      setStatus('error')
      setStatusMsg(data.error ?? 'Error al registrar puntos')
    }
  }

  // ── Tier colors ─────────────────────────────────────────────────────────────
  const TIER_COLOR: Record<string, string> = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold:   '#c9952a',
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-sm mx-auto space-y-4">

      {/* Scanner area */}
      {scanning ? (
        <div className="relative">
          <div id="qr-reader" ref={scannerRef} className="w-full rounded-none overflow-hidden" />
          <button
            onClick={stopScan}
            className="absolute top-2 right-2 bg-warm-950/80 text-ivory p-2 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={startScan}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2.5 border border-warm-700 hover:border-gold-600 bg-warm-900/30 hover:bg-warm-900/60 text-ivory py-5 text-sm tracking-wider uppercase font-medium transition-all disabled:opacity-40"
        >
          {status === 'loading'
            ? <Loader2 size={16} className="animate-spin" />
            : <Camera size={16} className="text-gold-500" />
          }
          {status === 'loading' ? 'Procesando...' : 'Escanear QR Circle'}
        </button>
      )}

      {/* Status messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/40 px-4 py-3">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">{statusMsg}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 px-4 py-3">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{statusMsg}</p>
        </div>
      )}

      {/* Customer card */}
      {customer && status !== 'loading' && (
        <div className="border border-warm-700 bg-warm-900/40 p-5 space-y-4">

          {customer.found ? (
            <>
              {/* Identity */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ivory font-medium">{customer.name}</p>
                  <p className="text-warm-500 text-xs">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-medium capitalize"
                    style={{ color: TIER_COLOR[customer.tier ?? 'bronze'] }}
                  >
                    {customer.tier}
                  </p>
                  <p className="text-warm-500 text-xs">{customer.totalVisits} visitas</p>
                </div>
              </div>

              {/* Points */}
              <div className="bg-warm-950 px-4 py-3 text-center">
                <p className="text-gold-600 text-[10px] tracking-widest uppercase mb-1">Puntos actuales</p>
                <p className="font-display text-3xl italic text-ivory">
                  {customer.points?.toLocaleString('es-CL')}
                  <span className="text-warm-600 text-lg ml-1">pts</span>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-warm-400 text-sm">Cliente nuevo</p>
              <p className="text-warm-600 text-xs mt-1">{customer.phone}</p>
              <p className="text-warm-600 text-xs">Se creará su perfil al registrar visita</p>
            </div>
          )}

          {/* Award */}
          {status !== 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-warm-500 text-xs whitespace-nowrap">Puntos a sumar</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="flex-1 bg-warm-900 border border-warm-700 text-ivory text-sm px-3 py-2 focus:outline-none focus:border-gold-600"
                />
              </div>
              <button
                onClick={handleAward}
                className="w-full bg-gold-600 hover:bg-gold-500 text-warm-950 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
              >
                Registrar visita · +{points} pts
              </button>
            </div>
          )}

          {status === 'success' && (
            <button
              onClick={() => { setCustomer(null); setStatus('idle') }}
              className="w-full border border-warm-700 hover:border-warm-500 text-warm-400 py-3 text-xs tracking-widest uppercase font-medium transition-colors"
            >
              Escanear siguiente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
