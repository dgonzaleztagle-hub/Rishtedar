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
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-gold-500 text-[10px] tracking-widest uppercase mb-0.5">Minijuego semanal</p>
            <p className="font-display text-xl italic text-ivory">El Festín</p>
          </div>
          <div className="text-right">
            <p className="text-warm-500 text-[10px] uppercase tracking-wider mb-0.5">Intentos rankeados</p>
            <p className="text-ivory text-sm font-medium">{tokensLeft} / 3</p>
          </div>
        </div>
        <p className="text-warm-600 text-xs mb-4">
          Atrapa los platos indios, evita las verduras. Los 3 mejores scores de la semana ganan premios.
        </p>
        <RishtedarGame
          onGameEnd={onGameEnd}
          tokensLeft={tokensLeft}
        />
      </div>

      <div className="mx-4 border-t border-warm-800 mb-2" />

      <GameLeaderboard
        scores={leaderboard}
        businessName={identity.favoriteLocal.replace('-', ' ')}
        weekLabel={getWeekLabel()}
      />
    </>
  )
}
