'use client'

import Link from 'next/link'
import QRCode from 'react-qr-code'
import { Gift, ShoppingBag, Clock, MapPin, ChevronRight } from 'lucide-react'

interface ClientIdentity {
  name:          string
  phone:         string
  favoriteLocal: string
}

interface CircleTabProps {
  identity: ClientIdentity
}

export function CircleTab({ identity }: CircleTabProps) {
  return (
    <>
      {/* Reward */}
      <div className="px-4 mb-3">
        <div className="border border-gold-700/40 bg-gold-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gold-900/40 border border-gold-700/40 flex items-center justify-center shrink-0">
              <Gift size={14} className="text-gold-500" />
            </div>
            <div className="flex-1">
              <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-0.5">Recompensa activa</p>
              <p className="text-ivory text-sm font-medium">1 postre gratis</p>
              <p className="text-warm-500 text-xs mt-0.5">Válido en cualquier local · Presenta tu QR</p>
            </div>
            <p className="text-gold-400 text-xs shrink-0">15 días</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 space-y-2 mb-6">
        <Link
          href="/order"
          className="flex items-center justify-between p-4 border border-warm-800 bg-warm-900/30 hover:bg-warm-900/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={15} className="text-brand-400" />
            <div>
              <p className="text-ivory text-sm">Hacer un pedido</p>
              <p className="text-warm-600 text-xs">+150 pts + fichas de juego</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-warm-700" />
        </Link>

        <Link
          href="/reservar"
          className="flex items-center justify-between p-4 border border-warm-800 bg-warm-900/30 hover:bg-warm-900/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock size={15} className="text-gold-500" />
            <div>
              <p className="text-ivory text-sm">Reservar mesa</p>
              <p className="text-warm-600 text-xs">+100 pts por reserva confirmada</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-warm-700" />
        </Link>

        <div className="p-4 border border-warm-800 bg-warm-900/30">
          <div className="flex items-center gap-3">
            <MapPin size={15} className="text-brand-500" />
            <div>
              <p className="text-warm-500 text-xs uppercase tracking-wider mb-0.5">Local favorito</p>
              <p className="text-ivory text-sm capitalize">{identity.favoriteLocal.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Card */}
      <div className="px-4 mb-8">
        <div className="border border-warm-800 bg-warm-900/20 p-5">
          <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-4 text-center">
            Mi QR Circle
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-ivory p-3">
              <QRCode
                value={`rishtedar:circle:${identity.phone}:${identity.favoriteLocal}`}
                size={140}
                fgColor="#1a1200"
                bgColor="#faf9f4"
              />
            </div>
            <div className="text-center">
              <p className="text-ivory text-sm font-medium">{identity.name}</p>
              <p className="text-warm-600 text-xs mt-0.5">{identity.phone}</p>
              <p className="text-warm-700 text-[10px] mt-2">
                Presenta este QR al staff para acumular o canjear puntos
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
