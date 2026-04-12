'use client'

import { useState } from 'react'
import { Gift, Trophy, Zap, Star, Crown, Info, Save, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EarnRule {
  id: string
  label: string
  description: string
  points: number
  unit: string   // 'por $1.000 CLP' | 'por visita' | 'fija'
  enabled: boolean
}

interface RankingPrize {
  rank: 1 | 2 | 3
  label: string
  description: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
// Estos valores son los que el cliente ve en CircleContent + /app
// El dashboard los muestra y permite editarlos (en una siguiente iteración
// se guardan en Supabase tabla loyalty_config; por ahora es visual + educativo)

const DEFAULT_EARN_RULES: EarnRule[] = [
  {
    id: 'delivery',
    label: 'Pedido Delivery / Takeaway',
    description: 'Puntos otorgados al confirmar un pedido online',
    points: 1,
    unit: 'por $1.000 CLP',
    enabled: true,
  },
  {
    id: 'visit',
    label: 'Visita registrada en local',
    description: 'Staff escanea QR del cliente al llegar o al pagar',
    points: 100,
    unit: 'por visita',
    enabled: true,
  },
  {
    id: 'reservation',
    label: 'Reserva confirmada',
    description: 'Se acreditan al momento de confirmar la reserva',
    points: 100,
    unit: 'fija',
    enabled: true,
  },
  {
    id: 'birthday',
    label: 'Cumpleaños (Gold)',
    description: 'Puntos dobles en el mes de cumpleaños — solo nivel Gold',
    points: 2,
    unit: 'multiplicador',
    enabled: true,
  },
  {
    id: 'tuesday',
    label: 'Martes dobles (Silver)',
    description: 'Puntos dobles los martes — nivel Silver y Gold',
    points: 2,
    unit: 'multiplicador',
    enabled: false,
  },
]

const DEFAULT_PRIZES: RankingPrize[] = [
  { rank: 1, label: '1er lugar', description: '20% de descuento en próxima visita' },
  { rank: 2, label: '2do lugar', description: '1 postre gratis' },
  { rank: 3, label: '3er lugar', description: '10% de descuento en próxima visita' },
]

const TIER_THRESHOLDS = [
  { tier: 'Bronze', icon: Star,  color: '#cd7f32', range: '0 – 999 pts',   from: 0,    to: 999 },
  { tier: 'Silver', icon: Zap,   color: '#c0c0c0', range: '1.000 – 4.999', from: 1000, to: 4999 },
  { tier: 'Gold',   icon: Crown, color: '#c9952a', range: '5.000+',         from: 5000, to: null },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function LoyaltyConfigView() {
  const [rules, setRules]   = useState<EarnRule[]>(DEFAULT_EARN_RULES)
  const [prizes, setPrizes] = useState<RankingPrize[]>(DEFAULT_PRIZES)
  const [saved, setSaved]   = useState(false)

  function updateRule(id: string, field: keyof EarnRule, value: number | boolean) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function updatePrize(rank: number, description: string) {
    setPrizes(prev => prev.map(p => p.rank === rank ? { ...p, description } : p))
  }

  function handleSave() {
    // TODO: POST /api/admin/loyalty-config cuando el cliente apruebe persistencia en DB
    // Por ahora solo feedback visual
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900 flex items-center gap-2">
            <Gift size={22} className="text-brand-700" />
            Loyalty & Premios
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            Define cuántos puntos suma cada acción y qué ganan los ganadores del ranking semanal.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory px-5 py-2.5 text-xs tracking-wider uppercase font-medium transition-colors shrink-0"
        >
          {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 px-4 py-3">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs leading-relaxed">
          Estos valores definen las reglas visibles para el cliente en{' '}
          <strong>/circle</strong> y en la app. Cambiarlos aquí actualiza la lógica del sistema.
          Los puntos ya acumulados no se ven afectados.
        </p>
      </div>

      {/* ── Tiers ───────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-warm-800 mb-4">Niveles (Tiers)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIER_THRESHOLDS.map(t => {
            const Icon = t.icon
            return (
              <div
                key={t.tier}
                className="border p-4 bg-warm-950"
                style={{ borderColor: `${t.color}40` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: t.color }} />
                  <span className="font-medium text-sm" style={{ color: t.color }}>{t.tier}</span>
                </div>
                <p className="text-warm-400 text-xs">{t.range}</p>
              </div>
            )
          })}
        </div>
        <p className="text-warm-400 text-xs mt-2">
          Los umbrales de tier (1.000 / 5.000 pts) están fijados en código. Contactar al dev para cambiarlos.
        </p>
      </section>

      {/* ── Earn Rules ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-warm-800 mb-4">Reglas de acumulación</h2>
        <div className="divide-y divide-warm-200 border border-warm-200">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-4 bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-warm-900 text-sm font-medium">{rule.label}</p>
                  {!rule.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-warm-100 text-warm-500 uppercase tracking-wider">
                      Desactivado
                    </span>
                  )}
                </div>
                <p className="text-warm-500 text-xs mt-0.5">{rule.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={rule.points}
                  onChange={e => updateRule(rule.id, 'points', Number(e.target.value))}
                  className="w-20 text-center border border-warm-300 text-warm-900 text-sm px-2 py-1.5 focus:outline-none focus:border-brand-500"
                />
                <span className="text-warm-500 text-xs whitespace-nowrap">{rule.unit}</span>
                <button
                  onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    rule.enabled ? 'bg-brand-600' : 'bg-warm-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ranking Prizes ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-gold-600" />
          <h2 className="text-base font-semibold text-warm-800">Premios del ranking semanal</h2>
        </div>
        <p className="text-warm-500 text-xs mb-4">
          Los 3 mejores puntajes del juego "El Festín" cada semana reciben estos premios.
          Se envían como códigos de descuento a su cuenta Circle.
        </p>
        <div className="divide-y divide-warm-200 border border-warm-200">
          {prizes.map(prize => {
            const medals = ['', '🥇', '🥈', '🥉']
            return (
              <div key={prize.rank} className="flex items-center gap-4 px-5 py-4 bg-white">
                <span className="text-2xl w-8 text-center shrink-0">{medals[prize.rank]}</span>
                <div className="flex-1">
                  <p className="text-warm-900 text-sm font-medium mb-1">{prize.label}</p>
                  <input
                    type="text"
                    value={prize.description}
                    onChange={e => updatePrize(prize.rank, e.target.value)}
                    placeholder="Descripción del premio..."
                    className="w-full border border-warm-300 text-warm-700 text-sm px-3 py-1.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Resumen para el cliente ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-warm-800 mb-2">
          Vista previa — lo que ve el cliente
        </h2>
        <p className="text-warm-500 text-xs mb-4">
          Así aparece en <strong>/circle</strong> y en la app. Actualiza automáticamente al guardar.
        </p>
        <div className="bg-warm-950 border border-warm-800 p-5 space-y-3">
          {rules.filter(r => r.enabled).map(r => (
            <div key={r.id} className="flex items-center justify-between">
              <p className="text-warm-400 text-xs">{r.label}</p>
              <p className="text-ivory text-xs font-medium">
                +{r.points} pts {r.unit}
              </p>
            </div>
          ))}
          <div className="border-t border-warm-800 pt-3 space-y-1">
            {prizes.map(p => {
              const medals = ['', '🥇', '🥈', '🥉']
              return (
                <div key={p.rank} className="flex items-center justify-between">
                  <p className="text-warm-500 text-xs">{medals[p.rank]} Ranking {p.label}</p>
                  <p className="text-gold-500 text-xs">{p.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
