'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'

interface ScoreEntry {
  rank: number
  name: string
  score: number
  isCurrentUser?: boolean
}

interface Props {
  scores: ScoreEntry[]
  businessName?: string
  weekLabel?: string       // e.g. "Semana del 7 al 13 de abril"
  userRank?: number | null // posición del usuario en el ranking
}

const RANK_CONFIG = [
  { icon: Trophy, color: '#c9952a', label: '1.º', bg: 'bg-[#c9952a15] border-[#c9952a40]' },
  { icon: Medal,  color: '#c0c0c0', label: '2.º', bg: 'bg-[#c0c0c010] border-[#c0c0c030]' },
  { icon: Award,  color: '#cd7f32', label: '3.º', bg: 'bg-[#cd7f3210] border-[#cd7f3230]' },
]

export function GameLeaderboard({ scores, businessName, weekLabel, userRank }: Props) {
  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-warm-500 text-[10px] tracking-widest uppercase">Ranking semanal</p>
        {businessName && (
          <p className="text-warm-600 text-[10px]">{businessName}</p>
        )}
      </div>
      {weekLabel && (
        <p className="text-warm-600 text-xs mb-5">{weekLabel}</p>
      )}

      {/* Top 3 */}
      <div className="space-y-2 mb-4">
        {top3.length === 0 && (
          <p className="text-warm-600 text-sm text-center py-8">Sé el primero esta semana.</p>
        )}
        {top3.map((entry, i) => {
          const cfg = RANK_CONFIG[i]
          const Icon = cfg.icon
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className={`flex items-center gap-3 border p-3.5 ${cfg.bg} ${entry.isCurrentUser ? 'ring-1 ring-gold-600/40' : ''}`}
            >
              <Icon size={18} style={{ color: cfg.color }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-gold-400' : 'text-ivory'}`}>
                  {entry.isCurrentUser ? `${entry.name} (tú)` : entry.name}
                </p>
              </div>
              <p className="text-sm font-medium shrink-0" style={{ color: cfg.color }}>
                {entry.score.toLocaleString('es-CL')} pts
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <div className="space-y-1 mb-4">
          {rest.map(entry => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 px-3.5 py-2.5 border border-warm-800/50 ${entry.isCurrentUser ? 'border-gold-700/40 bg-gold-900/10' : ''}`}
            >
              <span className="text-warm-600 text-xs w-5 text-center shrink-0">{entry.rank}</span>
              <p className={`flex-1 text-sm truncate ${entry.isCurrentUser ? 'text-gold-400' : 'text-warm-400'}`}>
                {entry.isCurrentUser ? `${entry.name} (tú)` : entry.name}
              </p>
              <p className="text-warm-500 text-sm shrink-0">{entry.score.toLocaleString('es-CL')}</p>
            </div>
          ))}
        </div>
      )}

      {/* User not in top */}
      {userRank && userRank > scores.length && (
        <p className="text-center text-warm-600 text-xs py-2">
          Estás en la posición #{userRank} esta semana
        </p>
      )}
    </div>
  )
}
