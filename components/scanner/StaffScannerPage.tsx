'use client'

import { UtensilsCrossed } from 'lucide-react'
import { QRScannerCore } from './QRScannerCore'

const BRANCH_NAMES: Record<string, string> = {
  providencia: 'Providencia',
  vitacura:    'Vitacura',
  'la-reina':  'La Reina',
  'la-dehesa': 'La Dehesa',
  admin:       'Admin',
}

interface Props {
  branch: string
  token: string
}

export function StaffScannerPage({ branch, token }: Props) {
  const branchName = BRANCH_NAMES[branch] ?? branch

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col">
      {/* Header */}
      <header className="px-5 py-5 border-b border-warm-800 flex items-center gap-2.5">
        <UtensilsCrossed size={16} className="text-gold-500" />
        <span className="font-display text-lg italic text-ivory">Rishtedar</span>
        <span className="ml-auto text-warm-600 text-xs">{branchName}</span>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-6 max-w-sm mx-auto w-full">
        <div className="mb-6">
          <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-1">Circle · Staff</p>
          <h1 className="font-display text-3xl italic text-ivory">Registrar visita</h1>
          <p className="text-warm-500 text-sm mt-2">
            Escanea el QR del cliente para sumar puntos a su cuenta.
          </p>
        </div>

        <QRScannerCore
          businessId={branch}
          token={token}
          defaultPoints={100}
        />
      </main>
    </div>
  )
}
