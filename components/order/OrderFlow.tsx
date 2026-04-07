'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, ShoppingBag, Tag, ChevronDown, CheckCircle2,
  Leaf, Wheat, Flame, Plus, Minus, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { LOCATIONS } from '@/lib/locations'
import { useCartStore } from '@/lib/store/cart'
import { useActivePromotion } from '@/hooks/useActivePromotion'
import { useNearestLocation } from '@/hooks/useNearestLocation'
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS } from '@/lib/data/menu-demo'
import { CartDrawer } from './CartDrawer'
import { ItemDetailSheet, CATEGORY_STYLES } from './ItemDetailSheet'
import { formatCLP, formatDistance } from '@/lib/utils'
import type { MenuItem } from '@/types'

// ─── dietary icons ────────────────────────────────────────────────────────────

const DIETARY_ICONS: Record<string, { icon: typeof Leaf; color: string }> = {
  vegetarian:    { icon: Leaf,  color: 'text-emerald-500' },
  vegan:         { icon: Leaf,  color: 'text-emerald-600' },
  'gluten-free': { icon: Wheat, color: 'text-amber-500' },
  spicy:         { icon: Flame, color: 'text-red-400' },
}

// ─── category sidebar icons (emoji) ──────────────────────────────────────────

const CAT_EMOJIS: Record<string, string> = {
  'cat-entradas':    '🥗',
  'cat-principales': '🍛',
  'cat-tandoor':     '🔥',
  'cat-biryani':     '🍚',
  'cat-vegetariano': '🌿',
  'cat-postres':     '🍮',
  'cat-bebidas':     '☕',
}

// ─── main component ───────────────────────────────────────────────────────────

export function OrderFlow({ initialLocal }: { initialLocal?: string }) {
  const activeLocations = LOCATIONS.filter(l => l.is_active)
  const validInitial = initialLocal && activeLocations.some(l => l.id === initialLocal) ? initialLocal : null

  const [confirmedLocal, setConfirmedLocal] = useState<string | null>(validInitial)
  const [showModal, setShowModal]             = useState(!validInitial)
  const [modalPickerId, setModalPickerId]     = useState<string | null>(null)
  const [showPicker, setShowPicker]           = useState(false)
  const [cartOpen, setCartOpen]               = useState(false)
  const [activeCategory, setActiveCategory]   = useState<string | null>(null)
  const [selectedItem, setSelectedItem]       = useState<MenuItem | null>(null)

  const { location: nearest, distance } = useNearestLocation()
  const cartItems  = useCartStore(s => s.items)
  const itemCount  = useCartStore(s => s.itemCount())
  const total      = useCartStore(s => s.total())
  const addItem    = useCartStore(s => s.addItem)
  const updateQty  = useCartStore(s => s.updateQty)
  const setBusinessId = useCartStore(s => s.setBusinessId)

  useEffect(() => {
    if (nearest && !modalPickerId && !confirmedLocal) setModalPickerId(nearest.id)
  }, [nearest, modalPickerId, confirmedLocal])

  const activeLocalId   = confirmedLocal || nearest?.id || 'providencia'
  const activeLocalData = activeLocations.find(l => l.id === activeLocalId)
  const { promotion }   = useActivePromotion(activeLocalId)

  function confirmLocal(id: string) {
    setConfirmedLocal(id)
    setBusinessId(id)
    setShowModal(false)
  }

  // Group items by category for section headers
  const categoriesToShow = activeCategory
    ? DEMO_CATEGORIES.filter(c => c.id === activeCategory)
    : DEMO_CATEGORIES

  return (
    <>
      {/* ── LOCATION MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0"
          >
            <div className="absolute inset-0 bg-warm-950/75 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-warm-950 border border-warm-800 p-8"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-600/60 to-transparent" />
              <p className="text-gold-600 text-[10px] tracking-[0.3em] uppercase mb-2">Delivery</p>
              <h2 className="font-display text-3xl italic text-ivory mb-1">
                {nearest ? '¿Pedimos desde aquí?' : 'Elige tu local'}
              </h2>
              <div className="mt-6 mb-6">
                <button
                  onClick={() => setShowPicker(v => !v)}
                  className="w-full flex items-center justify-between gap-3 border border-warm-700 hover:border-warm-500 px-4 py-3.5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={15} className="text-brand-400 shrink-0" />
                    <div className="text-left">
                      {modalPickerId ? (
                        <>
                          <p className="text-ivory text-sm font-medium">
                            {activeLocations.find(l => l.id === modalPickerId)?.name.replace('Rishtedar ', '')}
                          </p>
                          <p className="text-warm-500 text-xs">
                            {activeLocations.find(l => l.id === modalPickerId)?.address}
                          </p>
                        </>
                      ) : (
                        <p className="text-warm-400 text-sm">Detectando ubicación...</p>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-warm-500 transition-transform shrink-0 ${showPicker ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="border border-t-0 border-warm-700 bg-warm-900 divide-y divide-warm-800"
                    >
                      {activeLocations.map(loc => (
                        <button
                          key={loc.id}
                          onClick={() => { setModalPickerId(loc.id); setShowPicker(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-warm-800 transition-colors ${modalPickerId === loc.id ? 'bg-warm-800' : ''}`}
                        >
                          {modalPickerId === loc.id
                            ? <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
                            : <div className="w-3.5 h-3.5 rounded-full border border-warm-600 shrink-0" />
                          }
                          <div>
                            <p className="text-ivory text-sm">{loc.name.replace('Rishtedar ', '')}</p>
                            <p className="text-warm-500 text-xs">{loc.address}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => modalPickerId && confirmLocal(modalPickerId)}
                disabled={!modalPickerId}
                className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-ivory py-4 text-xs tracking-widest uppercase font-medium transition-colors mb-3"
              >
                Confirmar local →
              </button>
              {nearest && (
                <p className="text-warm-600 text-xs text-center">
                  Basado en tu ubicación actual{distance !== null && ` · ${formatDistance(distance)} de distancia`}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3-COLUMN LAYOUT ─────────────────────────────────────────── */}
      <div className="flex min-h-screen bg-ivory">

        {/* ── LEFT: category sidebar (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-warm-950 border-r border-warm-800 sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Local chip */}
          <div className="px-5 py-5 border-b border-warm-800">
            {activeLocalData && (
              <div>
                <p className="text-warm-500 text-[10px] tracking-widest uppercase mb-1">Entregando desde</p>
                <p className="text-ivory text-sm font-medium leading-tight">
                  {activeLocalData.name.replace('Rishtedar ', '')}
                </p>
                <button
                  onClick={() => { setModalPickerId(activeLocalId); setShowPicker(false); setShowModal(true) }}
                  className="text-brand-400 text-[10px] tracking-wider uppercase mt-1 hover:text-brand-300 transition-colors"
                >
                  Cambiar →
                </button>
              </div>
            )}
          </div>

          {/* Promo */}
          {promotion && (
            <div className="mx-4 mt-4 px-3 py-2.5 bg-brand-900/40 border border-brand-800">
              <p className="text-brand-300 text-[10px] tracking-wider uppercase font-medium">
                {promotion.discount_type === 'percent'
                  ? `${promotion.discount_value}% OFF`
                  : `${formatCLP(promotion.discount_value)} OFF`}
              </p>
              <p className="text-warm-400 text-[10px] mt-0.5 leading-tight">{promotion.title}</p>
            </div>
          )}

          {/* Categories */}
          <nav className="flex-1 py-4">
            <p className="text-warm-600 text-[9px] tracking-[0.25em] uppercase px-5 mb-2">La carta</p>
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left text-xs tracking-wider uppercase font-medium transition-colors ${
                !activeCategory
                  ? 'text-ivory bg-warm-800 border-l-2 border-brand-500'
                  : 'text-warm-500 hover:text-warm-300 hover:bg-warm-900/50'
              }`}
            >
              <span className="text-base">🍽️</span>
              Todo
            </button>
            {DEMO_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left text-xs tracking-wider uppercase font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'text-ivory bg-warm-800 border-l-2 border-brand-500'
                    : 'text-warm-500 hover:text-warm-300 hover:bg-warm-900/50'
                }`}
              >
                <span className="text-base">{CAT_EMOJIS[cat.id] ?? '🍽️'}</span>
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── CENTER: menu ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile top bar */}
          <div className="lg:hidden border-b border-warm-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={13} className="text-brand-500 shrink-0" />
              <span className="text-warm-700 text-sm truncate">
                {activeLocalData?.name.replace('Rishtedar ', '') ?? 'Selecciona local'}
              </span>
            </div>
            <button
              onClick={() => { setModalPickerId(activeLocalId); setShowPicker(false); setShowModal(true) }}
              className="shrink-0 text-[10px] tracking-wider uppercase border border-warm-200 text-warm-500 hover:border-brand-400 hover:text-brand-700 px-3 py-1.5 transition-colors"
            >
              Cambiar
            </button>
          </div>

          {/* Mobile category scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-warm-100">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-all ${
                !activeCategory ? 'bg-warm-900 text-ivory border-warm-900' : 'border-warm-200 text-warm-500'
              }`}
            >
              🍽️ Todo
            </button>
            {DEMO_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-all ${
                  activeCategory === cat.id ? 'bg-warm-900 text-ivory border-warm-900' : 'border-warm-200 text-warm-500'
                }`}
              >
                {CAT_EMOJIS[cat.id]} {cat.name}
              </button>
            ))}
          </div>

          {/* Mobile promo banner */}
          {promotion && (
            <div className="lg:hidden flex items-center gap-2 bg-brand-50 border-b border-brand-100 px-4 py-2.5">
              <Tag size={13} className="text-brand-600 shrink-0" />
              <p className="text-brand-800 text-xs">
                <span className="font-medium">
                  {promotion.discount_type === 'percent' ? `${promotion.discount_value}% OFF` : `${formatCLP(promotion.discount_value)} OFF`}
                </span>
                {' — '}{promotion.title}
              </p>
            </div>
          )}

          {/* Menu sections */}
          <div className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-10">
            {/* Page title (desktop) */}
            <div className="hidden lg:block mb-8">
              <h1 className="font-display text-4xl italic text-warm-950">La carta</h1>
              <p className="text-warm-500 text-sm mt-1">
                Selecciona un plato para ver los detalles
              </p>
            </div>

            {categoriesToShow.map(cat => {
              const items = DEMO_MENU_ITEMS.filter(i => i.is_active && i.category_id === cat.id)
              if (!items.length) return null
              const catStyle = CATEGORY_STYLES[cat.id] ?? { emoji: '🍽️', gradient: '' }

              return (
                <section key={cat.id} className="mb-10">
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{catStyle.emoji}</span>
                    <h2 className="font-display text-2xl italic text-warm-900">{cat.name}</h2>
                    <div className="flex-1 h-px bg-warm-200" />
                    <span className="text-warm-400 text-xs">{items.length} platos</span>
                  </div>

                  {/* Item grid — 2 cols on md+, 1 col on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map(item => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        onOpenDetail={() => setSelectedItem(item)}
                        onQuickAdd={() => addItem(item)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: cart (desktop) ── */}
        <aside className="hidden lg:block w-80 shrink-0 border-l border-warm-200 bg-white sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="p-6">
            <h3 className="flex items-center gap-2 font-medium text-warm-900 mb-5 pb-4 border-b border-warm-100">
              <ShoppingBag size={16} className="text-brand-700" />
              Tu pedido
              {itemCount > 0 && (
                <span className="ml-auto bg-brand-700 text-ivory text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </h3>

            {cartItems.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-warm-400 text-sm">Selecciona un plato para comenzar</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5 max-h-[calc(100vh-22rem)] overflow-y-auto">
                  {cartItems.map(ci => (
                    <div key={ci.menu_item.id} className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-warm-800 text-sm font-medium leading-tight truncate">{ci.menu_item.name}</p>
                        <p className="text-warm-400 text-xs mt-0.5">{formatCLP(ci.menu_item.price)} c/u</p>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateQty(ci.menu_item.id, ci.quantity - 1)}
                          className="w-6 h-6 border border-warm-200 flex items-center justify-center hover:border-brand-300 text-warm-500 hover:text-brand-700 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-5 text-center text-xs font-medium text-warm-900">{ci.quantity}</span>
                        <button
                          onClick={() => addItem(ci.menu_item)}
                          className="w-6 h-6 bg-brand-700 text-ivory flex items-center justify-center hover:bg-brand-800 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="text-warm-700 text-sm shrink-0 w-16 text-right">
                        {formatCLP(ci.menu_item.price * ci.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-warm-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-warm-500">
                    <span>Subtotal</span>
                    <span>{formatCLP(useCartStore.getState().subtotal())}</span>
                  </div>
                  {useCartStore.getState().discount() > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Descuento</span>
                      <span>−{formatCLP(useCartStore.getState().discount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-warm-900 pt-2 border-t border-warm-100">
                    <span>Total</span>
                    <span className="font-display text-xl text-gold-600">{formatCLP(total)}</span>
                  </div>
                </div>

                <Link
                  href="/order/checkout"
                  className="flex items-center justify-center gap-2 w-full bg-brand-700 hover:bg-brand-800 text-ivory py-3.5 text-xs tracking-widest uppercase font-medium transition-colors"
                >
                  Ir al checkout
                  <ArrowRight size={13} />
                </Link>
                <p className="text-warm-400 text-[10px] text-center mt-2">
                  Apple Pay · Google Pay · Tarjetas
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── MOBILE FLOATING CART ── */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="lg:hidden fixed bottom-6 left-4 right-4 z-30"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between bg-brand-700 hover:bg-brand-800 text-ivory px-5 py-4 shadow-xl shadow-brand-900/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} />
                <span className="text-sm font-medium">{itemCount} {itemCount === 1 ? 'plato' : 'platos'}</span>
              </div>
              <span className="font-display text-lg text-gold-300">{formatCLP(total)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  )
}

// ─── menu card ────────────────────────────────────────────────────────────────

function MenuCard({
  item,
  onOpenDetail,
  onQuickAdd,
}: {
  item: MenuItem
  onOpenDetail: () => void
  onQuickAdd: () => void
}) {
  const cartItem = useCartStore(s => s.items.find(i => i.menu_item.id === item.id))
  const updateQty = useCartStore(s => s.updateQty)
  const catStyle  = CATEGORY_STYLES[item.category_id] ?? { gradient: 'from-warm-900 via-warm-800 to-warm-950', emoji: '🍽️' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-warm-200 hover:border-warm-300 hover:shadow-md transition-all duration-300 group cursor-pointer overflow-hidden"
      onClick={onOpenDetail}
    >
      {/* Image area */}
      <div
        className="h-36 relative flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${
            catStyle.gradient
              .replace('from-[', '').replace('] via-[', ', ').replace('] to-[', ', ').replace(']', '')
          })`,
        }}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <span className="relative text-5xl select-none group-hover:scale-110 transition-transform duration-300">
          {catStyle.emoji}
        </span>

        {/* In-cart badge */}
        {cartItem && (
          <div className="absolute top-2.5 left-2.5 bg-brand-700 text-ivory text-[9px] font-medium tracking-wider px-2 py-0.5">
            {cartItem.quantity} en carrito
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-2.5 right-2.5 bg-black/50 backdrop-blur-sm px-2 py-0.5">
          <span className="font-display text-sm text-gold-400">{formatCLP(item.price)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display text-lg italic text-warm-950 leading-tight group-hover:text-brand-700 transition-colors">
            {item.name}
          </h3>
          <div className="flex gap-1 shrink-0 mt-0.5">
            {item.dietary_tags.slice(0, 2).map(tag => {
              const info = DIETARY_ICONS[tag]
              if (!info) return null
              const Icon = info.icon
              return <Icon key={tag} size={12} className={info.color} />
            })}
          </div>
        </div>
        <p className="text-warm-400 text-xs leading-relaxed line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* Quick add / qty — stop propagation so it doesn't open the sheet */}
        <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <span className="text-warm-400 text-[10px] tracking-wider uppercase">Ver detalles →</span>
          {cartItem ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQty(item.id, cartItem.quantity - 1)}
                className="w-7 h-7 border border-warm-200 flex items-center justify-center hover:border-brand-300 text-warm-500 hover:text-brand-700 transition-colors"
              >
                <Minus size={11} />
              </button>
              <span className="w-5 text-center text-xs font-medium text-warm-900">{cartItem.quantity}</span>
              <button
                onClick={onQuickAdd}
                className="w-7 h-7 bg-brand-700 text-ivory flex items-center justify-center hover:bg-brand-800 transition-colors"
              >
                <Plus size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={onQuickAdd}
              className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-ivory px-3.5 py-1.5 text-[10px] tracking-widest uppercase font-medium transition-colors"
            >
              <Plus size={11} />
              Añadir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
