import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { getProfile } from '../services/api'

interface AuthContextValue {
    user: User | null
    isAuthenticated: boolean
    isAuthLoading: boolean
    saveTokens: (access: string, refresh: string, user: User) => void
    logout: () => void
    refreshUser: () => Promise<void>
    setUser: (u: User) => void
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isAuthLoading, setIsAuthLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            getProfile()
                .then(({ data }) => {
                    setUser(data.data)
                    setIsAuthenticated(true)
                })
                .catch(() => {
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                    setIsAuthenticated(false)
                })
                .finally(() => setIsAuthLoading(false))
        } else {
            setIsAuthLoading(false)
        }
    }, [])

    const saveTokens = (access: string, refresh: string, u: User) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        setUser(u)
        setIsAuthenticated(true)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setIsAuthenticated(false)
    }

    const refreshUser = async () => {
        try {
            const { data } = await getProfile()
            setUser(data.data)
        } catch {
            // silent
        }
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isAuthLoading, saveTokens, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
