import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

interface FavoritesContextValue {
    favorites: number[]
    toggleFav: (id: number) => void
    isFav: (id: number) => boolean
    loadFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue>({} as FavoritesContextValue)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth()
    const [favorites, setFavorites] = useState<number[]>([])

    const loadFavorites = async () => {
        try {
            const { data } = await api.get('/users/favorites/')
            setFavorites(data.data?.favorites ?? [])
        } catch {
            setFavorites([])
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            loadFavorites()
        } else {
            setFavorites([])
        }
    }, [isAuthenticated])

    const toggleFav = async (id: number) => {
        const wasFav = favorites.includes(id)
        // Optimistic
        setFavorites(prev => wasFav ? prev.filter(x => x !== id) : [...prev, id])
        try {
            if (wasFav) {
                await api.delete('/users/favorites/', { data: { game_id: id } })
            } else {
                await api.post('/users/favorites/', { game_id: id })
            }
        } catch {
            // Revert
            setFavorites(prev => wasFav ? [...prev, id] : prev.filter(x => x !== id))
        }
    }

    const isFav = (id: number) => favorites.includes(id)

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFav, isFav, loadFavorites }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export const useFavorites = () => useContext(FavoritesContext)
