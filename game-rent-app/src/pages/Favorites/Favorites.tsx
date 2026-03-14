import { Game } from '../../types'
import { useApp } from '../../context/AppContext'
import GameCard from '../../components/GameCard/GameCard'
import React from 'react'

interface FavoritesProps {
    setSelectedGame: (g: Game) => void
    allGames: Game[]
    setPage: (p: string) => void
}

export default function Favorites({ setSelectedGame, allGames, setPage }: FavoritesProps) {
    const { favorites, isAuthenticated } = useApp()

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                <div style={{ marginBottom: '16px', color: '#000000' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                </div>
                <h2
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
                >
                    Your favorites list is empty
                </h2>
                <p
                    className="text-gray-400 mb-6 text-center"
                    style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}
                >
                    Sign in to save your favorite games and access them anytime.
                </p>
            </div>
        )
    }

    const favGames = allGames.filter(g => favorites.includes(g.id))

    return (
        <div>
            <h1
                className="font-bold text-gray-900 mb-5"
                style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
            >
                Favorites
                {favGames.length > 0 && (
                    <span className="text-gray-400 font-normal ml-2" style={{ fontSize: '14px' }}>
                        {favGames.length} {favGames.length === 1 ? 'game' : 'games'}
                    </span>
                )}
            </h1>
            {favGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
                    <div style={{ marginBottom: '16px', color: '#000000' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2
                        className="font-bold text-gray-900 mb-2"
                        style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
                    >
                        No favorites yet
                    </h2>
                    <p
                        className="text-gray-400 mb-6 text-center"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}
                    >
                        Click the ♥ on a game to save it here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {favGames.map(g => (
                        <GameCard key={g.id} game={g} onDetails={setSelectedGame} />
                    ))}
                </div>
            )}
        </div>
    )
}
