import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem, Promotion } from '@/types'

interface CartState {
  items: CartItem[]
  businessId: string | null
  appliedPromotion: Promotion | null

  // Actions
  addItem: (item: MenuItem, qty?: number, instructions?: string) => void
  removeItem: (menuItemId: string) => void
  updateQty: (menuItemId: string, qty: number) => void
  setPromotion: (promo: Promotion | null) => void
  setBusinessId: (id: string) => void
  clear: () => void

  // Computed (as selectors)
  subtotal: () => number
  discount: () => number
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      businessId: null,
      appliedPromotion: null,

      addItem: (item, qty = 1, instructions) => {
        set(state => {
          const existing = state.items.find(i => i.menu_item.id === item.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.menu_item.id === item.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { menu_item: item, quantity: qty, special_instructions: instructions }],
          }
        })
      },

      removeItem: (menuItemId) => {
        set(state => ({
          items: state.items.filter(i => i.menu_item.id !== menuItemId),
        }))
      },

      updateQty: (menuItemId, qty) => {
        if (qty <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.menu_item.id === menuItemId ? { ...i, quantity: qty } : i
          ),
        }))
      },

      setPromotion: (promo) => set({ appliedPromotion: promo }),

      setBusinessId: (id) => set({ businessId: id }),

      clear: () => set({ items: [], appliedPromotion: null }),

      subtotal: () => {
        const { items } = get()
        return items.reduce((sum, i) => sum + i.menu_item.price * i.quantity, 0)
      },

      discount: () => {
        const { appliedPromotion } = get()
        if (!appliedPromotion) return 0
        const sub = get().subtotal()
        if (appliedPromotion.discount_type === 'percent') {
          return Math.round(sub * (appliedPromotion.discount_value / 100))
        }
        return Math.min(appliedPromotion.discount_value, sub)
      },

      total: () => get().subtotal() - get().discount(),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'rishtedar-cart',
      partialize: (state) => ({
        items: state.items,
        businessId: state.businessId,
        appliedPromotion: state.appliedPromotion,
      }),
    }
  )
)
