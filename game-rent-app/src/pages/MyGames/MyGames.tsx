import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRentals } from '../../services/api'
import api from '../../services/api'
import type { Rental } from '../../types'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'

const REFUND_REASONS = [
    'Game did not work as expected',
    'Wrong game purchased',
    'Technical issues',
    'Changed my mind',
    'Other',
]

export default function MyGames() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [rentals, setRentals] = useState<Rental[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<number | null>(null)
    const [refundModal, setRefundModal] = useState<number | null>(null)
    const [refundReason, setRefundReason] = useState(REFUND_REASONS[0])
    const [refundLoading, setRefundLoading] = useState(false)
    const [copied, setCopied] = useState<number | null>(null)

    useEffect(() => {
        if (!isAuthenticated) { setLoading(false); return }
        getRentals()
            .then(({ data }) => setRentals(data.data ?? data))
            .finally(() => setLoading(false))
    }, [isAuthenticated])

    const copy = (text: string, id: number) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const submitRefund = async (rentalId: number) => {
        setRefundLoading(true)
        try {
            await api.post(`/rentals/${rentalId}/refund/`, { reason: refundReason })
            setRentals(prev => prev.map(r =>
                r.id === rentalId ? { ...r, refund_status: 'pending' } : r
            ))
            setRefundModal(null)
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Could not request refund.')
        } finally {
            setRefundLoading(false)
        }
    }

    if (!isAuthenticated) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Sign in to see your games</p>
            <button onClick={() => navigate('/login')}
                    style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign In
            </button>
        </div>
    )

    const active = rentals.filter(r => r.status === 'active')
    const expired = rentals.filter(r => r.status === 'expired')

    const RentalCard = ({ rental }: { rental: Rental }) => {
        const isOpen = expanded === rental.id
        const refundStatus = rental.refund_status
        const canRefund = rental.status === 'active' && !refundStatus

        return (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* Header row */}
                <button
                    onClick={() => setExpanded(isOpen ? null : rental.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <img
                        src={rental.game_image || `https://picsum.photos/seed/${rental.id}/80/54`}
                        alt={rental.game_name}
                        className="rounded-xl object-cover flex-shrink-0"
                        style={{ width: '80px', height: '54px' }}
                        onError={e => (e.currentTarget.src = `https://picsum.photos/seed/${rental.id}/80/54`)}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{rental.game_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={rental.status === 'active' ? 'active' : 'expired'}>
                                {rental.status === 'active' ? 'Active' : 'Expired'}
                            </Badge>
                            {refundStatus && (
                                <Badge variant={refundStatus as any}>
                                    Refund: {refundStatus}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <path d="M6 9L12 15L18 9" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>

                {/* Expanded details */}
                {isOpen && (
                    <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            {[
                                { label: 'Started', value: new Date(rental.started_at).toLocaleDateString('pt-BR') },
                                { label: 'Expires', value: new Date(rental.expires_at).toLocaleDateString('pt-BR') },
                                { label: 'Total Paid', value: `$${parseFloat(rental.total_paid).toFixed(2)}` },
                                { label: 'Status', value: rental.status === 'active' ? 'Active' : 'Expired' },
                            ].map(({ label, value }) => (
                                <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Key */}
                        <div className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Activation Key</p>
                            <div className="flex items-center justify-between gap-2">
                                <code style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em' }}>
                                    {rental.game_key_value}
                                </code>
                                <button onClick={() => copy(rental.game_key_value, rental.id)}
                                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: copied === rental.id ? 'var(--accent-light)' : 'var(--surface)', color: copied === rental.id ? 'var(--success)' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {copied === rental.id ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Refund button */}
                        {canRefund && (
                            <button onClick={() => setRefundModal(rental.id)}
                                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', color: 'var(--danger)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer', alignSelf: 'flex-start', fontFamily: 'inherit' }}>
                                Request Refund
                            </button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <h1 className="font-bold" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>My Games</h1>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl p-4 flex gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <Skeleton style={{ width: '80px', height: '54px', borderRadius: '12px' }} />
                            <div className="flex flex-col gap-2 flex-1">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : rentals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/>
                    </svg>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>No rentals yet</p>
                    <button onClick={() => navigate('/')}
                            style={{ padding: '8px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                        Browse Games
                    </button>
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <section>
                            <h2 className="font-semibold mb-3" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                                Active <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({active.length})</span>
                            </h2>
                            <div className="flex flex-col gap-3">
                                {active.map(r => <RentalCard key={r.id} rental={r} />)}
                            </div>
                        </section>
                    )}
                    {expired.length > 0 && (
                        <section>
                            <h2 className="font-semibold mb-3" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                                History <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({expired.length})</span>
                            </h2>
                            <div className="flex flex-col gap-3">
                                {expired.map(r => <RentalCard key={r.id} rental={r} />)}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* Refund Modal */}
            {refundModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center"
                     style={{ background: 'rgba(0,0,0,0.6)' }}
                     onClick={() => setRefundModal(null)}>
                    <div className="rounded-2xl p-6 flex flex-col gap-4"
                         style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: '400px', maxWidth: '90vw' }}
                         onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold" style={{ fontSize: '17px', color: 'var(--text-primary)' }}>Request Refund</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select a reason for your refund request.</p>
                        <div className="flex flex-col gap-2">
                            {REFUND_REASONS.map(r => (
                                <button key={r} onClick={() => setRefundReason(r)}
                                        className="text-left rounded-xl px-4 py-2.5 transition-all"
                                        style={{ fontSize: '14px', background: refundReason === r ? 'var(--accent-light)' : 'var(--bg)', color: refundReason === r ? 'var(--accent)' : 'var(--text-primary)', border: `1px solid ${refundReason === r ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', fontWeight: refundReason === r ? 600 : 400, fontFamily: 'inherit' }}>
                                    {r}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setRefundModal(null)}
                                    style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={() => submitRefund(refundModal)}
                                    disabled={refundLoading}
                                    style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '999px', cursor: refundLoading ? 'not-allowed' : 'pointer', opacity: refundLoading ? 0.6 : 1, fontFamily: 'inherit' }}>
                                {refundLoading ? 'Sending...' : 'Request Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
