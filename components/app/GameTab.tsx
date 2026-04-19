'use client'

import { GameLeaderboard } from '@/components/pwa/GameLeaderboard'
import { RishtedarGame } from '@/components/pwa/RishtedarGame'
import { getWeekLabel } from '@/lib/services/gameService'

interface LeaderboardEntry {
  rank:          number
  name:          string
  score:         number
  isCurrentUser: boolean
}

interface ClientIdentity {
  name:          string
  phone:         string
  favoriteLocal: string
}

interface GameTabProps {
  identity:    ClientIdentity
  tokensLeft:  number
  leaderboard: LeaderboardEntry[]
  onGameEnd:   (score: number, counted: boolean) => void
}

export function GameTab({ identity, tokensLeft, leaderboard, onGameEnd }: GameTabProps) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-2 pb-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-0.5">Minijuego semanal</p>
            <p className="font-display text-3xl italic text-ivory">El Festín de Especias</p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-warm-500 text-[10px] uppercase tracking-wider mb-0.5">Intentos rankeados</p>
            <p className="text-ivory text-sm font-medium">{tokensLeft} / 3</p>
          </div>
        </div>
        <div className="mb-5 grid gap-3 text-sm text-warm-400 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <p className="max-w-3xl leading-relaxed">
            Una run continua de cocina india: arma platos reales con ingredientes táctiles, sirve la mesa correcta y sobrevive al aumento progresivo de dificultad para entrar al ranking semanal.
          </p>
          <div className="rounded-full border border-warm-800 bg-warm-950/40 px-4 py-2 text-xs uppercase tracking-[0.22em] text-gold-500">
            {identity.favoriteLocal.replace('-', ' ')} · Top 3 con premio
          </div>
        </div>
        <RishtedarGame
          onGameEnd={onGameEnd}
          tokensLeft={tokensLeft}
        />
      </div>

      <div className="mx-auto mb-2 max-w-6xl px-4">
        <div className="border-t border-warm-800" />
      </div>

      <div className="mx-auto max-w-4xl">
        <GameLeaderboard
          scores={leaderboard}
          businessName={identity.favoriteLocal.replace('-', ' ')}
          weekLabel={getWeekLabel()}
        />
      </div>
    </>
  )
}
