import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            const refresh = localStorage.getItem('refresh_token')
            if (refresh) {
                try {
                    const { data } = await axios.post('http://127.0.0.1:8000/api/users/token/refresh/', { refresh })
                    localStorage.setItem('access_token', data.access)
                    original.headers.Authorization = `Bearer ${data.access}`
                    return api(original)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

// Games
export const getGames = (params?: {
    platform?: string
    featured?: boolean
    search?: string
    publisher?: number
}) => api.get('/games/', { params })

export const getGameDetail = (id: number) => api.get(`/games/${id}/`)

// Auth
export const login = (data: { username: string; password: string }) => api.post('/users/login/', data)
export const register = (data: { username: string; email: string; password: string }) => api.post('/users/register/', data)
export const getProfile = () => api.get('/users/profile/')

// Rentals
export const getRentals = () => api.get('/rentals/')
export const createRental = (data: { game_id: number; rental_days: number }) => api.post('/rentals/create/', data)

export default api