import React from 'react'
import { useApp } from '../../context/AppContext'

interface CartProps {
    setPage: (p: string) => void
}

const DURATIONS = [
    { l: '1 Week', w: 1 },
    { l: '2 Weeks', w: 2 },
    { l: '1 Month', w: 4 },
]

export default function Cart({ setPage }: CartProps) {
    const { cart, removeFromCart, updateDuration, cartTotal, isAuthenticated } = useApp()

    // Não logado
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', color: '#020202' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </div>
                <h2
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
                >
                    Sign in to access your cart
                </h2>
                <p
                    className="text-gray-400 mb-6 text-center"
                    style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}
                >
                    You need to be signed in to add games to your cart and checkout.
                </p>
            </div>
        )
    }

    // Carrinho vazio
    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', color: '#020202' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </div>
                <h2
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
                >
                    Your cart is empty
                </h2>
                <p
                    className="text-gray-400 mb-6 text-center"
                    style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}
                >
                    Add some games to get started.
                </p>
                <button
                    onClick={() => setPage('home')}
                    className="font-bold transition-opacity hover:opacity-90"
                    style={{
                        background: '#1A1A1A',
                        borderRadius: '12px',
                        padding: '10px 28px',
                        fontSize: '14px',
                        fontFamily: 'Afacad, sans-serif',
                        color: 'white',
                    }}
                >
                    Browse Games
                </button>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1
                    className="font-bold text-gray-900"
                    style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}
                >
                    Cart
                    <span className="text-gray-400 font-normal ml-2" style={{ fontSize: '14px' }}>
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </span>
                </h1>
            </div>

            <div className="flex gap-5 items-start">

                {/* Items */}
                <div className="flex-1 flex flex-col gap-3">
                    {cart.map(({ game, duration }) => (
                        <div
                            key={game.id}
                            className="bg-white flex gap-4 items-center"
                            style={{ borderRadius: '16px', border: '1px solid #EBEBEB', padding: '16px' }}
                        >
                            {/* Imagem */}
                            <img
                                src={game.image}
                                alt={game.name}
                                className="object-cover flex-shrink-0"
                                style={{ width: '90px', height: '64px', borderRadius: '10px' }}
                                onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id}/200/120` }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3
                                        className="font-semibold text-gray-900 truncate"
                                        style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}
                                    >
                                        {game.name}
                                    </h3>
                                    <button
                                        onClick={() => removeFromCart(game.id)}
                                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                                        style={{ fontSize: '20px', lineHeight: 1 }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <p
                                    className="text-gray-400 mb-3"
                                    style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}
                                >
                                    {game.platform_display || game.platform}
                                </p>

                                {/* Duration buttons */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-gray-400"
                                        style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}
                                    >
                                        Duration:
                                    </span>
                                    {DURATIONS.map(({ l, w }) => (
                                        <button
                                            key={w}
                                            onClick={() => updateDuration(game.id, w)}
                                            className="transition-all font-medium"
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontFamily: 'Afacad, sans-serif',
                                                background: duration === w ? '#1A1A1A' : '#F5F5F5',
                                                color: duration === w ? 'white' : '#666',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preço */}
                            <div className="text-right flex-shrink-0">
                                <p
                                    className="font-bold text-gray-900"
                                    style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif' }}
                                >
                                    ${(parseFloat(game.rental_price) * duration).toFixed(2)}
                                </p>
                                <p
                                    className="text-gray-400"
                                    style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}
                                >
                                    ${parseFloat(game.rental_price).toFixed(2)}/wk
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="flex-shrink-0 sticky" style={{ width: '260px', top: '112px' }}>
                    <div
                        className="bg-white"
                        style={{ borderRadius: '16px', border: '1px solid #EBEBEB', padding: '20px' }}
                    >
                        <h3
                            className="font-bold text-gray-900 mb-4"
                            style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}
                        >
                            Summary
                        </h3>

                        <div className="flex flex-col gap-2 mb-4">
                            {cart.map(({ game, duration }) => (
                                <div key={game.id} className="flex justify-between items-center">
                                    <span
                                        className="text-gray-500 truncate mr-2"
                                        style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}
                                    >
                                        {game.name}
                                    </span>
                                    <span
                                        className="font-medium text-gray-900 flex-shrink-0"
                                        style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}
                                    >
                                        ${(parseFloat(game.rental_price) * duration).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #EBEBEB', paddingTop: '14px', marginBottom: '16px' }}>
                            <div className="flex justify-between">
                                <span
                                    className="font-bold text-gray-900"
                                    style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}
                                >
                                    Total
                                </span>
                                <span
                                    className="font-bold text-gray-900"
                                    style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}
                                >
                                    ${cartTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setPage('checkout')}
                            className="w-full font-bold transition-opacity hover:opacity-90 mb-2"
                            style={{
                                background: '#C8F135',
                                borderRadius: '12px',
                                padding: '12px',
                                fontSize: '14px',
                                fontFamily: 'Afacad, sans-serif',
                                color: '#111',
                            }}
                        >
                            Checkout →
                        </button>
                        <button
                            onClick={() => setPage('home')}
                            className="w-full font-medium transition-colors"
                            style={{
                                border: '1px solid #E0E0E0',
                                borderRadius: '12px',
                                padding: '10px',
                                fontSize: '13px',
                                fontFamily: 'Afacad, sans-serif',
                                color: '#666',
                            }}
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
