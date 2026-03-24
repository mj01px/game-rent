import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../../types'
import { getGames } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import GameCard from '../../components/game/GameCard'
import { GameCardSkeleton } from '../../components/ui/Skeleton'

export default function Favorites() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { favorites } = useFavorites()
    const [allGames, setAllGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) { setLoading(false); return }
        getGames()
            .then(({ data }) => setAllGames(data.data ?? data))
            .finally(() => setLoading(false))
    }, [isAuthenticated])

    if (!isAuthenticated) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
                      stroke="var(--text-muted)" strokeWidth="1.5"/>
            </svg>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Sign in to see favorites</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Save games you love and find them here.</p>
            <button onClick={() => navigate('/login')}
                    style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign In
            </button>
        </div>
    )

    const favGames = allGames.filter(g => favorites.includes(g.id))

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>My Favorites</h1>
                {!loading && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{favGames.length} saved game{favGames.length !== 1 ? 's' : ''}</p>}
            </div>

            {loading ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)}
                </div>
            ) : favGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
                              stroke="var(--text-muted)" strokeWidth="1.5"/>
                    </svg>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>No favorites yet</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Heart a game to save it here.</p>
                    <button onClick={() => navigate('/')}
                            style={{ padding: '8px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                        Browse Games
                    </button>
                </div>
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {favGames.map(game => <GameCard key={game.id} game={game} />)}
                </div>
            )}
        </div>
    )
}
