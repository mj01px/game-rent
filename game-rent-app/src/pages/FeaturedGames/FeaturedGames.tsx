// FeaturedGames page — pronto para importar no App.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/GameCard/GameCard'

interface FeaturedGamesProps {
    setSelectedGame: (g: Game) => void
    setPage: (p: string) => void
}

const SORT_OPTIONS = ['Most Popular', 'Lowest Price', 'Highest Price', 'A-Z']
const GAMES_PER_PAGE = 20

export default function FeaturedGames({ setSelectedGame, setPage }: FeaturedGamesProps) {
    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [sort, setSort] = useState('Most Popular')
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const topRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        getGames()
            .then(({ data }) => {
                const featured = data.filter((g: Game) => g.is_featured)
                setGames(featured)
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    // Reset página ao mudar filtros
    useEffect(() => { setCurrentPage(1) }, [search, sort])

    const filtered = games
        .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sort === 'Lowest Price') return parseFloat(a.rental_price) - parseFloat(b.rental_price)
            if (sort === 'Highest Price') return parseFloat(b.rental_price) - parseFloat(a.rental_price)
            if (sort === 'A-Z') return a.name.localeCompare(b.name)
            return parseFloat(b.rating) - parseFloat(a.rating)
        })

    const totalPages = Math.ceil(filtered.length / GAMES_PER_PAGE)
    const paginated = filtered.slice((currentPage - 1) * GAMES_PER_PAGE, currentPage * GAMES_PER_PAGE)

    const goToPage = (page: number) => {
        setCurrentPage(page)
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="flex-1 min-w-0" ref={topRef}>

            {/* Header com filtros inline */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage('home')}
                        className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                    </button>
                    <span style={{ color: '#D1D5DB' }}>/</span>
                    <div className="flex items-center gap-2">
                        <span style={{ fontSize: '18px' }}></span>
                        <h1 className="font-bold text-gray-900" style={{ fontSize: '18px', fontFamily: 'Afacad, sans-serif' }}>
                            Featured Games
                        </h1>
                    </div>
                </div>

                {/* Search + sort + contador */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                             width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search featured games..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                paddingLeft: '30px', paddingRight: search ? '30px' : '12px',
                                paddingTop: '7px', paddingBottom: '7px',
                                border: '1px solid #E0E0E0', borderRadius: '10px',
                                fontSize: '13px', fontFamily: 'Afacad, sans-serif',
                                outline: 'none', background: 'white', width: '200px',
                                color: '#1A1A1A',
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    position: 'absolute', right: '10px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', color: '#9CA3AF',
                                    padding: 0, display: 'flex', alignItems: 'center',
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        style={{
                            padding: '7px 12px', border: '1px solid #E0E0E0', borderRadius: '10px',
                            fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#374151',
                            background: 'white', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    {!isLoading && (
                        <span className="text-gray-400" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                            {filtered.length} games
                        </span>
                    )}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                    ))}
                </div>
            ) :
                filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: '#D1D5DB', marginBottom: '12px' }}>
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Afacad, sans-serif' }}>No featured games found.</p>
                    {search && (
                        <button onClick={() => setSearch('')}
                                className="text-sm text-blue-500 hover:underline"
                                style={{ fontFamily: 'Afacad, sans-serif' }}>
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        {paginated.map(g => (
                            <GameCard key={g.id} game={g} onDetails={setSelectedGame} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    border: '1px solid #E0E0E0', background: 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.4 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce((acc: (number | string)[], p, idx, arr) => {
                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((p, idx) =>
                                    p === '...' ? (
                                        <span key={`e-${idx}`} style={{ color: '#9CA3AF', fontSize: '13px', fontFamily: 'Afacad, sans-serif', padding: '0 4px' }}>...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p as number)}
                                            style={{
                                                width: '34px', height: '34px', borderRadius: '10px',
                                                fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 500,
                                                border: currentPage === p ? 'none' : '1px solid #E0E0E0',
                                                background: currentPage === p ? '#1A1A1A' : 'white',
                                                color: currentPage === p ? 'white' : '#374151',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {p}
                                        </button>
                                    )
                                )
                            }

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    border: '1px solid #E0E0E0', background: 'white',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.4 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 6L15 12L9 18" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
