'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Tag, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LOCATIONS } from '@/lib/locations'
import { toast } from 'sonner'
import type { Promotion } from '@/types'

const DEMO_PROMOTIONS: Partial<Promotion>[] = [
  {
    id: 'p1', title: 'San Valentín — Noche romántica', description: 'Descuento especial en delivery',
    discount_type: 'percent', discount_value: 40,
    applicable_to: 'delivery_only', business_id: null,
    valid_from: '2026-02-14', valid_to: '2026-02-14',
    day_of_week: null, start_hour: null, end_hour: null,
    is_active: true, usage_count: 47,
  },
  {
    id: 'p2', title: 'Miércoles de delivery', description: '30% OFF todos los miércoles',
    discount_type: 'percent', discount_value: 30,
    applicable_to: 'delivery_only', business_id: null,
    valid_from: '2026-01-01', valid_to: '2026-12-31',
    day_of_week: 3, start_hour: null, end_hour: null,
    is_active: true, usage_count: 128,
  },
  {
    id: 'p3', title: 'Happy Hour Samosas', description: '2x1 en entradas seleccionadas',
    discount_type: 'percent', discount_value: 50,
    applicable_to: 'dine_in_only', business_id: 'providencia',
    valid_from: '2026-04-01', valid_to: '2026-06-30',
    day_of_week: null, start_hour: 18, end_hour: 19,
    is_active: true, usage_count: 23,
  },
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type FormData = {
  title: string
  description: string
  discount_type: 'percent' | 'fixed_amount'
  discount_value: string
  applicable_to: 'all_orders' | 'delivery_only' | 'dine_in_only' | 'reservation_only'
  business_id: string
  valid_from: string
  valid_to: string
  day_of_week: string
  start_hour: string
  end_hour: string
}

const emptyForm: FormData = {
  title: '', description: '',
  discount_type: 'percent', discount_value: '',
  applicable_to: 'all_orders', business_id: '',
  valid_from: '', valid_to: '',
  day_of_week: '', start_hour: '', end_hour: '',
}

export function PromotionsCMS() {
  const [promotions, setPromotions] = useState<Partial<Promotion>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchPromotions() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl?.startsWith('http')) {
        setPromotions(DEMO_PROMOTIONS)
        setLoading(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })
      setPromotions(data?.length ? data : DEMO_PROMOTIONS)
      setLoading(false)
    }
    fetchPromotions()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.discount_value || !form.valid_from || !form.valid_to) {
      toast.error('Completa los campos requeridos')
      return
    }
    setSaving(true)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasDB = !!(supabaseUrl && supabaseUrl.startsWith('http'))

    let data: Partial<Promotion> | null = null
    let error: Error | null = null

    if (hasDB) {
      const supabase = createClient()
      const result = await supabase.from('promotions').insert({
        title: form.title,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        applicable_to: form.applicable_to,
        business_id: form.business_id || null,
        valid_from: form.valid_from,
        valid_to: form.valid_to,
        day_of_week: form.day_of_week ? parseInt(form.day_of_week) : null,
        start_hour: form.start_hour ? parseInt(form.start_hour) : null,
        end_hour: form.end_hour ? parseInt(form.end_hour) : null,
        is_active: true,
        usage_count: 0,
      }).select().single()
      data = result.data
      error = result.error as Error | null
    } else {
      error = new Error('no-db')
    }

    setSaving(false)

    if (error) {
      // Demo: add locally if no DB
      const newPromo: Partial<Promotion> = {
        id: `demo-${Date.now()}`,
        title: form.title, description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        applicable_to: form.applicable_to,
        business_id: form.business_id || null,
        valid_from: form.valid_from, valid_to: form.valid_to,
        day_of_week: form.day_of_week ? parseInt(form.day_of_week) : null,
        start_hour: form.start_hour ? parseInt(form.start_hour) : null,
        end_hour: form.end_hour ? parseInt(form.end_hour) : null,
        is_active: true, usage_count: 0,
      }
      setPromotions(prev => [newPromo, ...prev])
    } else {
      if (data) setPromotions(prev => [data, ...prev])
    }

    toast.success('¡Promoción guardada! Activa en el sitio de inmediato.')
    setForm(emptyForm)
    setShowForm(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url && url.startsWith('http')) {
      const supabase = createClient()
      await supabase.from('promotions').update({ is_active: !current }).eq('id', id)
    }
  }

  async function deletePromo(id: string) {
    setPromotions(prev => prev.filter(p => p.id !== id))
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url && url.startsWith('http') && !id.startsWith('p')) {
      const supabase = createClient()
      await supabase.from('promotions').delete().eq('id', id)
    }
    toast.success('Promoción eliminada')
  }

  return (
    <div className="space-y-5">
      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors"
        >
          <Plus size={14} />
          Nueva promoción
        </button>
      </div>

      {/* New promotion form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-white border border-brand-200 p-6 space-y-4">
              <h3 className="font-medium text-warm-900 mb-2">Nueva promoción</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Título *</span>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="ej: San Valentín 40% delivery" required
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Tipo de descuento</span>
                  <select name="discount_type" value={form.discount_type} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed_amount">Monto fijo ($)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">
                    Valor * ({form.discount_type === 'percent' ? '%' : '$'})
                  </span>
                  <input type="number" name="discount_value" value={form.discount_value} onChange={handleChange}
                    placeholder={form.discount_type === 'percent' ? '40' : '5000'} required min="1"
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Aplica a</span>
                  <select name="applicable_to" value={form.applicable_to} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="all_orders">Todos los pedidos</option>
                    <option value="delivery_only">Solo delivery</option>
                    <option value="dine_in_only">Solo en local</option>
                    <option value="reservation_only">Solo reservas</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Local (opcional)</span>
                  <select name="business_id" value={form.business_id} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="">Todos los locales</option>
                    {LOCATIONS.map(l => (
                      <option key={l.id} value={l.id}>{l.name.replace('Rishtedar ', '')}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Válido desde *</span>
                  <input type="date" name="valid_from" value={form.valid_from} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Válido hasta *</span>
                  <input type="date" name="valid_to" value={form.valid_to} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Día de la semana (opcional)</span>
                  <select name="day_of_week" value={form.day_of_week} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    <option value="">Todos los días</option>
                    {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Horario (opcional)</span>
                  <div className="flex gap-2">
                    <input type="number" name="start_hour" value={form.start_hour} onChange={handleChange}
                      placeholder="18" min="0" max="23"
                      className="w-full px-3 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                    <span className="self-center text-warm-400">—</span>
                    <input type="number" name="end_hour" value={form.end_hour} onChange={handleChange}
                      placeholder="19" min="0" max="23"
                      className="w-full px-3 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-warm-300 text-warm-600 px-5 py-2.5 text-xs tracking-widest uppercase font-medium hover:border-warm-400 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="bg-brand-700 hover:bg-brand-800 disabled:opacity-70 text-ivory px-8 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar promoción'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotions list */}
      <div className="space-y-3">
        {loading && (
          <div className="py-8 text-center text-warm-400 text-sm">Cargando promociones...</div>
        )}
        {!loading && promotions.map(promo => (
          <div key={promo.id} className={`bg-white border ${promo.is_active ? 'border-warm-200' : 'border-warm-100 opacity-60'} p-5`}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-warm-900">{promo.title}</h3>
                  <span className={`text-xs px-2 py-0.5 font-medium ${promo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-100 text-warm-500'}`}>
                    {promo.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-warm-500 mt-2">
                  <span className="flex items-center gap-1 text-brand-700 font-medium text-sm">
                    <Tag size={12} />
                    {promo.discount_type === 'percent' ? `${promo.discount_value}% OFF` : `$${promo.discount_value?.toLocaleString()} OFF`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {promo.valid_from} → {promo.valid_to}
                  </span>
                  {promo.day_of_week !== null && promo.day_of_week !== undefined && (
                    <span>Solo {DAY_NAMES[promo.day_of_week]}s</span>
                  )}
                  {promo.start_hour !== null && promo.start_hour !== undefined && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {promo.start_hour}:00–{promo.end_hour}:00
                    </span>
                  )}
                  {promo.business_id && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {LOCATIONS.find(l => l.id === promo.business_id)?.name.replace('Rishtedar ', '')}
                    </span>
                  )}
                  <span className="text-warm-400">Usado {promo.usage_count ?? 0} veces</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(promo.id!, promo.is_active!)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    promo.is_active
                      ? 'border-warm-300 text-warm-600 hover:border-red-300 hover:text-red-600'
                      : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {promo.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => deletePromo(promo.id!)}
                  className="p-1.5 text-warm-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
