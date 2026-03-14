import React from 'react'
import { useApp } from '../../context/AppContext'

interface ConfirmationProps {
    rentals: any[]
    setPage: (p: string) => void
}

export default function Confirmation({ rentals, setPage }: ConfirmationProps) {
    const { clearCart } = useApp()

    const handleGoToMyGames = () => {
        clearCart()
        setPage('mygames')
    }

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
    }

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center">
            {/* Ícone de sucesso */}
            <div
                className="flex items-center justify-center mb-5"
                style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#F0FDE4',
                    marginTop: '16px',
                }}
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 7" stroke="#5CB85C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h1
                className="font-bold text-gray-900 mb-1 text-center"
                style={{ fontSize: '24px', fontFamily: 'Afacad, sans-serif' }}
            >
                Payment Successful!
            </h1>
            <p
                className="text-gray-400 mb-8 text-center"
                style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}
            >
                Your games are ready to play. Here are your activation keys.
            </p>

            {/* Activation keys */}
            <div className="w-full flex flex-col gap-3 mb-8">
                {rentals.map((rental) => (
                    <div
                        key={rental.id}
                        className="bg-white w-full"
                        style={{ borderRadius: '16px', border: '1px solid #EBEBEB', padding: '16px 20px' }}
                    >
                        <p
                            className="font-bold text-gray-900 mb-1"
                            style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}
                        >
                            {rental.game_name}
                        </p>
                        <p
                            className="text-gray-400 mb-3"
                            style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}
                        >
                            Valid until {formatDate(rental.expires_at)}
                        </p>

                        {/* Chave de ativação */}
                        <div
                            className="flex items-center justify-between"
                            style={{
                                background: '#F8F8F8',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                border: '1px solid #E8E8E8',
                            }}
                        >
                            <span
                                className="font-mono font-bold text-gray-800"
                                style={{ fontSize: '14px', letterSpacing: '1px' }}
                            >
                                {rental.game_key_value || '****-****-****'}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(rental.game_key_value || '')}
                                className="text-gray-400 hover:text-gray-700 transition-colors"
                                style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 w-full">
                <button
                    onClick={handleGoToMyGames}
                    className="flex-1 font-bold transition-opacity hover:opacity-90"
                    style={{
                        background: '#1A1A1A',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '14px',
                        fontFamily: 'Afacad, sans-serif',
                        color: 'white',
                    }}
                >
                    Go to My Games
                </button>
                <button
                    onClick={() => { clearCart(); setPage('home') }}
                    className="flex-1 font-medium transition-colors hover:border-gray-400"
                    style={{
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '14px',
                        fontFamily: 'Afacad, sans-serif',
                        color: '#666',
                        border: '1px solid #E0E0E0',
                    }}
                >
                    Back to Home
                </button>
            </div>
        </div>
    )
}
