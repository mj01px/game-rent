import React, { useState } from 'react'
import { Game } from '../../types'
import { useApp } from '../../context/AppContext'
import Stars from '../../components/Stars/Stars'
import GameCard from '../../components/GameCard/GameCard'

interface GameDetailProps {
    game: Game
    onBack: () => void
    setPage: (p: string) => void
    setSelectedGame: (g: Game) => void
    allGames: Game[]
}

export default function GameDetail({ game, onBack, setPage, setSelectedGame, allGames }: GameDetailProps) {
    const { cart, addToCart, isAuthenticated } = useApp()
    const inCart = cart.some(i => i.game.id === game.id)

    const related = allGames
        .filter(g => g.id !== game.id && (
            g.publisher?.id === game.publisher?.id ||
            g.platform === game.platform
        ))
        .slice(0, 4)

    const handleRent = () => {
        if (!isAuthenticated) {
            setPage('login')
            return
        }
        addToCart(game)
        setPage('cart')
    }

    return (
        <div className="flex flex-col gap-8">

            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors w-fit"
                style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>

            {/* Main card */}
            <div
                className="bg-white flex overflow-hidden"
                style={{ borderRadius: '20px', border: '1px solid #EBEBEB', minHeight: '380px' }}
            >
                {/* Imagem */}
                <div className="relative flex-shrink-0" style={{ width: '380px' }}>
                    <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id}/400/400` }}
                    />
                    {/* Overlay preço */}
                    <div
                        className="absolute bottom-0 left-3 right-3 flex items-center justify-between"
                        style={{
                            borderRadius: '14px',
                            background: 'rgba(0,0,0,0.35)',
                            backdropFilter: 'blur(8px)',
                            padding: '10px 14px',
                            marginBottom: '12px',
                        }}
                    >
                        <span className="text-white font-bold" style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}>
                            {parseFloat(game.rental_price).toFixed(2)}
                            <span className="text-white/60 font-normal text-xs ml-1">USD per/week</span>
                        </span>
                    </div>
                    {game.is_new && (
                        <div className="absolute top-3 left-3">
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-8">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <p className="text-gray-400 mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                                Release Date: {game.release_date}
                            </p>
                            <h1
                                className="font-bold text-gray-900 mb-2"
                                style={{ fontSize: '28px', fontFamily: 'Afacad, sans-serif', lineHeight: '1.2' }}
                            >
                                {game.name}
                            </h1>
                            <div className="flex items-center gap-2 mb-4">
                                <Stars rating={parseFloat(game.rating)} size={14} />
                                <span className="text-gray-500 font-medium" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                                    {parseFloat(game.rating).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p
                        className="text-gray-500 mb-6 leading-relaxed"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '520px' }}
                    >
                        {game.description}
                    </p>

                    {/* Info grid */}
                    <div
                        className="grid gap-3 mb-6"
                        style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '420px' }}
                    >
                        {[
                            { label: 'Platform', value: game.platform_display || game.platform },
                            { label: 'Genre', value: Array.isArray(game.genre) ? game.genre.join(', ') : game.genre },
                            { label: 'Original Price', value: `$${parseFloat(game.original_price).toFixed(2)}` },
                            { label: 'Available Keys', value: game.available_keys ?? '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-gray-400" style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif' }}>{label}</p>
                                <p className="font-semibold text-gray-800" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                        {/* Publisher */}
                        <div>
                            <span className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                                Created By:
                            </span>
                            <span className="text-gray-700 font-medium ml-2" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                                {game.publisher?.name || '—'}
                            </span>
                        </div>

                        {/* Rent Now */}
                        <button
                            onClick={handleRent}
                            className="flex items-center gap-2 font-bold transition-opacity hover:opacity-90"
                            style={{
                                background: inCart ? '#E0E0E0' : '#C8F135',
                                borderRadius: '10px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontFamily: 'Afacad, sans-serif',
                                color: inCart ? '#666' : '#111',
                            }}
                        >
                            {inCart ? 'In Cart →' : 'Rent Now →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Related games */}
            {related.length > 0 && (
                <div>
                    <h2
                        className="font-bold text-gray-900 mb-4"
                        style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif' }}
                    >
                        More Like This
                    </h2>
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        {related.map(g => (
                            <GameCard key={g.id} game={g} onDetails={setSelectedGame} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
