'use client'

import { useState, useEffect } from 'react'
import { Gift, Trophy, Zap, Star, Crown, Save, CheckCircle2, Plus, Trash2, Loader2 } from 'lucide-react'

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

interface TierBenefit {
  icon: string
  text: string
}

const TIER_THRESHOLDS = [
  { tier: 'Bronze', icon: Star,  color: '#cd7f32', range: '0 – 999 pts',   from: 0,    to: 999 },
  { tier: 'Silver', icon: Zap,   color: '#c0c0c0', range: '1.000 – 4.999', from: 1000, to: 4999 },
  { tier: 'Gold',   icon: Crown, color: '#c9952a', range: '5.000+',         from: 5000, to: null },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function LoyaltyConfigView() {
  const [rules, setRules]               = useState<EarnRule[]>([])
  const [prizes, setPrizes]             = useState<RankingPrize[]>([])
  const [tierBenefits, setTierBenefits] = useState<Record<'bronze' | 'silver' | 'gold', TierBenefit[]>>({ bronze: [], silver: [], gold: [] })
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)

  // ── Load config from DB on mount ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/loyalty-config')
      .then(r => r.json())
      .then(data => {
        if (data.earn_rules)    setRules(data.earn_rules)
        if (data.prizes)        setPrizes(data.prizes)
        if (data.tier_benefits) setTierBenefits(data.tier_benefits)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function updateRule(id: string, field: keyof EarnRule, value: number | boolean) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function updatePrize(rank: number, description: string) {
    setPrizes(prev => prev.map(p => p.rank === rank ? { ...p, description } : p))
  }

  function updateBenefit(tier: keyof typeof tierBenefits, index: number, field: keyof TierBenefit, value: string) {
    setTierBenefits(prev => ({
      ...prev,
      [tier]: prev[tier].map((b, i) => i === index ? { ...b, [field]: value } : b),
    }))
  }

  function addBenefit(tier: keyof typeof tierBenefits) {
    setTierBenefits(prev => ({
      ...prev,
      [tier]: [...prev[tier], { icon: '✦', text: 'Nuevo beneficio' }],
    }))
  }

  function removeBenefit(tier: keyof typeof tierBenefits, index: number) {
    setTierBenefits(prev => ({
      ...prev,
      [tier]: prev[tier].filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/admin/loyalty-config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ earn_rules: rules, prizes, tier_benefits: tierBenefits }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-warm-400" />
      </div>
    )
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
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-ivory px-5 py-2.5 text-xs tracking-wider uppercase font-medium transition-colors shrink-0"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
          </button>
          {saveError && <p className="text-red-500 text-[11px]">{saveError}</p>}
        </div>
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
          Los umbrales de tier están fijados en código (1.000 / 5.000 pts). Se pueden ajustar bajo pedido.
        </p>
      </section>

      {/* ── Tier Benefits Editor ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-warm-800 mb-1">Beneficios por nivel</h2>
        <p className="text-warm-500 text-xs mb-4">
          Estos beneficios se muestran en la página <strong>/circle</strong> y en la tarjeta del cliente en la app.
          Edítalos aquí para mantenerlos actualizados sin tocar código.
        </p>
        <div className="space-y-5">
          {(Object.entries(tierBenefits) as [keyof typeof tierBenefits, TierBenefit[]][]).map(([tierKey, benefits]) => {
            const tierMeta = TIER_THRESHOLDS.find(t => t.tier.toLowerCase() === tierKey)!
            const TierIcon = tierMeta?.icon ?? Star
            return (
              <div key={tierKey} className="border border-warm-200 bg-white">
                {/* Tier header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-warm-100">
                  <div className="flex items-center gap-2">
                    <TierIcon size={14} style={{ color: tierMeta?.color }} />
                    <span className="font-medium text-sm" style={{ color: tierMeta?.color }}>
                      {tierMeta?.tier}
                    </span>
                    <span className="text-warm-400 text-xs">{tierMeta?.range}</span>
                  </div>
                  <button
                    onClick={() => addBenefit(tierKey)}
                    className="flex items-center gap-1 text-brand-700 hover:text-brand-900 text-xs font-medium transition-colors"
                  >
                    <Plus size={12} />
                    Agregar
                  </button>
                </div>

                {/* Benefits list */}
                <div className="divide-y divide-warm-50">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 px-5 py-3">
                      {/* Icon input */}
                      <input
                        type="text"
                        value={benefit.icon}
                        onChange={e => updateBenefit(tierKey, index, 'icon', e.target.value)}
                        maxLength={2}
                        className="w-10 text-center border border-warm-200 text-base px-1 py-1.5 focus:outline-none focus:border-brand-400"
                        title="Emoji o símbolo del beneficio"
                      />
                      {/* Text input */}
                      <input
                        type="text"
                        value={benefit.text}
                        onChange={e => updateBenefit(tierKey, index, 'text', e.target.value)}
                        placeholder="Descripción del beneficio"
                        className="flex-1 border border-warm-200 text-warm-700 text-sm px-3 py-1.5 focus:outline-none focus:border-brand-400"
                      />
                      {/* Remove */}
                      <button
                        onClick={() => removeBenefit(tierKey, index)}
                        className="p-1.5 text-warm-400 hover:text-red-500 transition-colors shrink-0"
                        title="Eliminar beneficio"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {benefits.length === 0 && (
                    <p className="px-5 py-4 text-warm-400 text-xs text-center">
                      Sin beneficios. Agrega el primero.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-warm-400 text-xs mt-2">
          Guarda para que los cambios se reflejen en la app del cliente.
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
                  <span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform ${
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
          Los 3 mejores puntajes del juego &ldquo;El Festín&rdquo; cada semana reciben estos premios.
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
