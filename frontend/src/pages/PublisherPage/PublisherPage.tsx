import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Game } from '../../types'
import { getGames } from '../../services/api'
import GameCard from '../../components/game/GameCard'
import { GameCardSkeleton } from '../../components/ui/Skeleton'
import Stars from '../../components/ui/Stars'

export default function PublisherPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        getGames({ publisher: Number(id) })
            .then(({ data }) => setGames(data.data ?? data))
            .finally(() => setLoading(false))
    }, [id])

    const publisher = games[0]?.publisher
    const publisherName = publisher?.name || 'Publisher'

    const avgRating = games.length
        ? games.reduce((sum, g) => sum + (parseFloat(g.rating) || 0), 0) / games.length
        : 0
    const featuredCount = games.filter(g => g.is_featured).length
    const platforms = [...new Set(games.map(g => g.platform_display).filter(Boolean))]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '14px', color: 'var(--text-secondary)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 0 20px 0', alignSelf: 'flex-start',
                    transition: 'color 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Back
            </button>

            {}
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '36px 40px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
            }}>
                {}
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '20px',
                    background: 'var(--accent-light)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                }}>
                    {publisher?.logo ? (
                        <img src={publisher.logo} alt={publisherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="7" width="20" height="14" rx="2" stroke="var(--accent)" strokeWidth="1.5"/>
                            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="var(--accent)" strokeWidth="1.5"/>
                            <circle cx="12" cy="14" r="2" stroke="var(--accent)" strokeWidth="1.5"/>
                        </svg>
                    )}
                </div>

                {}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                        {publisherName}
                    </h1>
                    {!loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {games.length} game{games.length !== 1 ? 's' : ''} on GameRent
                            </span>
                            {platforms.length > 0 && (
                                <>
                                    <span style={{ color: 'var(--border)', fontSize: '13px' }}>·</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {platforms.join(', ')}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {}
                {!loading && games.length > 0 && (
                    <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                {games.length}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>Games</p>
                        </div>
                        <div style={{ width: '1px', background: 'var(--border-light)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 1 }}>
                                <Stars rating={avgRating} size={12} />
                                <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                    {avgRating.toFixed(1)}
                                </span>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>Avg Rating</p>
                        </div>
                        {featuredCount > 0 && (
                            <>
                                <div style={{ width: '1px', background: 'var(--border-light)' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                                        {featuredCount}
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>Featured</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                    Games by {publisherName}
                </h2>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)}
                    </div>
                ) : games.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="7" width="20" height="14" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                        </svg>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>No games found</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>This publisher has no titles available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {games.map(game => <GameCard key={game.id} game={game} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
