import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/game/GameCard'
import { GameCardSkeleton } from '../../components/ui/Skeleton'

const GENRES = ['All', 'Action', 'RPG', 'FPS', 'Adventure', 'Sports', 'Horror', 'Racing', 'Platform', 'Simulation', 'Multiplayer']
const SORTS = [
    { label: 'Most Popular', fn: (a: Game, b: Game) => parseFloat(b.rating) - parseFloat(a.rating) },
    { label: 'Lowest Price',  fn: (a: Game, b: Game) => parseFloat(a.rental_price) - parseFloat(b.rental_price) },
    { label: 'Highest Price', fn: (a: Game, b: Game) => parseFloat(b.rental_price) - parseFloat(a.rental_price) },
    { label: 'A → Z',        fn: (a: Game, b: Game) => a.name.localeCompare(b.name) },
]
const PAGE_SIZE = 12

/**
 * Matches by substring OR by word-initial acronym.
 * "GTA" → matches "Grand Theft Auto" (G+T+A) and "GTA V" (direct).
 */
function matchesSearch(name: string, query: string): boolean {
    if (!query.trim()) return true
    const q = query.toLowerCase().trim()
    const n = name.toLowerCase()
    if (n.includes(q)) return true
    const acronym = n.split(/\s+/).filter(Boolean).map(w => w[0]).join('')
    return acronym.includes(q)
}

function Dropdown({
    label, icon, active, open, onToggle, dropRef, children, minWidth = '160px',
}: {
    label: string
    icon: React.ReactNode
    active?: boolean
    open: boolean
    onToggle: () => void
    dropRef: React.RefObject<HTMLDivElement>
    children: React.ReactNode
    minWidth?: string
}) {
    return (
        <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px',
                    background: active ? 'var(--accent-light)' : 'var(--surface)',
                    border: `1px solid ${open ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600,
                    color: active ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'border-color 150ms ease, background 150ms ease, color 150ms ease',
                    whiteSpace: 'nowrap',
                }}
            >
                {icon}
                {label}
                <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
                >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    overflow: 'hidden',
                    minWidth,
                    zIndex: 20,
                }}>
                    {children}
                </div>
            )}
        </div>
    )
}

function DropdownItem({
    label, active, onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', textAlign: 'left',
                padding: '10px 14px',
                fontSize: '13px', fontWeight: active ? 700 : 400,
                color: active ? 'var(--accent)' : 'var(--text-primary)',
                background: active ? 'var(--accent-light)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px',
                transition: 'background 100ms ease',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
        >
            {label}
            {active && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
            )}
        </button>
    )
}

export default function Catalog() {
    const [searchParams] = useSearchParams()
    const [allGames, setAllGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [genre, setGenre] = useState('All')
    const [sortIdx, setSortIdx] = useState(0)
    const [genreOpen, setGenreOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)
    const [page, setPage] = useState(1)
    const genreRef = useRef<HTMLDivElement>(null)
    const sortRef = useRef<HTMLDivElement>(null)

    const q = searchParams.get('q') || ''

    useEffect(() => {
        setLoading(true)
        getGames()
            .then(({ data }) => setAllGames(data.data ?? data))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { setPage(1) }, [q, genre, sortIdx])

    // Fecha dropdowns ao clicar fora
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (genreRef.current && !genreRef.current.contains(e.target as Node))
                setGenreOpen(false)
            if (sortRef.current && !sortRef.current.contains(e.target as Node))
                setSortOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = allGames
        .filter(g => {
            const matchQ = matchesSearch(g.name, q)
            const matchG = genre === 'All' || g.genre?.some(x => x.toLowerCase().includes(genre.toLowerCase()))
            return matchQ && matchG
        })
        .sort(SORTS[sortIdx].fn)

    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const hasActiveFilters = genre !== 'All' || sortIdx !== 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Header: título + dropdowns ───────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {q ? `Results for "${q}"` : 'Catalog'}
                    </h1>
                    {!loading && (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {filtered.length} game{filtered.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    {/* Genre dropdown */}
                    <Dropdown
                        label={genre === 'All' ? 'Genre' : genre}
                        active={genre !== 'All'}
                        open={genreOpen}
                        onToggle={() => { setGenreOpen(v => !v); setSortOpen(false) }}
                        dropRef={genreRef}
                        minWidth="160px"
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        }
                    >
                        {GENRES.map(g => (
                            <DropdownItem
                                key={g}
                                label={g}
                                active={genre === g}
                                onClick={() => { setGenre(g); setGenreOpen(false) }}
                            />
                        ))}
                    </Dropdown>

                    {/* Sort dropdown */}
                    <Dropdown
                        label={SORTS[sortIdx].label}
                        active={sortIdx !== 0}
                        open={sortOpen}
                        onToggle={() => { setSortOpen(v => !v); setGenreOpen(false) }}
                        dropRef={sortRef}
                        minWidth="170px"
                        icon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        }
                    >
                        {SORTS.map((s, i) => (
                            <DropdownItem
                                key={i}
                                label={s.label}
                                active={sortIdx === i}
                                onClick={() => { setSortIdx(i); setSortOpen(false) }}
                            />
                        ))}
                    </Dropdown>

                    {/* Clear — só aparece com filtro ativo */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setGenre('All'); setSortIdx(0) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '8px 12px',
                                fontSize: '12px', fontWeight: 600,
                                color: 'var(--text-muted)',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                cursor: 'pointer', fontFamily: 'inherit',
                                flexShrink: 0, whiteSpace: 'nowrap',
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid ─────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)}
                </div>
            ) : paged.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="1.5"/>
                        <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>No games found</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        {q ? `Nenhum resultado para "${q}"` : 'Tente ajustar os filtros'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setGenre('All'); setSortIdx(0) }}
                            style={{ padding: '8px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {paged.map(game => <GameCard key={game.id} game={game} />)}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '999px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}
                            >← Prev</button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                                    if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                                    acc.push(n)
                                    return acc
                                }, [])
                                .map((n, i) => n === '…' ? (
                                    <span key={`d${i}`} style={{ color: 'var(--text-muted)' }}>…</span>
                                ) : (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n as number)}
                                        style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: `1px solid ${page === n ? 'transparent' : 'var(--border)'}`, background: page === n ? 'var(--accent)' : 'var(--surface)', color: page === n ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
                                    >
                                        {n}
                                    </button>
                                ))}

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '999px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit' }}
                            >Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
