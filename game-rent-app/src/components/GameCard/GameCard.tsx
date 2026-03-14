import { Game } from '../../types'
import { useApp } from '../../context/AppContext'
import Stars from '../Stars/Stars'
import React from 'react'

interface GameCardProps {
    game: Game
    showHistory?: boolean
    onDetails?: (game: Game) => void
}

export default function GameCard({ game, showHistory = false, onDetails }: GameCardProps) {
    const { favorites, toggleFav, isAuthenticated } = useApp()
    const isFav = favorites.includes(game.id)
    const unavailable = game.available_keys === 0

    const handleFav = () => {
        if (!isAuthenticated) return
        toggleFav(game.id)
    }

    return (
        <div
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
                border: '1px solid #EBEBEB',
                background: unavailable ? '#F3F4F6' : 'white',
                opacity: unavailable ? 0.75 : 1,
                transition: 'opacity 0.2s',
            }}
        >
            {/* Image */}
            <div className="relative" style={{ height: '150px', overflow: 'hidden' }}>
                <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ filter: unavailable ? 'grayscale(100%)' : 'none', transition: 'filter 0.2s, transform 0.3s' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id}/400/220` }}
                    onMouseEnter={e => { if (!unavailable) e.currentTarget.style.transform = 'scale(1.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1.0)' }}
                />

                {/* Overlay cinza quando indisponível */}
                {unavailable && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
                )}

                {/* Badges top */}
                <div className="absolute top-2 left-2 right-2 flex justify-between">
                    <button className="w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:bg-white text-xs shadow-sm">
                        ☰
                    </button>
                    {isAuthenticated && !unavailable && (
                        <button
                            onClick={handleFav}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm transition-all ${
                                isFav ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:bg-white'
                            }`}
                        >
                            ♥
                        </button>
                    )}
                </div>

                {/* Badge NEW ou UNAVAILABLE */}
                <div className="absolute bottom-2 left-2">
                    {unavailable ? (
                        <span style={{ background: '#6B7280', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', fontFamily: 'Afacad, sans-serif', letterSpacing: '0.03em' }}>
                            UNAVAILABLE
                        </span>
                    ) : game.is_new ? (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
                    ) : null}
                </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
                <h3
                    className="font-semibold text-sm leading-tight mb-0.5 truncate"
                    style={{ color: unavailable ? '#9CA3AF' : '#111827' }}
                    title={game.name}
                >
                    {game.name}
                </h3>

                <div className="flex items-center gap-1 mb-2" style={{ opacity: unavailable ? 0.5 : 1 }}>
                    <Stars rating={parseFloat(game.rating)} size={12} />
                </div>

                <p className="text-sm font-bold mb-3 mt-auto" style={{ color: unavailable ? '#9CA3AF' : '#1F2937' }}>
                    {unavailable ? (
                        <span style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF' }}>Out of stock</span>
                    ) : parseFloat(game.rental_price) === 0 ? (
                        <span className="text-green-600">Free</span>
                    ) : (
                        <>{parseFloat(game.rental_price).toFixed(2)} <span className="text-xs font-normal text-gray-400">USD/week</span></>
                    )}
                </p>

                <button
                    onClick={() => { if (!unavailable) onDetails?.(game) }}
                    disabled={unavailable}
                    className="w-full py-2 text-xs font-semibold transition-colors"
                    style={{
                        border: `1px solid ${unavailable ? '#D1D5DB' : '#E0E0E0'}`,
                        borderRadius: '10px',
                        background: unavailable ? '#E5E7EB' : 'white',
                        color: unavailable ? '#9CA3AF' : '#374151',
                        cursor: unavailable ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!unavailable) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#9CA3AF' } }}
                    onMouseLeave={e => { if (!unavailable) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E0E0E0' } }}
                >
                    {unavailable ? 'Not Available' : showHistory ? 'History' : 'Details'}
                </button>
            </div>
        </div>
    )
}
