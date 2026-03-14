import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { createRental } from '../../services/api'

interface CheckoutProps {
    setPage: (p: string) => void
    onConfirmation: (rentals: any[]) => void
}

type PaymentMethod = 'card' | 'pix' | 'paypal'

export default function Checkout({ setPage, onConfirmation }: CheckoutProps) {
    const { cart, cartTotal, isAuthenticated } = useApp()
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

    // Card fields
    const [cardNumber, setCardNumber] = useState('')
    const [cardName, setCardName] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvc, setCardCvc] = useState('')

    if (!isAuthenticated) { setPage('login'); return null }
    if (cart.length === 0) { setPage('cart'); return null }

    const formatCardNumber = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16)
        return digits.replace(/(.{4})/g, '$1 ').trim()
    }

    const formatExpiry = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 4)
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
        return digits
    }

    const isCardValid = cardNumber.replace(/\s/g, '').length === 16 && cardName.trim() && cardExpiry.length === 5 && cardCvc.length >= 3

    const canPay =
        paymentMethod === 'card' ? isCardValid :
            paymentMethod === 'pix' ? true :
                paymentMethod === 'paypal' ? true : false

    const handlePay = async () => {
        setIsProcessing(true)
        setError('')
        try {
            const results = []
            for (const { game, duration } of cart) {
                const { data } = await createRental({ game_id: game.id, rental_days: duration * 7 })
                results.push(data)
            }
            onConfirmation(results)
        } catch (err: any) {
            const msg = err?.response?.data
            if (typeof msg === 'object') {
                const first = Object.values(msg)[0]
                setError(Array.isArray(first) ? first[0] as string : String(first))
            } else {
                setError('Payment failed. Please try again.')
            }
            setIsProcessing(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px',
        padding: '10px 14px', fontSize: '14px', fontFamily: 'Afacad, sans-serif',
        outline: 'none', color: '#1A1A1A', background: 'white',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontFamily: 'Afacad, sans-serif',
        color: '#9CA3AF', marginBottom: '6px', display: 'block',
    }

    const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
        {
            id: 'card',
            label: 'Credit / Debit Card',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
        },
        {
            id: 'pix',
            label: 'Pix',
            icon: (
                <svg
                    fill="currentColor" width="18px" height="18px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
                </svg>
            ),
        },
        {
            id: 'paypal',
            label: 'PayPal',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 11C7 11 6 17 6 18H4L6 6h6c3 0 5 1.5 4.5 4.5C16 13.5 13 14 11 14H8.5L8 17H6L7 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M9.5 14C9.5 14 8.5 20 8.5 21H6.5L8 12h5c2.5 0 4.5 1.5 4 4C17 18.5 14.5 19 13 19H10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
            ),
        },
    ]

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {/* Back */}
            <button
                onClick={() => setPage('cart')}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6"
                style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to Cart
            </button>

            <h1 className="font-bold text-gray-900 mb-6" style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}>
                Checkout
            </h1>

            <div className="flex gap-5 items-start">

                {/* Left — Order summary + Payment method */}
                <div className="flex-1 flex flex-col gap-4">

                    {/* Order Summary */}
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #EBEBEB', padding: '20px' }}>
                        <h2 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                            Order Summary
                        </h2>
                        <div className="flex flex-col gap-3">
                            {cart.map(({ game, duration }) => (
                                <div key={game.id} className="flex gap-3 items-center"
                                     style={{ borderRadius: '12px', border: '1px solid #F5F5F5', padding: '10px', background: '#FAFAFA' }}>
                                    <img
                                        src={game.image} alt={game.name}
                                        className="object-cover flex-shrink-0"
                                        style={{ width: '64px', height: '46px', borderRadius: '8px', border: '1px solid #EBEBEB' }}
                                        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id}/200/120` }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                                            {game.name}
                                        </p>
                                        <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF' }}>
                                            {duration === 1 ? '1 Week' : duration === 2 ? '2 Weeks' : '1 Month'} · {game.platform_display}
                                        </p>
                                    </div>
                                    <p className="font-bold text-gray-900 flex-shrink-0" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                                        ${(parseFloat(game.rental_price) * duration).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #EBEBEB', padding: '20px' }}>
                        <h2 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                            Payment Method
                        </h2>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-5">
                            {paymentMethods.map(({ id, label, icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setPaymentMethod(id)}
                                    className="flex items-center gap-2 flex-1 justify-center transition-all"
                                    style={{
                                        padding: '10px 12px', borderRadius: '12px', fontSize: '13px',
                                        fontFamily: 'Afacad, sans-serif', fontWeight: 600, cursor: 'pointer',
                                        border: paymentMethod === id ? '2px solid #1A1A1A' : '1px solid #E0E0E0',
                                        background: paymentMethod === id ? '#1A1A1A' : 'white',
                                        color: paymentMethod === id ? 'white' : '#6B7280',
                                    }}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Card form */}
                        {paymentMethod === 'card' && (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label style={labelStyle}>Card number</label>
                                    <input
                                        style={inputStyle}
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength={19}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Cardholder name</label>
                                    <input
                                        style={inputStyle}
                                        placeholder="Name as on card"
                                        value={cardName}
                                        onChange={e => setCardName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label style={labelStyle}>Expiry date</label>
                                        <input
                                            style={inputStyle}
                                            placeholder="MM/YY"
                                            value={cardExpiry}
                                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                            maxLength={5}
                                        />
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <label style={labelStyle}>CVC</label>
                                        <input
                                            style={inputStyle}
                                            placeholder="•••"
                                            value={cardCvc}
                                            onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            maxLength={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pix */}
                        {paymentMethod === 'pix' && (
                            <div className="flex flex-col items-center py-4 gap-3">
                                {/* QR Code simulado */}
                                <div style={{
                                    width: '140px', height: '140px', borderRadius: '12px',
                                    border: '1px solid #E0E0E0', padding: '10px', background: 'white',
                                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px',
                                }}>
                                    {Array.from({ length: 49 }).map((_, i) => (
                                        <div key={i} style={{
                                            borderRadius: '2px',
                                            background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,29,36,10,12,17,19,24,26,31,33,38,40].includes(i) ? '#1A1A1A' : 'white',
                                        }} />
                                    ))}
                                </div>
                                <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#6B7280', textAlign: 'center' }}>
                                    Scan the QR code with your banking app to complete payment.
                                </p>
                                <div style={{ background: '#F5F6FA', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#374151', letterSpacing: '0.5px' }}>
                                    GAMERENT·PIX·{cartTotal.toFixed(2).replace('.', '')}·DEMO
                                </div>
                            </div>
                        )}

                        {/* PayPal */}
                        {paymentMethod === 'paypal' && (
                            <div className="flex flex-col items-center py-4 gap-3">
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M7 11C7 11 6 17 6 18H4L6 6h6c3 0 5 1.5 4.5 4.5C16 13.5 13 14 11 14H8.5L8 17H6L7 11z" fill="white"/>
                                        <path d="M9.5 14C9.5 14 8.5 20 8.5 21H6.5L8 12h5c2.5 0 4.5 1.5 4 4C17 18.5 14.5 19 13 19H10.5" fill="#009cde"/>
                                    </svg>
                                </div>
                                <p style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#374151', fontWeight: 600 }}>
                                    Pay with PayPal
                                </p>
                                <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', textAlign: 'center' }}>
                                    You'll be redirected to PayPal to complete your payment securely.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Summary */}
                <div style={{ width: '260px', flexShrink: 0 }}>
                    <div className="sticky" style={{ top: '112px', background: 'white', borderRadius: '20px', border: '1px solid #EBEBEB', padding: '20px' }}>
                        <h3 className="font-bold text-gray-900 mb-4" style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}>
                            Order Total
                        </h3>

                        {/* Itens */}
                        <div className="flex flex-col gap-2 mb-4">
                            {cart.map(({ game, duration }) => (
                                <div key={game.id} className="flex justify-between">
                                    <span className="text-gray-500 truncate mr-2" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', maxWidth: '150px' }}>
                                        {game.name}
                                    </span>
                                    <span className="font-medium text-gray-900 flex-shrink-0" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                                        ${(parseFloat(game.rental_price) * duration).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px', marginBottom: '4px' }}>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-400" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>Subtotal</span>
                                <span style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 500 }}>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>Tax</span>
                                <span style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 500 }}>$0.00</span>
                            </div>
                        </div>

                        <div className="flex justify-between mt-4 mb-5" style={{ borderTop: '1px solid #EBEBEB', paddingTop: '12px' }}>
                            <span className="font-bold text-gray-900" style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif' }}>Total</span>
                            <span className="font-bold text-gray-900" style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif' }}>${cartTotal.toFixed(2)}</span>
                        </div>

                        {error && (
                            <p className="text-red-500 text-center mb-3" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handlePay}
                            disabled={isProcessing || !canPay}
                            className="w-full font-bold transition-opacity hover:opacity-90"
                            style={{
                                background: canPay && !isProcessing ? '#C8F135' : '#F0F0F0',
                                borderRadius: '12px', padding: '13px',
                                fontSize: '14px', fontFamily: 'Afacad, sans-serif',
                                color: canPay && !isProcessing ? '#111' : '#999',
                                border: 'none',
                                opacity: isProcessing ? 0.7 : 1,
                                cursor: isProcessing || !canPay ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            {isProcessing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
                        </button>

                        <p style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', textAlign: 'center', marginTop: '10px' }}>
                            Secure simulated checkout
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
