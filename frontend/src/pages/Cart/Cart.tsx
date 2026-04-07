import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Badge, { platformBadge } from '../../components/ui/Badge'

const DURATIONS = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
]

export default function Cart() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { cart, removeFromCart, updateDuration, cartTotal, clearCart } = useCart()

    if (!isAuthenticated) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="var(--text-muted)" strokeWidth="1.5"/>
            </svg>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Sign in to use your cart</p>
            <button onClick={() => navigate('/login')}
                    style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign In
            </button>
        </div>
    )

    if (cart.length === 0) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="var(--text-muted)" strokeWidth="1.5"/>
            </svg>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Your cart is empty</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Browse games and add them to rent.</p>
            <button onClick={() => navigate('/')}
                    style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Browse Games
            </button>
        </div>
    )

    return (
        <div className="flex gap-8 items-start">
            {}
            <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>
                        Cart <span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--text-muted)' }}>({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                    </h1>
                    <button onClick={clearCart}
                            style={{ fontSize: '13px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Clear all
                    </button>
                </div>

                {cart.map(({ game, duration }) => {
                    const pricePerDay = parseFloat(game.rental_price)
                    const total = pricePerDay * duration
                    return (
                        <div key={game.id} className="rounded-2xl p-4 flex gap-4"
                             style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            {}
                            <img
                                src={game.image || `https://picsum.photos/seed/${game.id}/120/80`}
                                alt={game.name}
                                className="rounded-xl object-cover flex-shrink-0"
                                style={{ width: '110px', height: '74px' }}
                                onError={e => (e.currentTarget.src = `https://picsum.photos/seed/${game.id}/120/80`)}
                            />
                            {}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold truncate" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{game.name}</p>
                                        <Badge variant={platformBadge(game.platform)} className="mt-1">{game.platform_display}</Badge>
                                    </div>
                                    <button onClick={() => removeFromCart(game.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                                {}
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    {DURATIONS.map(({ label, days }) => (
                                        <button key={days} onClick={() => updateDuration(game.id, days)}
                                                className="rounded-lg font-semibold transition-all"
                                                style={{
                                                    padding: '4px 12px', fontSize: '12px', border: 'none', cursor: 'pointer',
                                                    borderRadius: '999px',
                                                    background: duration === days ? 'var(--accent)' : 'var(--surface-2)',
                                                    color: duration === days ? 'white' : 'var(--text-secondary)',
                                                    outline: duration === days ? 'none' : '1px solid var(--border)',
                                                }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        ${pricePerDay.toFixed(2)}/dia × {duration} dias
                                    </span>
                                    <span className="font-bold" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                                        ${total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {}
            <div className="flex flex-col gap-4 rounded-2xl p-5 sticky top-24"
                 style={{ minWidth: '280px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h2 className="font-bold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Order Summary</h2>

                <div className="flex flex-col gap-2">
                    {cart.map(({ game, duration }) => (
                        <div key={game.id} className="flex items-center justify-between gap-2">
                            <span className="truncate" style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '160px' }}>{game.name}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                ${(parseFloat(game.rental_price) * duration).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Total</span>
                        <span className="font-bold" style={{ fontSize: '18px', color: 'var(--accent)' }}>${cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <button onClick={() => navigate('/checkout')}
                        className="w-full font-semibold transition-opacity hover:opacity-90"
                        style={{ padding: '13px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px', borderRadius: '999px' }}>
                    Checkout →
                </button>
                <button onClick={() => navigate('/')}
                        style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                    Continue browsing
                </button>
            </div>
        </div>
    )
}
