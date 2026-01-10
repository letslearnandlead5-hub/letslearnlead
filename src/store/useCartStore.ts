import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, quantity = 1) =>
                set((state) => {
                    // Validate product has required fields
                    if (!product || !product.id) {
                        console.error('Invalid product:', product);
                        return state;
                    }

                    const existingItem = state.items.find(
                        (item) => item.productId === product.id
                    );

                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.productId === product.id
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }

                    return {
                        items: [...state.items, { productId: product.id, quantity, product }],
                    };
                }),

            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                })),

            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId ? { ...item, quantity } : item
                    ),
                })),

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                return get().items.reduce(
                    (total, item) => total + (item.product?.price || 0) * item.quantity,
                    0
                );
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);
