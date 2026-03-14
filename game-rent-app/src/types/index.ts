export interface Game {
    id: number
    name: string
    description: string
    image: string
    platform: string
    platform_display: string
    original_price: string
    rental_price: string
    rating: string
    is_featured: boolean
    is_new: boolean
    publisher?: {
        id: number
        name: string
        logo: string | null
    }
    release_date: string
    genre: string[]
    available_keys: number
    created_at: string
}

export interface CartItem {
    game: Game
    duration: number
}

export interface Rental {
    id: number
    game_name: string
    game_key_value: string
    status: string
    started_at: string
    expires_at: string
    total_paid: string
}

export interface User {
    id: number
    username: string
    email: string
    avatar?: string | null
    is_verified?: boolean
    is_staff?: boolean
}