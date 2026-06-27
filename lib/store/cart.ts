'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  slug: string
  title: string
  image: string
  price: number
  quantity: number
  variant?: string
  availableStock?: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  replaceCart: (item: CartItem) => void
  removeItem: (id: string, variant?: string) => void
  updateQuantity: (id: string, quantity: number, variant?: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const isFinitePositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const normalizeQuantity = (quantity: unknown, availableStock?: number) => {
  const parsedQuantity =
    typeof quantity === 'number' && Number.isFinite(quantity)
      ? Math.floor(quantity)
      : 1
  const minimumQuantity = Math.max(1, parsedQuantity)

  return typeof availableStock === 'number'
    ? Math.min(minimumQuantity, availableStock)
    : minimumQuantity
}

const normalizeCartItem = (item: CartItem): CartItem | null => {
  const availableStock = isFinitePositiveNumber(item.availableStock)
    ? Math.floor(item.availableStock)
    : undefined

  if (
    !item ||
    typeof item.id !== 'string' ||
    typeof item.slug !== 'string' ||
    typeof item.title !== 'string' ||
    !isFinitePositiveNumber(item.price)
  ) {
    return null
  }

  const quantity = normalizeQuantity(item.quantity, availableStock)

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    image: typeof item.image === 'string' ? item.image : '/placeholder.svg',
    price: item.price,
    quantity,
    variant: typeof item.variant === 'string' && item.variant ? item.variant : undefined,
    availableStock,
  }
}

const sanitizeItems = (items: unknown): CartItem[] => {
  if (!Array.isArray(items)) return []

  return items.reduce<CartItem[]>((sanitized, rawItem) => {
    const item = normalizeCartItem(rawItem as CartItem)
    if (!item) return sanitized

    const existingIndex = sanitized.findIndex(
      (existing) => existing.id === item.id && existing.variant === item.variant
    )

    if (existingIndex >= 0) {
      const existing = sanitized[existingIndex]
      const availableStock = item.availableStock ?? existing.availableStock
      const quantity = normalizeQuantity(
        existing.quantity + item.quantity,
        availableStock
      )

      sanitized[existingIndex] = {
        ...existing,
        ...item,
        quantity,
        availableStock,
      }
      return sanitized
    }

    sanitized.push(item)
    return sanitized
  }, [])
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item: CartItem) => {
        const normalizedItem = normalizeCartItem(item)
        if (!normalizedItem) {
          throw new Error('Unable to add this item to cart.')
        }

        const { items } = get()
        const existingIndex = items.findIndex(
          (i) => i.id === normalizedItem.id && i.variant === normalizedItem.variant
        )

        if (existingIndex >= 0) {
          const updated = [...items]
          const availableStock =
            normalizedItem.availableStock ?? updated[existingIndex].availableStock
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...normalizedItem,
            quantity: normalizeQuantity(
              updated[existingIndex].quantity + normalizedItem.quantity,
              availableStock
            ),
            availableStock,
          }
          set({ items: updated })
        } else {
          set({ items: [...items, normalizedItem] })
        }
      },

      replaceCart: (item: CartItem) => {
        const normalizedItem = normalizeCartItem(item)
        if (!normalizedItem) {
          throw new Error('Unable to prepare checkout.')
        }

        set({ items: [normalizedItem], isOpen: false })
      },

      removeItem: (id: string, variant?: string) => {
        const { items } = get()
        set({
          items: items.filter(
            (item) => !(item.id === id && item.variant === variant)
          ),
        })
      },

      updateQuantity: (id: string, quantity: number, variant?: string) => {
        const { items } = get()

        if (quantity <= 0) {
          set({
            items: items.filter(
              (item) => !(item.id === id && item.variant === variant)
            ),
          })
          return
        }

        set({
          items: items.map((item) =>
            item.id === id && item.variant === variant
              ? {
                  ...item,
                  quantity: normalizeQuantity(quantity, item.availableStock),
                }
              : item
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'bandlox-cart',
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persistedItems =
          persistedState &&
          typeof persistedState === 'object' &&
          'items' in persistedState
            ? (persistedState as { items: unknown }).items
            : []

        return {
          ...currentState,
          items: sanitizeItems(persistedItems),
          isOpen: false,
        }
      },
    }
  )
)

// Selectors
export const selectItemCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0)

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0)
