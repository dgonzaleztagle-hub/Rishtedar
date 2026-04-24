'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Image as ImageIcon, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { PromotionalBanner } from '@/types'

// Google Fonts - Indian focused
const FONT_FAMILIES = [
  { label: 'Poppins', value: 'Poppins' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Outfit', value: 'Outfit' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Inter', value: 'Inter' },
  { label: 'System', value: 'system-ui' },
]


type FormData = {
  title: string
  description: string
  image_url: string
  font_family: string
  font_size: string
  text_color: string
  background_color: string
  padding: string
  border_radius: string
}

const emptyForm: FormData = {
  title: '',
  description: '',
  image_url: '',
  font_family: 'Poppins',
  font_size: '24',
  text_color: '#000000',
  background_color: '#ffffff',
  padding: '20',
  border_radius: '8',
}

export function BannersCMS() {
  const [banners, setBanners] = useState<Partial<PromotionalBanner>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  async function fetchBanners() {
    try {
      const res = await fetch('/api/banners')
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch {
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/banner-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const { asset_url } = await res.json()
      setForm(prev => ({ ...prev, image_url: asset_url }))
      toast.success('Imagen subida correctamente')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) {
      toast.error('El título es requerido')
      return
    }

    setSaving(true)

    try {
      const payload: Partial<PromotionalBanner> = {
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        font_family: form.font_family,
        font_size: parseInt(form.font_size),
        text_color: form.text_color,
        background_color: form.background_color,
        padding: parseInt(form.padding),
        border_radius: parseInt(form.border_radius),
      }

      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Error saving')
      }

      const data = await res.json()
      setBanners(prev => [data, ...prev])
      toast.success('¡Banner creado! Activo de inmediato.')
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Error al guardar banner')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))

    try {
      await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      })
    } catch (err) {
      console.error('Toggle error:', err)
      setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: current } : b))
      toast.error('Error al actualizar')
    }
  }

  async function deleteBanner(id: string) {
    setBanners(prev => prev.filter(b => b.id !== id))
    try {
      await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      toast.success('Banner eliminado')
    } catch (err) {
      console.error('Delete error:', err)
      fetchBanners()
      toast.error('Error al eliminar')
    }
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
          Nuevo banner
        </button>
      </div>

      {/* New banner form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-white border border-brand-200 p-6 space-y-5">
              <h3 className="font-medium text-warm-900 mb-4">Nuevo banner</h3>

              {/* Basic Info */}
              <div className="space-y-4">
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">Título *</span>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="ej: Promoción especial"
                    required
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                </label>

                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">Descripción</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Texto adicional para el banner"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400 resize-none"
                  />
                </label>
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-warm-200 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon size={16} className="text-warm-400" />
                  <span className="text-sm text-warm-600">
                    {uploading ? 'Subiendo...' : form.image_url ? 'Cambiar imagen' : 'Subir imagen'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {form.image_url && (
                  <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    ✓ Imagen cargada
                  </div>
                )}
              </div>

              {/* Typography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">Tipografía</span>
                  <select
                    name="font_family"
                    value={form.font_family}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-warm-200 text-sm focus:outline-none focus:border-brand-400"
                  >
                    {FONT_FAMILIES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">
                    Tamaño de fuente ({form.font_size}px)
                  </span>
                  <input
                    type="range"
                    name="font_size"
                    min="12"
                    max="48"
                    value={form.font_size}
                    onChange={handleChange}
                    className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">Color de texto</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="text_color"
                      value={form.text_color}
                      onChange={handleChange}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-xs text-warm-400">{form.text_color}</span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">Color de fondo</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="background_color"
                      value={form.background_color}
                      onChange={handleChange}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <span className="text-xs text-warm-400">{form.background_color}</span>
                  </div>
                </label>
              </div>

              {/* Spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">
                    Padding ({form.padding}px)
                  </span>
                  <input
                    type="range"
                    name="padding"
                    min="0"
                    max="40"
                    value={form.padding}
                    onChange={handleChange}
                    className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>

                <label className="block">
                  <span className="text-warm-500 text-xs uppercase tracking-wider mb-1.5 block font-medium">
                    Border radius ({form.border_radius}px)
                  </span>
                  <input
                    type="range"
                    name="border_radius"
                    min="0"
                    max="20"
                    value={form.border_radius}
                    onChange={handleChange}
                    className="w-full h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>

              {/* Preview */}
              <div className="bg-warm-50 p-4 rounded border border-warm-100">
                <p className="text-xs text-warm-500 uppercase tracking-wider font-medium mb-2">Vista previa</p>
                <div
                  style={{
                    backgroundColor: form.background_color,
                    color: form.text_color,
                    fontFamily: form.font_family,
                    fontSize: `${form.font_size}px`,
                    padding: `${form.padding}px`,
                    borderRadius: `${form.border_radius}px`,
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="mb-2 rounded max-h-20 object-cover w-full"
                    />
                  )}
                  <div className="font-bold">{form.title || 'Tu título aquí'}</div>
                  {form.description && (
                    <div className="text-sm opacity-80 mt-1">{form.description}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-warm-300 text-warm-600 px-5 py-2.5 text-xs tracking-widest uppercase font-medium hover:border-warm-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-brand-700 hover:bg-brand-800 disabled:opacity-70 text-ivory px-8 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar banner'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners list */}
      <div className="space-y-3">
        {loading && (
          <div className="py-8 text-center text-warm-400 text-sm">Cargando banners...</div>
        )}
        {!loading && banners.length === 0 && (
          <div className="py-12 text-center text-warm-400 text-sm border border-dashed border-warm-200">
            No hay banners creados. Agrega el primero.
          </div>
        )}
        {!loading && banners.map(banner => (
          <div key={banner.id} className={`bg-white border ${banner.is_active ? 'border-warm-200' : 'border-warm-100 opacity-60'} p-5`}>
            <div className="flex items-start gap-4">
              {/* Preview thumbnail */}
              {banner.image_url && (
                <div className="shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-warm-900">{banner.title}</h3>
                  <span className={`text-xs px-2 py-0.5 font-medium ${
                    banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-100 text-warm-500'
                  }`}>
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {banner.description && (
                  <p className="text-sm text-warm-600 mb-2">{banner.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-warm-500">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {banner.font_family}, {banner.font_size}px
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(banner.id!, banner.is_active!)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    banner.is_active
                      ? 'border-warm-300 text-warm-600 hover:border-red-300 hover:text-red-600'
                      : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {banner.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => deleteBanner(banner.id!)}
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
