import { useState, useEffect } from 'react'
import { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/GameCard/GameCard'
import FeaturedSidebar from '../../components/FeaturedSidebar/FeaturedSidebar'
import React from "react"

interface CatalogProps {
    setSelectedGame: (g: Game) => void
    initialSearch?: string
}

const GENRES = ['All', 'Action', 'RPG', 'FPS', 'Adventure', 'Simulation', 'Sports', 'Roguelike', 'Party']
const SORT_OPTIONS = ['Most Popular', 'Lowest Price', 'Highest Price', 'A-Z']

export default function Catalog({ setSelectedGame, initialSearch = '' }: CatalogProps) {
    const [games, setGames] = useState<Game[]>([])
    const [featured, setFeatured] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState(initialSearch)
    const [genre, setGenre] = useState('All')
    const [sort, setSort] = useState('Most Popular')

    useEffect(() => {
        getGames()
            .then(({ data }) => {
                setGames(data)
                setFeatured(data.filter((g: Game) => g.is_featured))
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    const filtered = games
        .filter(g => genre === 'All' || g.genre?.includes(genre))
        .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sort === 'Lowest Price') return parseFloat(a.rental_price) - parseFloat(b.rental_price)
            if (sort === 'Highest Price') return parseFloat(b.rental_price) - parseFloat(a.rental_price)
            if (sort === 'A-Z') return a.name.localeCompare(b.name)
            return parseFloat(b.rating) - parseFloat(a.rating)
        })

    return (
        <div className="flex gap-6">
            <div className="flex-1 min-w-0">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-xl font-bold text-gray-900">Catalog</h1>
                    <span className="text-sm text-gray-400">{filtered.length} games</span>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Search games..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:border-gray-400 cursor-pointer"
                        >
                            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* Genre tabs */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {GENRES.map(g => (
                            <button
                                key={g}
                                onClick={() => setGenre(g)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                    genre === g
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm">No games found.</p>
                        <button
                            onClick={() => { setSearch(''); setGenre('All') }}
                            className="mt-3 text-sm text-blue-500 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {filtered.map(g => (
                            <GameCard key={g.id} game={g} onDetails={setSelectedGame} />
                        ))}
                    </div>
                )}
            </div>

            <FeaturedSidebar
                games={featured}
                activeIndex={0}
                progress={0}
                onSelect={(i) => setSelectedGame(featured[i])}
                onSeeAll={() => {}}
            />
        </div>
    )
}