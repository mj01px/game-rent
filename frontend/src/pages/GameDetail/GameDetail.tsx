import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Game } from '../../types'
import { getGameDetail, getGames } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useFavorites } from '../../context/FavoritesContext'
import GameCard from '../../components/game/GameCard'
import Stars from '../../components/ui/Stars'
import Skeleton from '../../components/ui/Skeleton'

export default function GameDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { addToCart, inCart } = useCart()
    const { isFav, toggleFav } = useFavorites()

    const [game, setGame] = useState<Game | null>(null)
    const [related, setRelated] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [imgErr, setImgErr] = useState(false)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        setImgErr(false)
        getGameDetail(Number(id))
            .then(({ data }) => {
                const g = data.data ?? data
                setGame(g)
                return getGames(g.publisher?.id ? { publisher: g.publisher.id } : undefined)
            })
            .then(({ data }) => {
                const all = data.data ?? data
                setRelated((all as Game[]).filter((g: Game) => g.id !== Number(id)).slice(0, 4))
            })
            .catch(() => navigate('/'))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Skeleton style={{ height: '420px', borderRadius: '24px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Skeleton style={{ height: '32px', width: '60%' }} />
                    <Skeleton style={{ height: '16px', width: '40%' }} />
                    <Skeleton style={{ height: '100px' }} />
                </div>
                <Skeleton style={{ height: '280px', borderRadius: '20px' }} />
            </div>
        </div>
    )

    if (!game) return null

    const rating = parseFloat(game.rating) || 0
    const isAvailable = game.available_keys > 0
    const fav = isFav(game.id)
    const alreadyInCart = inCart(game.id)
    const imgSrc = imgErr || !game.image
        ? `https://picsum.photos/seed/${game.id}/1200/600`
        : game.image

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
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                height: '420px',
                marginBottom: '32px',
            }}>
                <img
                    src={imgSrc}
                    alt={game.name}
                    onError={() => setImgErr(true)}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center 25%',
                    }}
                />
                {}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                }} />

                {}
                {game.platform_display && (
                    <div style={{
                        position: 'absolute', top: '20px', right: '24px',
                        padding: '5px 14px',
                        background: 'rgba(0,0,0,0.50)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {game.platform_display}
                        </span>
                    </div>
                )}

                {}
                <div style={{ position: 'absolute', top: '20px', left: '24px', display: 'flex', gap: '8px' }}>
                    {game.is_new && (
                        <span style={{ padding: '5px 12px', background: '#E6F4EA', color: '#1E8E3E', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                            New Release
                        </span>
                    )}
                    {game.is_featured && (
                        <span style={{ padding: '5px 12px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                            ★ Featured
                        </span>
                    )}
                </div>

                {}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 36px' }}>
                    {game.publisher && (
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px' }}>
                            {game.publisher.name}
                        </p>
                    )}
                    <h1 style={{
                        fontSize: '38px', fontWeight: 700, color: '#fff',
                        lineHeight: 1.1, letterSpacing: '-0.02em',
                        textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                        marginBottom: '10px',
                    }}>
                        {game.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Stars rating={rating} size={13} />
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                            {rating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>

                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                    {}
                    {game.publisher && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Developer / Publisher</p>
                                <button
                                    onClick={() => navigate(`/publisher/${game.publisher!.id}`)}
                                    style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    {game.publisher.name}
                                </button>
                            </div>
                        </div>
                    )}

                    {}
                    {game.description && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                About this game
                            </h2>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                                {game.description}
                            </p>
                        </div>
                    )}

                    {}
                    {game.genre && game.genre.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Genres</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {game.genre.map(g => (
                                    <span key={g} style={{
                                        padding: '6px 14px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '999px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                    }}>
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Game Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                            {[
                                {
                                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M8 12H10M9 11V13" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="12" r="1.3" fill="var(--text-muted)"/><circle cx="17" cy="10" r="1.3" fill="var(--text-muted)"/></svg>,
                                    label: 'Platform',
                                    value: game.platform_display,
                                },
                                {
                                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                                    label: 'Release Date',
                                    value: game.release_date
                                        ? new Date(game.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : '—',
                                },
                                {
                                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
                                    label: 'Rating',
                                    value: `${rating.toFixed(1)} / 5.0`,
                                },
                                {
                                    icon:
                                        <svg fill="#81878c" height="15" width="15" viewBox="0 0 248.878 248.878" enable-background="new 0 0 248.878 248.878"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="m238.051,108.371c-0.14-0.072-0.281-0.139-0.425-0.2l-29.523-12.729c-1.698-0.733-3.617-0.762-5.337-0.085l-17.716,6.979-17.718-6.979c-1.649-0.649-3.481-0.649-5.131,0l-17.718,6.979-17.716-6.979c-1.648-0.649-3.482-0.649-5.13,0l-12.867,5.067c-9.231-20.014-29.19-33.008-51.747-33.008-31.442,0-57.023,25.58-57.023,57.023s25.581,57.023 57.023,57.023c23.506,0 44.111-14.04 52.797-35.442h119.134c10.986,0 19.924-8.938 19.924-19.924-2.84217e-14-7.505-4.149-14.298-10.827-17.725zm-9.096,23.65h-124.074c-3.081,0-5.8,2.015-6.697,4.962-5.548,18.231-22.089,30.48-41.161,30.48-23.723,2.84217e-14-43.023-19.301-43.023-43.024s19.3-43.023 43.023-43.023c18.934,0 35.441,12.131 41.077,30.187 0.58,1.856 1.905,3.388 3.659,4.228 1.755,0.841 3.78,0.913 5.588,0.2l16.854-6.638 17.716,6.979c1.648,0.649 3.482,0.649 5.131,0l17.718-6.979 17.718,6.979c1.649,0.649 3.482,0.648 5.131,0l17.596-6.931 26.616,11.476c1.887,1.045 3.052,3.013 3.052,5.181-0.001,3.266-2.658,5.923-5.924,5.923z"></path> <path d="m45.787,106.202c-10.056,0-18.237,8.181-18.237,18.237s8.181,18.237 18.237,18.237 18.237-8.181 18.237-18.237-8.182-18.237-18.237-18.237zm0,22.474c-2.336,0-4.237-1.901-4.237-4.237s1.901-4.237 4.237-4.237 4.237,1.901 4.237,4.237-1.901,4.237-4.237,4.237z"></path> </g> </g></svg>,
                                    label: 'Available Keys',
                                    value: isAvailable ? `${game.available_keys} in stock` : 'Out of stock',
                                    valueColor: isAvailable ? 'var(--success)' : 'var(--danger)',
                                },
                            ].map(({ icon, label, value, valueColor }, i, arr) => (
                                <div key={label} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '14px 18px',
                                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none',
                                }}>
                                    <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>{icon}</div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '120px' }}>{label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: valueColor ?? 'var(--text-primary)' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {}
                <div style={{ position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                    }}>
                        {}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                    ${parseFloat(game.rental_price).toFixed(2)}
                                </span>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/day</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Original price: <span style={{ textDecoration: 'line-through' }}>${parseFloat(game.original_price).toFixed(2)}</span>
                            </p>
                        </div>

                        {}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: isAvailable ? 'rgba(30,142,62,0.08)' : 'rgba(217,48,37,0.08)',
                            border: `1px solid ${isAvailable ? 'rgba(30,142,62,0.2)' : 'rgba(217,48,37,0.2)'}`,
                            alignSelf: 'flex-start',
                        }}>
                            <span style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: isAvailable ? 'var(--success)' : 'var(--danger)',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: isAvailable ? 'var(--success)' : 'var(--danger)' }}>
                                {isAvailable ? `${game.available_keys} keys available` : 'Out of stock'}
                            </span>
                        </div>

                        {}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) { navigate('/login'); return }
                                    if (isAvailable && !alreadyInCart) addToCart(game)
                                }}
                                disabled={!isAvailable}
                                style={{
                                    width: '100%', padding: '13px',
                                    fontSize: '15px', fontWeight: 600,
                                    border: 'none', borderRadius: '999px',
                                    cursor: !isAvailable ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    background: alreadyInCart ? 'var(--surface-2)' : isAvailable ? 'var(--accent)' : 'var(--border)',
                                    color: alreadyInCart ? 'var(--text-secondary)' : isAvailable ? 'white' : 'var(--text-muted)',
                                    outline: alreadyInCart ? '1px solid var(--border)' : 'none',
                                    transition: 'background 150ms ease',
                                }}
                                onMouseEnter={e => { if (isAvailable && !alreadyInCart) e.currentTarget.style.background = 'var(--accent-hover)' }}
                                onMouseLeave={e => { if (isAvailable && !alreadyInCart) e.currentTarget.style.background = 'var(--accent)' }}
                            >
                                {alreadyInCart ? '✓ Added to Cart' : isAvailable ? 'Add to Cart' : 'Unavailable'}
                            </button>

                            {alreadyInCart && (
                                <button
                                    onClick={() => navigate('/cart')}
                                    style={{
                                        width: '100%', padding: '13px',
                                        fontSize: '15px', fontWeight: 600,
                                        background: 'var(--accent)', color: 'white',
                                        border: 'none', borderRadius: '999px',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'background 150ms ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                                >
                                    Go to Cart →
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (!isAuthenticated) { navigate('/login'); return }
                                    toggleFav(game.id)
                                }}
                                style={{
                                    width: '100%', padding: '11px',
                                    fontSize: '14px', fontWeight: 600,
                                    background: fav ? 'rgba(217,48,37,0.06)' : 'var(--surface-2)',
                                    color: fav ? 'var(--danger)' : 'var(--text-secondary)',
                                    border: `1px solid ${fav ? 'rgba(217,48,37,0.2)' : 'var(--border)'}`,
                                    borderRadius: '999px',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                    transition: 'all 150ms ease',
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'var(--danger)' : 'none'}>
                                    <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
                                          stroke={fav ? 'var(--danger)' : 'currentColor'} strokeWidth="2" strokeLinejoin="round"/>
                                </svg>
                                {fav ? 'Saved to Favorites' : 'Add to Favorites'}
                            </button>
                        </div>

                        {}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
                            {[
                                { icon: '', text: 'Instant activation key delivery' },
                                { icon: '', text: 'Flexible rental duration at checkout' },
                                { icon: '', text: 'Refund available within rental period' },
                            ].map(({ icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px' }}>{icon}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {}
            {related.length > 0 && (
                <div style={{ marginTop: '56px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                        More from {game.publisher?.name || 'this publisher'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {related.map(g => <GameCard key={g.id} game={g} />)}
                    </div>
                </div>
            )}
        </div>
    )
}
