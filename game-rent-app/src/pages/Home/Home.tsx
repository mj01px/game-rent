import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Game } from '../../types'
import { getGames } from '../../services/api'
import { useApp } from '../../context/AppContext'
import GameCard from '../../components/GameCard/GameCard'
import FeaturedSidebar from '../../components/FeaturedSidebar/FeaturedSidebar'
import HeroSection from '../../components/HeroSection/HeroSection'

interface HomeProps {
    setPage: (p: string) => void
    setSelectedGame: (g: Game) => void
    onPublisher: (id: number, name: string) => void
}

const AUTO_ADVANCE_MS = 5000
const FEATURED_MIN_RATING = 4.7
const GAMES_PER_PAGE = 20
const SORT_OPTIONS = ['Most Popular', 'Lowest Price', 'Highest Price', 'A-Z']

export default function Home({ setPage, setSelectedGame, onPublisher }: HomeProps) {
    const [games, setGames] = useState<Game[]>([])
    const [heroGames, setHeroGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('Most Popular')
    const { addToCart, isAuthenticated } = useApp()

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const allGamesSectionRef = useRef<HTMLDivElement>(null)

    const startTimer = useCallback((total: number) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        if (progressRef.current) clearInterval(progressRef.current)
        setProgress(0)
        const steps = AUTO_ADVANCE_MS / 50
        let step = 0
        progressRef.current = setInterval(() => {
            step++
            setProgress(Math.min((step / steps) * 100, 100))
        }, 50)
        timerRef.current = setTimeout(() => {
            setActiveIndex(i => (i + 1) % total)
        }, AUTO_ADVANCE_MS)
    }, [])

    useEffect(() => {
        if (heroGames.length > 0) startTimer(heroGames.length)
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            if (progressRef.current) clearInterval(progressRef.current)
        }
    }, [activeIndex, heroGames.length, startTimer])

    useEffect(() => {
        getGames()
            .then(({ data }) => {
                setGames(data)
                const featured = data.filter((g: Game) => parseFloat(g.rating) >= FEATURED_MIN_RATING)
                setHeroGames(featured)
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    // Reset página ao mudar filtros
    useEffect(() => { setCurrentPage(1) }, [search, sort])

    const handleRent = (game: Game) => {
        if (!isAuthenticated) { setPage('login'); return }
        addToCart(game)
        setPage('cart')
    }

    const filtered = games
        .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sort === 'Lowest Price') return parseFloat(a.rental_price) - parseFloat(b.rental_price)
            if (sort === 'Highest Price') return parseFloat(b.rental_price) - parseFloat(a.rental_price)
            if (sort === 'A-Z') return a.name.localeCompare(b.name)
            return parseFloat(b.rating) - parseFloat(a.rating)
        })

    const totalPages = Math.ceil(filtered.length / GAMES_PER_PAGE)
    const paginatedGames = filtered.slice((currentPage - 1) * GAMES_PER_PAGE, currentPage * GAMES_PER_PAGE)

    const goToPage = (page: number) => {
        setCurrentPage(page)
        allGamesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 text-sm" style={{ fontFamily: 'Afacad, sans-serif' }}>Loading...</div>
        </div>
    )

    return (
        <div className="flex flex-col gap-6">

            {/* Hero + Sidebar lado a lado */}
            <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                    {heroGames.length > 0 && (
                        <HeroSection
                            games={heroGames}
                            activeIndex={activeIndex}
                            onIndexChange={setActiveIndex}
                            onDetails={setSelectedGame}
                            onRent={handleRent}
                            onPublisher={onPublisher}
                        />
                    )}
                </div>
                <FeaturedSidebar
                    games={heroGames}
                    activeIndex={activeIndex}
                    progress={progress}
                    onSelect={setActiveIndex}
                    onSeeAll={() => setPage('featured')}
                />
            </div>

            {/* All Games — largura total */}
            <div ref={allGamesSectionRef}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900" style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif' }}>
                        All Games
                    </h2>

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
                                placeholder="Search games..."
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
                        <span className="text-gray-400" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                            {filtered.length} games
                        </span>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-gray-400 text-sm mb-2" style={{ fontFamily: 'Afacad, sans-serif' }}>No games found.</p>
                        <button onClick={() => setSearch('')}
                                className="text-sm text-blue-500 hover:underline"
                                style={{ fontFamily: 'Afacad, sans-serif' }}>
                            Clear search
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                            {paginatedGames.map(g => (
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
        </div>
    )
}
