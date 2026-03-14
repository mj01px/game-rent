import { Game } from '../../types'
import GameCard from '../../components/GameCard/GameCard'
import React from "react"

interface NewReleasesProps {
    setSelectedGame: (g: Game) => void
    allGames: Game[]
}

export default function NewReleases({ setSelectedGame, allGames }: NewReleasesProps) {
    const newGames = allGames.filter(g => g.is_new)

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">New Releases</h1>
                    <p className="text-sm text-gray-400 mt-0.5">The latest additions to our catalog</p>
                </div>
                <span className="text-sm text-gray-400">{newGames.length} games</span>
            </div>

            {newGames.length === 0 ? (
                    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                        <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}>No new releases yet</h2>
                    </div>


            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {newGames.map(g => (
                        <GameCard key={g.id} game={g} onDetails={setSelectedGame} />
                    ))}
                </div>
            )}
        </div>
    )
}