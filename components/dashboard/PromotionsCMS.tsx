'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Tag, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, ChevronDown, Eye, Pencil, X } from 'lucide-react'
import { LOCATIONS } from '@/lib/locations'
import { toast } from 'sonner'
import type { Promotion } from '@/types'

const FONT_FAMILIES = [
  // ── Indias / Sur-asiáticas ──────────────────────────────────────────────
  { label: 'Yatra One',        value: 'Yatra One' },
  { label: 'Baloo 2',          value: 'Baloo 2' },
  { label: 'Rozha One',        value: 'Rozha One' },
  { label: 'Tillana',          value: 'Tillana' },
  { label: 'Hind',             value: 'Hind' },
  { label: 'Mukta',            value: 'Mukta' },
  // ── Occidentales ────────────────────────────────────────────────────────
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Montserrat',       value: 'Montserrat' },
  { label: 'Poppins',          value: 'Poppins' },
  { label: 'DM Sans',          value: 'DM Sans' },
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
  show_as_banner: boolean
  image_url: string
  font_family: string
  font_size: string
  text_color: string
  background_color: string
  overlay_opacity: string   // '0' = imagen pura · '100' = color sólido
  banner_padding: string
  border_radius: string
}

const emptyForm: FormData = {
  title: '', description: '',
  discount_type: 'percent', discount_value: '',
  applicable_to: 'all_orders', business_id: '',
  valid_from: '', valid_to: '',
  day_of_week: '', start_hour: '', end_hour: '',
  show_as_banner: false,
  image_url: '', font_family: 'Yatra One',
  font_size: '28', text_color: '#ffffff',
  background_color: '#91226f', overlay_opacity: '60',
  banner_padding: '24', border_radius: '8',
}

function promoToForm(p: Partial<Promotion>): FormData {
  return {
    title:            p.title ?? '',
    description:      p.description ?? '',
    discount_type:    p.discount_type ?? 'percent',
    discount_value:   String(p.discount_value ?? ''),
    applicable_to:    p.applicable_to ?? 'all_orders',
    business_id:      p.business_id ?? '',
    valid_from:       p.valid_from ?? '',
    valid_to:         p.valid_to ?? '',
    day_of_week:      p.day_of_week != null ? String(p.day_of_week) : '',
    start_hour:       p.start_hour != null ? String(p.start_hour) : '',
    end_hour:         p.end_hour != null ? String(p.end_hour) : '',
    show_as_banner:   p.show_as_banner ?? false,
    image_url:        p.image_url ?? '',
    font_family:      p.font_family ?? 'Yatra One',
    font_size:        String(p.font_size ?? 28),
    text_color:       p.text_color ?? '#ffffff',
    background_color: p.background_color ?? '#91226f',
    overlay_opacity:  String(p.overlay_opacity ?? 60),
    banner_padding:   String(p.banner_padding ?? 24),
    border_radius:    String(p.border_radius ?? 8),
  }
}

export function PromotionsCMS() {
  const [promotions, setPromotions]   = useState<Partial<Promotion>[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [form, setForm]               = useState<FormData>(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [uploading, setUploading]     = useState(false)

  useEffect(() => { fetchPromotions() }, [])

  async function fetchPromotions() {
    try {
      const res  = await fetch('/api/promotions')
      const data = await res.json()
      setPromotions(Array.isArray(data) ? data : [])
    } catch {
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  // ── Abrir formulario de edición ─────────────────────────────────────────
  function handleEdit(promo: Partial<Promotion>) {
    setForm(promoToForm(promo))
    setEditingId(promo.id!)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  // ── Cambios en el form ──────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/banner-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { asset_url } = await res.json()
      setForm(prev => ({ ...prev, image_url: asset_url }))
      toast.success('Imagen subida')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  // ── Guardar (create o update) ───────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.discount_value || !form.valid_from || !form.valid_to) {
      toast.error('Completa los campos requeridos')
      return
    }
    setSaving(true)

    const payload = {
      title:            form.title,
      description:      form.description || null,
      discount_type:    form.discount_type,
      discount_value:   parseFloat(form.discount_value),
      applicable_to:    form.applicable_to,
      business_id:      form.business_id || null,
      valid_from:       form.valid_from,
      valid_to:         form.valid_to,
      day_of_week:      form.day_of_week  ? parseInt(form.day_of_week)  : null,
      start_hour:       form.start_hour   ? parseInt(form.start_hour)   : null,
      end_hour:         form.end_hour     ? parseInt(form.end_hour)     : null,
      show_as_banner:   form.show_as_banner,
      image_url:        form.show_as_banner ? (form.image_url || null)      : null,
      font_family:      form.show_as_banner ? form.font_family              : null,
      font_size:        form.show_as_banner ? parseInt(form.font_size)      : null,
      text_color:       form.show_as_banner ? form.text_color               : null,
      background_color: form.show_as_banner ? form.background_color         : null,
      overlay_opacity:  form.show_as_banner ? parseInt(form.overlay_opacity): null,
      banner_padding:   form.show_as_banner ? parseInt(form.banner_padding) : null,
      border_radius:    form.show_as_banner ? parseInt(form.border_radius)  : null,
    }

    try {
      const res = await fetch('/api/promotions', {
        method:  editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      if (editingId) {
        setPromotions(prev => prev.map(p => p.id === editingId ? json : p))
        toast.success('Promoción actualizada')
      } else {
        setPromotions(prev => [json, ...prev])
        toast.success('¡Promoción guardada!')
      }
    } catch {
      toast.error(editingId ? 'Error al actualizar promoción' : 'Error al guardar promoción')
    } finally {
      setSaving(false)
      handleCancelForm()
    }
  }

  // ── Toggle activo ───────────────────────────────────────────────────────
  async function toggleActive(id: string, current: boolean) {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    try {
      await fetch('/api/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      })
    } catch {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: current } : p))
      toast.error('Error al actualizar')
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────────
  async function deletePromo(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return
    setPromotions(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/promotions?id=${id}`, { method: 'DELETE' })
      toast.success('Promoción eliminada')
    } catch {
      fetchPromotions()
      toast.error('Error al eliminar')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const isEditing = !!editingId

  return (
    <div className="space-y-5">

      {/* Botón nueva */}
      <div className="flex justify-end">
        <button
          onClick={() => showForm && !isEditing ? handleCancelForm() : (isEditing ? handleCancelForm() : setShowForm(v => !v))}
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-ivory px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors"
        >
          {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva promoción</>}
        </button>
      </div>

      {/* Formulario (crear o editar) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-white border border-brand-200 p-6 space-y-5">
              <h3 className="font-medium text-warm-900">
                {isEditing ? 'Editar promoción' : 'Nueva promoción'}
              </h3>

              {/* ── Descuento ── */}
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

              {/* ── Toggle banner ── */}
              <div className="border-t border-warm-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox" name="show_as_banner"
                    checked={form.show_as_banner} onChange={handleChange}
                    className="w-4 h-4 accent-brand-700 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-warm-800">Mostrar como banner pop-up en el sitio</span>
                    <p className="text-xs text-warm-400 mt-0.5">Aparece una vez al día mientras la promoción esté vigente</p>
                  </div>
                  <ChevronDown size={16} className={`text-warm-400 transition-transform ${form.show_as_banner ? 'rotate-180' : ''}`} />
                </label>
              </div>

              {/* ── Sección visual del banner ── */}
              <AnimatePresence>
                {form.show_as_banner && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-warm-50 border border-warm-100 rounded p-5 space-y-5">

                      {/* Descripción banner */}
                      <label className="block">
                        <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Texto del banner (opcional)</span>
                        <textarea name="description" value={form.description} onChange={handleChange}
                          placeholder="Texto secundario visible en el pop-up" rows={2}
                          className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 resize-none bg-white"
                        />
                      </label>

                      {/* Imagen + guía de dimensiones */}
                      <div className="space-y-2">
                        {/* Guía visual de dimensiones */}
                        <div className="flex items-center gap-3 bg-white border border-warm-100 rounded p-3">
                          {/* Representación visual de la proporción */}
                          <div className="shrink-0 w-16 h-9 bg-warm-100 border border-warm-200 rounded flex items-center justify-center text-[9px] text-warm-400 font-mono">
                            16:9
                          </div>
                          <div>
                            <p className="text-xs font-medium text-warm-700">Tamaño recomendado: <span className="font-mono text-brand-700">900 × 500 px</span></p>
                            <p className="text-xs text-warm-400 mt-0.5">Formato horizontal (16:9) · JPG, PNG, WebP · Máx. 5 MB</p>
                          </div>
                        </div>

                        {/* Upload */}
                        <div className="border-2 border-dashed border-warm-200 bg-white rounded p-4 hover:border-brand-300 transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <ImageIcon size={15} className="text-warm-400 shrink-0" />
                            <span className="text-sm text-warm-600">
                              {uploading ? 'Subiendo...' : form.image_url ? 'Cambiar imagen de fondo' : 'Subir imagen de fondo (opcional)'}
                            </span>
                            <input type="file" accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageUpload} disabled={uploading} className="hidden"
                            />
                          </label>
                          {form.image_url && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={form.image_url} alt="" className="w-14 h-8 object-cover rounded" style={{ aspectRatio: '16/9' }} />
                              <p className="text-xs text-emerald-600">✓ Imagen cargada como fondo</p>
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                                className="ml-auto text-xs text-warm-400 hover:text-red-500 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Slider opacidad — solo visible si hay imagen */}
                        {form.image_url && (
                          <div className="bg-white border border-warm-100 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-warm-500 text-xs uppercase tracking-wider font-medium">
                                Opacidad del color sobre la imagen
                              </span>
                              <span className="text-xs font-mono text-warm-600">{form.overlay_opacity ?? '60'}%</span>
                            </div>
                            <input
                              type="range" name="overlay_opacity" min="0" max="100"
                              value={form.overlay_opacity ?? '60'} onChange={handleChange}
                              className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-warm-400">
                              <span>0% — solo imagen</span>
                              <span>100% — solo color</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tipografía */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Tipografía</span>
                          <select name="font_family" value={form.font_family} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 bg-white"
                            style={{ fontFamily: form.font_family }}
                          >
                            <optgroup label="— Indias —">
                              {FONT_FAMILIES.slice(0, 6).map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="— Occidentales —">
                              {FONT_FAMILIES.slice(6).map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </optgroup>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">
                            Tamaño — {form.font_size}px
                          </span>
                          <input type="range" name="font_size" min="16" max="52"
                            value={form.font_size} onChange={handleChange}
                            className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer mt-3"
                          />
                        </label>
                      </div>

                      {/* Colores */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Color de texto</span>
                          <div className="flex items-center gap-3">
                            <input type="color" name="text_color" value={form.text_color} onChange={handleChange}
                              className="w-12 h-9 cursor-pointer rounded border border-warm-200" />
                            <span className="text-xs text-warm-400 font-mono">{form.text_color}</span>
                          </div>
                        </label>
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Color de fondo</span>
                          <div className="flex items-center gap-3">
                            <input type="color" name="background_color" value={form.background_color} onChange={handleChange}
                              className="w-12 h-9 cursor-pointer rounded border border-warm-200" />
                            <span className="text-xs text-warm-400 font-mono">{form.background_color}</span>
                          </div>
                        </label>
                      </div>

                      {/* Espaciado */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Padding — {form.banner_padding}px</span>
                          <input type="range" name="banner_padding" min="8" max="48"
                            value={form.banner_padding} onChange={handleChange}
                            className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer mt-3" />
                        </label>
                        <label className="block">
                          <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block">Bordes — {form.border_radius}px</span>
                          <input type="range" name="border_radius" min="0" max="24"
                            value={form.border_radius} onChange={handleChange}
                            className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer mt-3" />
                        </label>
                      </div>

                      {/* Preview — imagen como fondo */}
                      <div>
                        <p className="text-xs text-warm-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                          <Eye size={11} /> Vista previa del pop-up
                        </p>
                        <div
                          className="relative overflow-hidden"
                          style={{
                            borderRadius: `${form.border_radius}px`,
                            minHeight: '140px',
                            backgroundColor: form.background_color,  // ← base sólida
                          }}
                        >
                          {/* Capa 1: imagen de fondo */}
                          {form.image_url && (
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url('${form.image_url}')` }}
                            />
                          )}
                          {/* Capa 2: color sobre la imagen, solo si hay imagen */}
                          {form.image_url && (
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundColor: form.background_color,
                                opacity: parseInt(form.overlay_opacity ?? '60') / 100,
                              }}
                            />
                          )}
                          {/* Capa 3: contenido */}
                          <div
                            className="relative z-10"
                            style={{
                              padding:    `${form.banner_padding}px`,
                              fontFamily: form.font_family,
                              color:      form.text_color,
                              fontSize:   `${form.font_size}px`,
                            }}
                          >
                            <div className="font-bold leading-tight">
                              {form.title || 'Título de la promoción'}
                            </div>
                            {form.description && (
                              <div className="mt-1 opacity-85" style={{ fontSize: `${Math.max(12, parseInt(form.font_size) - 8)}px` }}>
                                {form.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCancelForm}
                  className="border border-warm-300 text-warm-600 px-5 py-2.5 text-xs tracking-widest uppercase font-medium hover:border-warm-400 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving || uploading}
                  className="bg-brand-700 hover:bg-brand-800 disabled:opacity-70 text-ivory px-8 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors"
                >
                  {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar promoción'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="space-y-3">
        {loading && (
          <div className="py-8 text-center text-warm-400 text-sm">Cargando promociones...</div>
        )}
        {!loading && promotions.length === 0 && (
          <div className="py-12 text-center text-warm-400 text-sm border border-dashed border-warm-200">
            No hay promociones creadas. Agrega la primera.
          </div>
        )}
        {!loading && promotions.map(promo => (
          <div
            key={promo.id}
            className={`bg-white border ${promo.is_active ? 'border-warm-200' : 'border-warm-100 opacity-60'} p-5`}
          >
            <div className="flex items-start gap-4">

              {/* Miniatura banner */}
              {promo.show_as_banner && (
                <div
                  className="shrink-0 w-12 h-12 rounded overflow-hidden flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundImage: promo.image_url ? `url('${promo.image_url}')` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: promo.background_color ?? '#91226f',
                    color: promo.text_color ?? '#fff',
                    fontFamily: promo.font_family ?? 'Yatra One',
                  }}
                >
                  {!promo.image_url && 'Aa'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-warm-900">{promo.title}</h3>
                  <span className={`text-xs px-2 py-0.5 font-medium ${promo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-100 text-warm-500'}`}>
                    {promo.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  {promo.show_as_banner && (
                    <span className="text-xs px-2 py-0.5 font-medium bg-brand-50 text-brand-700">
                      Banner pop-up
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-warm-500 mt-1.5">
                  <span className="flex items-center gap-1 text-brand-700 font-medium text-sm">
                    <Tag size={12} />
                    {promo.discount_type === 'percent'
                      ? `${promo.discount_value}% OFF`
                      : `$${promo.discount_value?.toLocaleString()} OFF`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {promo.valid_from} → {promo.valid_to}
                  </span>
                  {promo.day_of_week != null && (
                    <span>Solo {DAY_NAMES[promo.day_of_week]}s</span>
                  )}
                  {promo.start_hour != null && (
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

              {/* Acciones */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleEdit(promo)}
                  className="p-1.5 text-warm-400 hover:text-brand-700 transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
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
                  title="Eliminar"
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
