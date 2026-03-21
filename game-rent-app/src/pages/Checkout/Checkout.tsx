import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { createRental } from '../../services/api'
import type { Rental } from '../../types'

type PayMethod = 'card' | 'pix' | 'paypal'

export default function Checkout() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { cart, cartTotal, clearCart } = useCart()

    const [method, setMethod] = useState<PayMethod>('card')
    const [cardNum, setCardNum] = useState('')
    const [cardName, setCardName] = useState('')
    const [cardExp, setCardExp] = useState('')
    const [cardCvc, setCardCvc] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Guard roda só no mount — evita conflito quando clearCart() esvazia o cart durante o submit
    useEffect(() => {
        if (!isAuthenticated) navigate('/login')
        else if (cart.length === 0) navigate('/cart')
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fmtCard = (v: string) =>
        v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

    const fmtExp = (v: string) => {
        const d = v.replace(/\D/g, '').slice(0, 4)
        return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
    }

    const cardValid = method !== 'card' || (
        cardNum.replace(/\s/g, '').length === 16 &&
        cardName.trim().length >= 3 &&
        cardExp.length === 5 &&
        cardCvc.length >= 3
    )

    const submit = async () => {
        if (!cardValid) return
        setLoading(true)
        setError('')
        try {
            const results: Rental[] = []
            for (const { game, duration } of cart) {
                const { data } = await createRental({ game_id: game.id, rental_days: duration })
                results.push(data.data ?? data)
            }
            navigate('/confirmation', { state: { rentals: results } })
            clearCart()
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Checkout failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes processingPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.97); }
                }
            `}</style>

            {/* Processing overlay */}
            {loading && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '20px',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        border: '4px solid rgba(255,255,255,0.15)',
                        borderTopColor: 'white',
                        animation: 'spin 0.75s linear infinite',
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, animation: 'processingPulse 1.5s ease infinite' }}>
                            Processing payment...
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: '6px' }}>
                            Please don't close this page
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-8 items-start max-w-4xl mx-auto">
                {/* Left: Payment */}
                <div className="flex flex-col gap-6 flex-1">
                    <div>
                        <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>Checkout</h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Payment method */}
                    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p className="font-semibold mb-4" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Payment Method</p>
                        <div className="flex gap-3 mb-5">
                            {(['card', 'pix', 'paypal'] as PayMethod[]).map(m => (
                                <button key={m} onClick={() => setMethod(m)}
                                        className="font-semibold capitalize transition-all"
                                        style={{
                                            padding: '8px 18px', fontSize: '13px', border: 'none', cursor: 'pointer',
                                            borderRadius: '999px',
                                            background: method === m ? 'var(--accent)' : 'var(--surface-2)',
                                            color: method === m ? 'white' : 'var(--text-secondary)',
                                            outline: method === m ? 'none' : '1px solid var(--border)',
                                        }}>
                                    {m === 'card' ? 'Credit Card' : m === 'pix' ? 'Pix' : 'PayPal'}
                                </button>
                            ))}
                        </div>

                        {method === 'card' && (
                            <div className="flex flex-col gap-3">
                                {[
                                    { label: 'Card number', value: cardNum, setter: (v: string) => setCardNum(fmtCard(v)), placeholder: '0000 0000 0000 0000' },
                                    { label: 'Cardholder name', value: cardName, setter: setCardName, placeholder: 'As on the card' },
                                ].map(({ label, value, setter, placeholder }) => (
                                    <div key={label}>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
                                        <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                                               className="w-full px-4 py-2.5 outline-none"
                                               style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px', borderRadius: '12px' }}
                                               onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                               onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                                    </div>
                                ))}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Expiry', value: cardExp, setter: (v: string) => setCardExp(fmtExp(v)), placeholder: 'MM/YY' },
                                        { label: 'CVC', value: cardCvc, setter: (v: string) => setCardCvc(v.replace(/\D/g, '').slice(0, 4)), placeholder: '•••' },
                                    ].map(({ label, value, setter, placeholder }) => (
                                        <div key={label}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
                                            <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                                                   className="w-full rounded-xl px-4 py-2.5 outline-none"
                                                   style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
                                                   onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                                   onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {method === 'pix' && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="rounded-2xl flex items-center justify-center font-bold" style={{ width: '160px', height: '160px', background: 'var(--bg)', border: '2px dashed var(--border)', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    QR Code
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Scan with your banking app</p>
                            </div>
                        )}

                        {method === 'paypal' && (
                            <div className="flex flex-col items-center gap-3 py-6">
                                <div className="rounded-xl px-8 py-3 font-bold" style={{ background: '#FFC439', color: '#003087', fontSize: '16px', cursor: 'pointer' }}>
                                    Pay<span style={{ color: '#009CDE' }}>Pal</span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>You'll be redirected to PayPal.</p>
                            </div>
                        )}
                    </div>

                    {error && <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>{error}</p>}
                </div>

                {/* Right: Summary */}
                <div className="flex flex-col gap-4 rounded-2xl p-5 sticky top-24"
                     style={{ minWidth: '280px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <h2 className="font-bold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Order Summary</h2>

                    <div className="flex flex-col gap-2">
                        {cart.map(({ game, duration }) => (
                            <div key={game.id} className="flex items-center justify-between gap-2">
                                <span className="truncate" style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '160px' }}>{game.name}</span>
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    R${(parseFloat(game.rental_price) * duration).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <div className="flex items-center justify-between">
                            <span className="font-bold" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Total</span>
                            <span className="font-bold" style={{ fontSize: '20px', color: 'var(--accent)' }}>R${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={submit}
                        disabled={loading || !cardValid}
                        className="w-full font-semibold transition-opacity"
                        style={{
                            padding: '13px', background: 'var(--accent)', color: 'white', border: 'none',
                            borderRadius: '999px',
                            cursor: loading || !cardValid ? 'not-allowed' : 'pointer',
                            opacity: loading || !cardValid ? 0.5 : 1, fontSize: '15px',
                        }}
                    >
                        {loading ? 'Processing...' : `Confirm & Pay · R$${cartTotal.toFixed(2)}`}
                    </button>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        By confirming you agree to our terms of service.
                    </p>
                </div>
            </div>
        </>
    )
}
