import React, { useState, useEffect } from 'react'
import { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/GameCard/GameCard'

interface PublisherPageProps {
    publisherId: number
    publisherName: string
    setSelectedGame: (g: Game) => void
    onBack: () => void
}

export default function PublisherPage({ publisherId, publisherName, setSelectedGame, onBack }: PublisherPageProps) {
    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        getGames({ publisher: publisherId })
            .then(({ data }) => setGames(data.results || data))
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [publisherId])

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center bg-white rounded-full hover:bg-gray-50 transition-colors"
                    style={{
                        width: '36px',
                        height: '36px',
                        border: '1px solid #E0E0E0',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 6L9 12L15 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div>
                    <p className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                        Publisher
                    </p>
                    <h1
                        className="font-bold text-gray-900"
                        style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}
                    >
                        {publisherName}
                    </h1>
                </div>

                {!isLoading && (
                    <span
                        className="text-gray-400 ml-auto"
                        style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}
                    >
                        {games.length} {games.length === 1 ? 'game' : 'games'}
                    </span>
                )}
            </div>

            {/* Divisor */}
            <div style={{ height: '1px', background: '#EBEBEB', marginBottom: '24px' }} />

            {/* Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Afacad, sans-serif' }}>
                        Loading...
                    </p>
                </div>
            ) : games.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Afacad, sans-serif' }}>
                        No games found for {publisherName}.
                    </p>
                </div>
            ) : (
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
                >
                    {games.map(g => (
                        <GameCard
                            key={g.id}
                            game={g}
                            onDetails={setSelectedGame}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
