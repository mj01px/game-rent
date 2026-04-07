import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/game/GameCard'
import { GameCardSkeleton } from '../../components/ui/Skeleton'
import Stars from '../../components/ui/Stars'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const PAGE_SIZE = 8

function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px', ...style }}>
            {children}
        </div>
    )
}

export default function Home() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { addToCart, inCart } = useCart()

    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [heroIndex, setHeroIndex] = useState(0)
    const [page, setPage] = useState(1)
    const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        setLoading(true)
        getGames()
            .then(({ data }) => setGames(data.data ?? data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const featured = games.filter(g => g.is_featured)
    const hero = featured[heroIndex]

    const startTimer = (len: number) => {
        if (heroTimerRef.current) clearInterval(heroTimerRef.current)
        heroTimerRef.current = setInterval(() => setHeroIndex(i => (i + 1) % len), 6000)
    }

    useEffect(() => {
        if (featured.length < 2) return
        startTimer(featured.length)
        return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current) }
    }, [featured.length])

    const goTo = (idx: number) => {
        setHeroIndex(idx)
        if (featured.length >= 2) startTimer(featured.length)
    }

    const paged = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const totalPages = Math.ceil(games.length / PAGE_SIZE)

    return (
        <div style={{ paddingBottom: '80px' }}>
            <style>{`
                @keyframes heroContentIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {}
            {!loading && hero && (
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 40px 16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{
                                fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                maxWidth: '220px', flexShrink: 0,
                            }}>
                                {hero.name}
                            </span>
                            <button style={{
                                padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500,
                                border: 'none', background: 'var(--accent-light)', color: 'var(--accent)',
                                cursor: 'default', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap',
                            }}>
                                Overview
                            </button>
                            <button
                                onClick={() => navigate(`/game/${hero.id}`)}
                                style={{
                                    padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 400,
                                    border: 'none', background: 'var(--surface-2)', color: 'var(--text-secondary)',
                                    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap',
                                    transition: 'background 150ms ease, color 150ms ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                            >
                                Game Details
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                    ${parseFloat(hero.rental_price).toFixed(2)}
                                    <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '2px' }}>/dia</span>
                                </p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {hero.available_keys > 0 ? `${hero.available_keys} keys available` : 'Out of stock'}
                                </p>
                            </div>
                            {hero.available_keys > 0 && (
                                <button
                                    onClick={() => {
                                        if (!isAuthenticated) { navigate('/login'); return }
                                        if (!inCart(hero.id)) addToCart(hero)
                                        navigate('/cart')
                                    }}
                                    style={{
                                        padding: '9px 24px', background: 'var(--accent)', color: 'white',
                                        border: 'none', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                        transition: 'background 150ms ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                                >
                                    Rent now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            {!loading && hero && (
                <Section style={{ padding: '0 40px 0' }}>
                    <div style={{ borderRadius: '24px', overflow: 'hidden', height: '520px', position: 'relative' }}>

                        {}
                        {featured.map((g, i) => (
                            <img
                                key={g.id}
                                src={g.image || `https://picsum.photos/seed/${g.id}/1200/700`}
                                alt={g.name}
                                style={{
                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                    objectFit: 'cover', objectPosition: 'center 20%',
                                    opacity: i === heroIndex ? 1 : 0,
                                    transition: 'opacity 700ms ease',
                                }}
                            />
                        ))}

                        {}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.05) 100%)',
                        }} />

                        {}
                        <div
                            key={heroIndex}
                            style={{
                                position: 'absolute', bottom: 0, left: 0,
                                padding: '40px 48px', maxWidth: '560px',
                                animation: 'heroContentIn 500ms ease',
                            }}
                        >
                            {hero.publisher && (
                                <p style={{
                                    fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                                    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.09em',
                                }}>
                                    {hero.publisher.name}
                                </p>
                            )}
                            <h1 style={{
                                fontSize: '44px', fontWeight: 700, color: '#FFFFFF',
                                lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '12px',
                                textShadow: '0 2px 16px rgba(0,0,0,0.4)',
                            }}>
                                {hero.name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                                <Stars rating={parseFloat(hero.rating)} size={13} />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                                    {parseFloat(hero.rating).toFixed(1)}
                                </span>
                            </div>
                            <p style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '22px' }}>
                                ${parseFloat(hero.rental_price).toFixed(2)}
                                <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginLeft: '4px' }}>/dia</span>
                            </p>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {hero.available_keys > 0 ? (
                                    <button
                                        onClick={() => {
                                            if (!isAuthenticated) { navigate('/login'); return }
                                            if (!inCart(hero.id)) addToCart(hero)
                                            navigate('/cart')
                                        }}
                                        style={{
                                            padding: '11px 28px', background: 'var(--accent)', color: 'white',
                                            border: 'none', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
                                            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms ease',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                                    >
                                        Rent now
                                    </button>
                                ) : (
                                    <span style={{
                                        padding: '11px 20px', background: 'rgba(255,255,255,0.15)',
                                        color: 'rgba(255,255,255,0.7)', borderRadius: '999px',
                                        fontSize: '14px', fontWeight: 500,
                                    }}>
                                        Unavailable
                                    </span>
                                )}
                            </div>
                        </div>

                        {}
                        {hero.platform && (
                            <div style={{
                                position: 'absolute', top: '20px', right: '24px',
                                padding: '5px 14px', background: 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(8px)', borderRadius: '999px',
                                border: '1px solid rgba(255,255,255,0.15)',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    {hero.platform}
                                </span>
                            </div>
                        )}

                        {}
                        {featured.length > 1 && (
                            <>
                                {}
                                <button
                                    onClick={() => goTo((heroIndex + 1) % featured.length)}
                                    style={{
                                        position: 'absolute', right: '20px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '40px', height: '40px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.40)',
                                        backdropFilter: 'blur(6px)',
                                        border: '1px solid rgba(255,255,255,0.20)',
                                        borderRadius: '50%', cursor: 'pointer',
                                        color: 'white',
                                        transition: 'background 150ms ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.40)'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>

                                {}
                                <div style={{
                                    position: 'absolute', bottom: '20px', right: '24px',
                                    display: 'flex', gap: '6px', alignItems: 'center',
                                }}>
                                    {featured.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            style={{
                                                width: i === heroIndex ? '20px' : '6px',
                                                height: '6px',
                                                borderRadius: '999px',
                                                background: i === heroIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                                border: 'none', cursor: 'pointer', padding: 0,
                                                transition: 'width 300ms ease, background 300ms ease',
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </Section>
            )}

            {}
            {loading && (
                <Section style={{ padding: '0 40px 0' }}>
                    <div style={{ borderRadius: '24px', height: '520px', background: 'var(--surface-2)', animation: 'pulse 2s infinite' }} />
                </Section>
            )}

            {}
            <Section style={{ paddingTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        All Games
                    </h2>
                    {!loading && (
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 400 }}>
                            ({games.length})
                        </span>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {paged.map(game => <GameCard key={game.id} game={game} />)}
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '8px 16px', fontSize: '14px', fontWeight: 600,
                                        background: 'var(--surface)', border: '1px solid var(--border)',
                                        color: 'var(--text-primary)', borderRadius: '999px',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit',
                                    }}
                                >← Prev</button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                                    .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                                        if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                                        acc.push(n)
                                        return acc
                                    }, [])
                                    .map((n, i) => n === '…' ? (
                                        <span key={`d${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                                    ) : (
                                        <button
                                            key={n}
                                            onClick={() => setPage(n as number)}
                                            style={{
                                                width: '36px', height: '36px', fontSize: '14px', fontWeight: 600,
                                                borderRadius: '10px',
                                                border: page === n ? '1px solid transparent' : '1px solid var(--border)',
                                                background: page === n ? 'var(--accent)' : 'var(--surface)',
                                                color: page === n ? 'white' : 'var(--text-primary)',
                                                cursor: 'pointer', fontFamily: 'inherit',
                                            }}
                                        >
                                            {n}
                                        </button>
                                    ))}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '8px 16px', fontSize: '14px', fontWeight: 600,
                                        background: 'var(--surface)', border: '1px solid var(--border)',
                                        color: 'var(--text-primary)', borderRadius: '999px',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        opacity: page === totalPages ? 0.4 : 1, fontFamily: 'inherit',
                                    }}
                                >Next →</button>
                            </div>
                        )}
                    </>
                )}
            </Section>
        </div>
    )
}
