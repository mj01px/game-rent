import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Game, CartItem, User } from '../types'
import { getProfile } from '../services/api'
import axios from 'axios'
import React from 'react'

interface AppContextType {
    user: User | null
    isAuthenticated: boolean
    saveTokens: (access: string, refresh: string, user: User) => void
    logout: () => void
    refreshUser: () => Promise<void>
    cart: CartItem[]
    addToCart: (game: Game, duration?: number) => void
    removeFromCart: (id: number) => void
    updateDuration: (id: number, duration: number) => void
    clearCart: () => void
    cartTotal: number
    favorites: number[]
    toggleFav: (id: number) => void
}

const AppContext = createContext<AppContextType>({} as AppContextType)

const favApi = () => {
    const token = localStorage.getItem('access_token')
    return axios.create({
        baseURL: 'http://127.0.0.1:8000/api',
        headers: { Authorization: `Bearer ${token}` },
    })
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])
    const [favorites, setFavorites] = useState<number[]>([])

    const loadFavorites = async () => {
        try {
            const { data } = await favApi().get('/users/favorites/')
            setFavorites(data.favorites)
        } catch {
            setFavorites([])
        }
    }

    const refreshUser = async () => {
        try {
            const { data } = await getProfile()
            setUser(data)
        } catch {
            // silencia — token pode ter expirado
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            getProfile()
                .then(({ data }) => {
                    setUser(data)
                    setIsAuthenticated(true)
                    loadFavorites()
                })
                .catch(() => {
                    localStorage.clear()
                    setIsAuthenticated(false)
                })
        }
    }, [])

    const saveTokens = (access: string, refresh: string, u: User) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        setUser(u)
        setIsAuthenticated(true)
        setCart([])
        setFavorites([])
        setTimeout(() => loadFavorites(), 100)
    }

    const logout = () => {
        localStorage.clear()
        setUser(null)
        setIsAuthenticated(false)
        setCart([])
        setFavorites([])
    }

    const toggleFav = async (id: number) => {
        const isFav = favorites.includes(id)
        setFavorites(prev => isFav ? prev.filter(x => x !== id) : [...prev, id])
        try {
            if (isFav) {
                await favApi().delete('/users/favorites/', { data: { game_id: id } })
            } else {
                await favApi().post('/users/favorites/', { game_id: id })
            }
        } catch {
            setFavorites(prev => isFav ? [...prev, id] : prev.filter(x => x !== id))
        }
    }

    const addToCart = (game: Game, duration = 1) => {
        setCart(p => p.find(i => i.game.id === game.id) ? p : [...p, { game, duration }])
    }

    const removeFromCart = (id: number) => setCart(p => p.filter(i => i.game.id !== id))
    const clearCart = () => setCart([])

    const updateDuration = (id: number, duration: number) => {
        setCart(p => p.map(i => i.game.id === id ? { ...i, duration } : i))
    }

    const cartTotal = cart.reduce((sum, i) => sum + parseFloat(i.game.rental_price) * i.duration, 0)

    return (
        <AppContext.Provider value={{
            user, isAuthenticated, saveTokens, logout, refreshUser,
            cart, addToCart, removeFromCart, updateDuration, clearCart, cartTotal,
            favorites, toggleFav,
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => useContext(AppContext)
