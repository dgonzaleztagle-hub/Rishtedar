'use client'

import { useState } from 'react'
import { UtensilsCrossed, Eye, EyeOff, Edit2, Plus, Search, Tag } from 'lucide-react'
import { formatCLP } from '@/lib/utils'

interface MenuItem {
  id: string
  category: string
  name: string
  description: string
  price: number
  active: boolean
  dietary: string[]
  sold_today: number
}

const DEMO_MENU: MenuItem[] = [
  // Entradas
  { id: 'm1', category: 'Entradas', name: 'Samosa (2 unidades)', description: 'Empanadillas crujientes rellenas de papa y arvejas especiadas', price: 6900, active: true, dietary: ['vegetariano'], sold_today: 18 },
  { id: 'm2', category: 'Entradas', name: 'Onion Bhaji', description: 'Fritos de cebolla con especias y yogurt de menta', price: 7400, active: true, dietary: ['vegetariano', 'vegan'], sold_today: 9 },
  { id: 'm3', category: 'Entradas', name: 'Chicken Tikka Starter', description: 'Trozos de pollo marinados en yogurt y especias tandoor', price: 9800, active: true, dietary: ['sin gluten'], sold_today: 14 },
  // Principales
  { id: 'm4', category: 'Principales', name: 'Chicken Tikka Masala', description: 'Pollo en salsa cremosa de tomate con especias aromáticas', price: 17900, active: true, dietary: ['sin gluten'], sold_today: 34 },
  { id: 'm5', category: 'Principales', name: 'Lamb Rogan Josh', description: 'Cordero estofado con especias cachemiras y yogurt', price: 21000, active: true, dietary: ['sin gluten'], sold_today: 28 },
  { id: 'm6', category: 'Principales', name: 'Butter Chicken', description: 'Pollo en salsa de mantequilla y tomate, suave y aromático', price: 19000, active: true, dietary: [], sold_today: 26 },
  { id: 'm7', category: 'Principales', name: 'Palak Paneer', description: 'Queso fresco en salsa cremosa de espinacas', price: 15900, active: true, dietary: ['vegetariano', 'sin gluten'], sold_today: 11 },
  { id: 'm8', category: 'Principales', name: 'Dal Makhani', description: 'Lentejas negras en mantequilla, cremosas y especiadas', price: 12000, active: true, dietary: ['vegetariano', 'vegan'], sold_today: 14 },
  // Tandoor
  { id: 'm9', category: 'Tandoor', name: 'Tandoori Mixed Grill', description: 'Selección de pollo, cordero y gambas del horno tandoor', price: 30000, active: true, dietary: ['sin gluten'], sold_today: 15 },
  { id: 'm10', category: 'Tandoor', name: 'Paneer Tikka', description: 'Queso fresco asado con pimientos y especias', price: 15000, active: true, dietary: ['vegetariano', 'sin gluten'], sold_today: 19 },
  // Biryani
  { id: 'm11', category: 'Biryani', name: 'Biryani Pollo', description: 'Arroz basmati perfumado con azafrán y especias, con pollo', price: 18000, active: true, dietary: ['sin gluten'], sold_today: 22 },
  { id: 'm12', category: 'Biryani', name: 'Biryani Vegetariano', description: 'Arroz basmati con verduras y especias tradicionales', price: 15000, active: false, dietary: ['vegetariano', 'vegan', 'sin gluten'], sold_today: 0 },
  // Postres
  { id: 'm13', category: 'Postres', name: 'Gulab Jamun', description: 'Bolitas de leche en almíbar de cardamomo y agua de rosas', price: 8000, active: true, dietary: ['vegetariano'], sold_today: 41 },
  { id: 'm14', category: 'Postres', name: 'Kulfi Mango', description: 'Helado indio de mango con pistachos', price: 7500, active: true, dietary: ['vegetariano', 'sin gluten'], sold_today: 16 },
  // Bebidas
  { id: 'm15', category: 'Bebidas', name: 'Lassi Mango', description: 'Yogurt batido con mango y cardamomo', price: 5900, active: true, dietary: ['vegetariano', 'sin gluten'], sold_today: 24 },
  { id: 'm16', category: 'Bebidas', name: 'Chai Masala', description: 'Té especiado con leche y cardamomo, tradición india', price: 4500, active: true, dietary: ['vegetariano'], sold_today: 38 },
]

const DIETARY_COLORS: Record<string, string> = {
  'vegetariano': 'bg-green-50 text-green-700',
  'vegan': 'bg-emerald-50 text-emerald-700',
  'sin gluten': 'bg-yellow-50 text-yellow-700',
  'picante': 'bg-red-50 text-red-600',
  'frutos secos': 'bg-orange-50 text-orange-700',
}

export function MenuView() {
  const [items, setItems] = useState(DEMO_MENU)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')

  const categories = ['Todos', ...Array.from(new Set(DEMO_MENU.map(i => i.category)))]

  function toggleActive(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
  }

  const filtered = items.filter(item => {
    const matchCat = categoryFilter === 'Todos' || item.category === categoryFilter
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = categories.slice(1).reduce<Record<string, MenuItem[]>>((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  const activeCount = items.filter(i => i.active).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-warm-900">Menú</h1>
          <p className="text-warm-500 text-sm mt-0.5">{activeCount} platos activos · {items.length - activeCount} ocultos</p>
        </div>
        <div title="Disponible en producción — la edición de menú se conecta a DB en la siguiente fase">
          <button disabled className="flex items-center gap-2 bg-brand-800 text-ivory text-sm px-4 py-2.5 opacity-40 cursor-not-allowed">
            <Plus size={14} />
            Agregar plato
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar plato..."
            className="w-full pl-9 pr-4 py-2.5 border border-warm-200 bg-white text-sm text-warm-800 placeholder:text-warm-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 text-xs transition-colors ${
                categoryFilter === cat
                  ? 'bg-brand-800 text-ivory'
                  : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu groups */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white border border-warm-200">
          <div className="px-5 py-3 border-b border-warm-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={14} className="text-brand-700" />
              <h2 className="font-medium text-warm-900 text-sm">{cat}</h2>
              <span className="text-warm-400 text-xs">{catItems.length} platos</span>
            </div>
            <Tag size={12} className="text-warm-400" />
          </div>
          <div className="divide-y divide-warm-50">
            {catItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${!item.active ? 'opacity-50' : 'hover:bg-warm-50'}`}
              >
                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(item.id)}
                  className={`shrink-0 transition-colors ${item.active ? 'text-emerald-600 hover:text-emerald-700' : 'text-warm-300 hover:text-warm-500'}`}
                >
                  {item.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-warm-900 text-sm">{item.name}</span>
                    {item.dietary.map(tag => (
                      <span key={tag} className={`text-[9px] px-1.5 py-0.5 font-medium ${DIETARY_COLORS[tag] || 'bg-warm-100 text-warm-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-warm-400 text-xs mt-0.5 truncate">{item.description}</p>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-warm-800 font-medium text-sm">{formatCLP(item.price)}</p>
                  {item.sold_today > 0 && (
                    <p className="text-warm-400 text-xs">{item.sold_today} hoy</p>
                  )}
                </div>

                {/* Edit */}
                <button
                  disabled
                  title="Disponible en producción — la edición de menú se conecta a DB en la siguiente fase"
                  className="shrink-0 p-1.5 text-warm-200 cursor-not-allowed"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="bg-white border border-warm-200 px-6 py-12 text-center text-warm-400 text-sm">
          No hay platos que coincidan con la búsqueda
        </div>
      )}
    </div>
  )
}
