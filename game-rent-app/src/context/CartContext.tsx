import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Game, CartItem } from '../types'

interface CartContextValue {
    cart: CartItem[]
    addToCart: (game: Game, duration?: number) => void
    removeFromCart: (id: number) => void
    updateDuration: (id: number, duration: number) => void
    clearCart: () => void
    cartTotal: number
    cartCount: number
    inCart: (id: number) => boolean
}

const CartContext = createContext<CartContextValue>({} as CartContextValue)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    const addToCart = (game: Game, duration = 7) => {
        setCart(prev =>
            prev.find(i => i.game.id === game.id) ? prev : [...prev, { game, duration }]
        )
    }

    const removeFromCart = (id: number) =>
        setCart(prev => prev.filter(i => i.game.id !== id))

    const updateDuration = (id: number, duration: number) =>
        setCart(prev => prev.map(i => i.game.id === id ? { ...i, duration } : i))

    const clearCart = () => setCart([])

    const cartTotal = cart.reduce(
        (sum, i) => sum + parseFloat(i.game.rental_price) * i.duration,
        0
    )

    const cartCount = cart.length

    const inCart = (id: number) => cart.some(i => i.game.id === id)

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateDuration,
            clearCart, cartTotal, cartCount, inCart,
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
