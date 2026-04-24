'use client'

import { useState, useEffect } from 'react'
import { QrCode, Copy, CheckCircle2, RefreshCw, Send, ExternalLink, AlertTriangle } from 'lucide-react'
import { QRScannerCore } from '@/components/scanner/QRScannerCore'
import type { BranchOption } from './BranchLogin'

export function DashboardScannerView() {
  const [branch, setBranch] = useState<BranchOption | null>(null)
  const [scannerUrl, setScannerUrl] = useState<string>('')
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotateConfirm, setRotateConfirm] = useState(false)
  const [profile, setProfile] = useState<{ role?: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('rishtedar_branch')
    if (stored) setBranch(JSON.parse(stored) as BranchOption)
    const profileStored = localStorage.getItem('rishtedar_profile')
    if (profileStored) setProfile(JSON.parse(profileStored))
  }, [])

  useEffect(() => {
    if (!branch || branch.id === 'admin') return
    fetch(`/api/admin/scanner-token?branch=${branch.id}`)
      .then(r => r.json())
      .then(d => { if (d.url) setScannerUrl(d.url) })
      .catch(() => {})
  }, [branch])

  async function copyLink() {
    if (!scannerUrl) return
    await navigator.clipboard.writeText(scannerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendWhatsApp() {
    if (!scannerUrl || !phone) return
    const raw = phone.replace(/\D/g, '')
    const waPhone = raw.startsWith('56') ? raw : `56${raw}`
    const msg = encodeURIComponent(
      `Hola, aquí está tu acceso al escáner Rishtedar para ${branch?.name}:\n${scannerUrl}\n\nGuarda este link en tu teléfono. No lo compartas.`
    )
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank')
  }

  async function rotateToken() {
    if (!branch || !rotateConfirm) { setRotateConfirm(true); return }
    setRotating(true)
    setRotateConfirm(false)
    try {
      const res = await fetch('/api/admin/scanner-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: branch.id }),
      })
      const data = await res.json()
      if (data.url) setScannerUrl(data.url)
    } finally {
      setRotating(false)
    }
  }

  if (!branch) return null
  const isAdmin = branch.id === 'admin'
  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-warm-900 flex items-center gap-2">
          <QrCode size={22} className="text-brand-700" />
          Escáner Circle
        </h1>
        <p className="text-warm-500 text-sm mt-1">
          Escanea el QR de un cliente para registrar visita y sumar puntos.
        </p>
      </div>

      {/* Link del equipo */}
      {!isAdmin && scannerUrl && (
        <div className="bg-warm-950 border border-warm-800 p-4 space-y-4">
          <p className="text-gold-500 text-[10px] tracking-widest uppercase">
            Acceso para tu equipo · {branch.name}
          </p>

          {/* URL + copiar */}
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-warm-900 text-warm-300 text-xs px-3 py-2 truncate border border-warm-800">
              {scannerUrl}
            </code>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 bg-gold-600 hover:bg-gold-500 text-warm-950 px-3 py-2 text-xs font-medium transition-colors"
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href={scannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200 p-2 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Enviar por WhatsApp */}
          <div className="space-y-2">
            <p className="text-warm-500 text-xs">Enviar acceso por WhatsApp</p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Ej: 912345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="flex-1 bg-warm-900 border border-warm-700 text-warm-200 text-sm px-3 py-2 placeholder-warm-600 focus:outline-none focus:border-gold-500"
              />
              <button
                onClick={sendWhatsApp}
                disabled={!phone}
                className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-3 py-2 text-xs font-medium transition-colors"
              >
                <Send size={13} />
                Enviar
              </button>
            </div>
          </div>

          {/* Rotar token — solo super_admin */}
          {isSuperAdmin && (
            <div className="border-t border-warm-800 pt-4 space-y-2">
              <p className="text-warm-500 text-xs">
                Si alguien ya no trabaja aquí, rota el token para invalidar su acceso inmediatamente.
              </p>
              {rotateConfirm && (
                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-950/30 border border-amber-800/40 px-3 py-2">
                  <AlertTriangle size={12} />
                  Todas las URLs anteriores dejarán de funcionar. ¿Confirmar?
                </div>
              )}
              <button
                onClick={rotateToken}
                disabled={rotating}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 font-medium transition-colors ${
                  rotateConfirm
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'border border-warm-700 hover:border-warm-500 text-warm-400 hover:text-warm-200'
                }`}
              >
                <RefreshCw size={13} className={rotating ? 'animate-spin' : ''} />
                {rotating ? 'Rotando...' : rotateConfirm ? 'Confirmar rotación' : 'Rotar token de acceso'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scanner */}
      <div className="bg-warm-950 border border-warm-800 p-6">
        <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-5 text-center">
          Escáner · {branch.name}
        </p>
        <QRScannerCore
          businessId={branch.id}
          defaultPoints={100}
        />
      </div>
    </div>
  )
}
