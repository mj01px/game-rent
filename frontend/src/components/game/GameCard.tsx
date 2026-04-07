import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import Stars from '../ui/Stars'

const PLACEHOLDER = 'https://picsum.photos/seed/'

export default function GameCard({ game }: { game: Game }) {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { isFav, toggleFav } = useFavorites()
    const [imgErr, setImgErr] = useState(false)

    const isAvailable = game.available_keys > 0
    const fav = isFav(game.id)
    const rating = parseFloat(game.rating) || 0
    const imgSrc = imgErr || !game.image
        ? `${PLACEHOLDER}${game.id}/400/530`
        : game.image

    const handleFav = (e: MouseEvent) => {
        e.stopPropagation()
        if (!isAuthenticated) { navigate('/login'); return }
        toggleFav(game.id)
    }

    return (
        <div
            onClick={() => navigate(`/game/${game.id}`)}
            style={{
                background: 'var(--surface)',
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
            }}
        >
            {}
            <div style={{
                position: 'relative',
                background: 'var(--surface-2)',
                aspectRatio: '4/3',
                overflow: 'hidden',
            }}>
                {}
                {(game.is_new || game.is_featured) && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '3px 10px',
                        background: game.is_new ? '#E6F4EA' : 'var(--accent-light)',
                        color: game.is_new ? '#1E8E3E' : 'var(--accent)',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        zIndex: 1,
                    }}>
                        {game.is_new ? 'New' : 'Featured'}
                    </div>
                )}

                {}
                <button
                    onClick={handleFav}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        width: '28px', height: '28px',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1,
                        transition: 'transform 150ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title={fav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={fav ? '#D93025' : 'none'}>
                        <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
                              stroke={fav ? '#D93025' : '#80868B'} strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                </button>

                {}
                <img
                    src={imgSrc}
                    alt={game.name}
                    onError={() => setImgErr(true)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        filter: isAvailable ? 'none' : 'grayscale(0.4) brightness(0.85)',
                        transition: 'transform 300ms ease',
                    }}
                />

                {}
                {!isAvailable && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        paddingBottom: '10px',
                    }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 600,
                            background: 'rgba(0,0,0,0.55)', color: 'white',
                            padding: '3px 10px', borderRadius: '999px',
                        }}>
                            Unavailable
                        </span>
                    </div>
                )}
            </div>

            {}
            <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {}
                <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                    marginBottom: '6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {game.name}
                </p>

                {}
                {game.publisher && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {game.publisher.name}
                    </p>
                )}

                {}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                    <Stars rating={rating} size={11} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rating.toFixed(1)}</span>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    {}
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        ${parseFloat(game.rental_price).toFixed(2)}
                        <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '2px' }}>/dia</span>
                    </p>

                    {}
                    <button
                        onClick={e => { e.stopPropagation(); navigate(`/game/${game.id}`) }}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            borderRadius: '999px',
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'background 150ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                    >
                        View details
                    </button>
                </div>
            </div>
        </div>
    )
}
