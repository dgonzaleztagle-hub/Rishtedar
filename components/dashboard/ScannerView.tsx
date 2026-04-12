'use client'

import { useState } from 'react'
import { QrCode, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { QRScannerCore } from '@/components/scanner/QRScannerCore'
import { BRANCH_TOKENS } from '@/lib/staff-tokens'
import type { BranchOption } from './BranchLogin'

export function DashboardScannerView() {
  const [branch] = useState<BranchOption | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('rishtedar_branch')
    return stored ? (JSON.parse(stored) as BranchOption) : null
  })
  const [copied, setCopied] = useState(false)

  if (!branch) return null

  const isAdmin = branch.id === 'admin'
  const token = BRANCH_TOKENS[branch.id] ?? 'RSH-ADMIN-2024'
  const scannerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/scanner/${branch.id}?t=${token}`
    : ''

  async function copyLink() {
    await navigator.clipboard.writeText(scannerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

      {/* Link liviano para mozos */}
      {!isAdmin && (
        <div className="bg-warm-950 border border-warm-800 p-4 space-y-3">
          <p className="text-gold-500 text-[10px] tracking-widest uppercase">
            Link para tu equipo
          </p>
          <p className="text-warm-400 text-xs leading-relaxed">
            Comparte este link con los mozos de {branch.name}. No necesitan contraseña.
          </p>
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
        </div>
      )}

      {/* Scanner */}
      <div className="bg-warm-950 border border-warm-800 p-6">
        <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-5 text-center">
          Escáner · {branch.name}
        </p>
        <QRScannerCore
          businessId={branch.id}
          token="dashboard"
          defaultPoints={100}
        />
      </div>
    </div>
  )
}
