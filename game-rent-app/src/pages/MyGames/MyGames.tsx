import React, { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getRentals } from '../../services/api'
import api from '../../services/api'

interface MyGamesProps {
    setPage: (p: string) => void
}

const REFUND_REASONS = [
    { value: 'wrong_purchase', label: 'Wrong purchase', desc: 'I accidentally bought the wrong game' },
    { value: 'not_as_expected', label: 'Not as expected', desc: 'The game was different from what I expected' },
    { value: 'did_not_enjoy', label: "Didn't enjoy it", desc: "The game wasn't fun for me" },
    { value: 'technical_issues', label: 'Technical issues', desc: 'The game had bugs or performance problems' },
    { value: 'other', label: 'Other', desc: 'Another reason not listed above' },
]

const RefundBadge = ({ status }: { status: string | null }) => {
    if (!status) return null
    const cfg: Record<string, { bg: string, color: string, icon: string, label: string }> = {
        pending:  { bg: '#FEF3C7', color: '#D97706', icon: '⏳', label: 'Refund Pending' },
        approved: { bg: '#D1FAE5', color: '#059669', icon: '✓',  label: 'Refund Approved' },
        rejected: { bg: '#FEE2E2', color: '#DC2626', icon: '✕',  label: 'Refund Rejected' },
    }
    const c = cfg[status]
    if (!c) return null
    return (
        <span style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', fontWeight: 600, background: c.bg, color: c.color, borderRadius: '10px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {c.icon} {c.label}
        </span>
    )
}

export default function MyGames({ setPage }: MyGamesProps) {
    const { isAuthenticated } = useApp()
    const [rentals, setRentals] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [copiedId, setCopiedId] = useState<number | null>(null)

    // Refund modal
    const [refundRental, setRefundRental] = useState<any | null>(null)
    const [selectedReason, setSelectedReason] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [refundSuccess, setRefundSuccess] = useState(false)
    const [refundError, setRefundError] = useState('')

    const loadRentals = () => {
        if (!isAuthenticated) return
        getRentals()
            .then(({ data }) => setRentals(data))
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }

    useEffect(() => { loadRentals() }, [isAuthenticated])

    const GameIcon = ({ size = 40 }: { size?: number }) => (
        <div style={{ marginBottom: '16px', color: '#000000' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12H10M9 11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15" cy="12" r="1" fill="currentColor"/>
                <circle cx="17" cy="10" r="1" fill="currentColor"/>
            </svg>
        </div>
    )

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                <GameIcon />
                <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}>Your games will appear here</h2>
                <p className="text-gray-400 mb-6 text-center" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}>Sign in to access your rented games and activation keys.</p>
            </div>
        )
    }

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Afacad, sans-serif' }}>Loading...</p>
        </div>
    )

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const getDaysLeft = (expires: string) => Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000))
    const getHoursRented = (started: string) => Math.max(0, Math.floor((Date.now() - new Date(started).getTime()) / 3600000))

    const copyKey = (id: number, key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const openRefundModal = (rental: any) => {
        setRefundRental(rental)
        setSelectedReason(null)
        setRefundSuccess(false)
        setRefundError('')
    }

    const closeRefundModal = () => {
        setRefundRental(null)
        setSelectedReason(null)
        setRefundSuccess(false)
        setRefundError('')
    }

    const submitRefund = async () => {
        if (!selectedReason || !refundRental) return
        setSubmitting(true)
        setRefundError('')
        try {
            const reasonLabel = REFUND_REASONS.find(r => r.value === selectedReason)?.label || selectedReason
            await api.post(`/rentals/${refundRental.id}/refund/`, { reason: reasonLabel })
            setRefundSuccess(true)
            // Atualiza a lista para refletir o novo status
            loadRentals()
        } catch (e: any) {
            setRefundError(e?.response?.data?.error || 'Error submitting refund request.')
        } finally {
            setSubmitting(false)
        }
    }

    const statusColor: Record<string, string> = {
        active: '#22C55E', expired: '#9CA3AF', pending: '#F59E0B',
    }

    if (rentals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                <GameIcon />
                <h2 className="font-bold text-gray-900 mb-2" style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}>No games rented yet</h2>
                <p className="text-gray-400 mb-6 text-center" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', maxWidth: '320px' }}>Browse the catalog and rent your first game!</p>
                <button onClick={() => setPage('home')} style={{ background: '#1A1A1A', borderRadius: '12px', padding: '10px 28px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', border: 'none', cursor: 'pointer' }}>Browse Games</button>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-bold text-gray-900" style={{ fontSize: '20px', fontFamily: 'Afacad, sans-serif' }}>
                    My Games
                    <span className="text-gray-400 font-normal ml-2" style={{ fontSize: '14px' }}>{rentals.length} {rentals.length === 1 ? 'rental' : 'rentals'}</span>
                </h1>
            </div>

            <div className="flex flex-col gap-3">
                {rentals.map((rental) => {
                    const isExpanded = expandedId === rental.id
                    const daysLeft = getDaysLeft(rental.expires_at)
                    const isActive = rental.status === 'active'
                    const refundStatus: string | null = rental.refund_status

                    return (
                        <div key={rental.id} className="bg-white" style={{ borderRadius: '16px', border: '1px solid #EBEBEB', overflow: 'hidden' }}>
                            {/* Header */}
                            <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                 style={{ padding: '16px 20px' }}
                                 onClick={() => setExpandedId(isExpanded ? null : rental.id)}>
                                <img src={rental.game_image || `https://picsum.photos/seed/${rental.id * 5}/80/60`}
                                     alt={rental.game_name} className="object-cover flex-shrink-0"
                                     style={{ width: '64px', height: '48px', borderRadius: '8px' }}
                                     onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${rental.id * 5}/80/60` }} />

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}>{rental.game_name}</p>
                                    <p className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                                        Expires {formatDate(rental.expires_at)}
                                        {isActive && ` · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Refund badge no header quando há status */}
                                    {refundStatus && <RefundBadge status={refundStatus} />}

                                    <span className="font-medium"
                                          style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: statusColor[rental.status] || '#999', background: `${statusColor[rental.status]}18`, borderRadius: '20px', padding: '4px 10px' }}>
                                        {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                                    </span>
                                </div>

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                     style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                                    <path d="M6 9L12 15L18 9" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {/* Expanded */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid #F0F0F0', padding: '16px 20px', background: '#FAFAFA' }}>
                                    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className="flex flex-col gap-3">
                                            {[
                                                { label: 'Started', value: formatDate(rental.started_at) },
                                                { label: 'Expires', value: formatDate(rental.expires_at) },
                                                { label: 'Total Paid', value: `$${parseFloat(rental.total_paid).toFixed(2)}` },
                                                { label: 'Time Rented', value: `${getHoursRented(rental.started_at)}h` },
                                            ].map(({ label, value }) => (
                                                <div key={label}>
                                                    <p className="text-gray-400" style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif' }}>{label}</p>
                                                    <p className="font-semibold text-gray-800" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {/* Activation key */}
                                            <div className="w-full">
                                                <p className="text-gray-400 mb-1" style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif' }}>Activation Key</p>
                                                {rental.game_key_value ? (
                                                    <div className="flex items-center justify-between"
                                                         style={{ background: 'white', borderRadius: '8px', border: '1px solid #E0E0E0', padding: '8px 12px' }}>
                                                        <span className="font-mono font-bold text-gray-800" style={{ fontSize: '12px', letterSpacing: '1px' }}>{rental.game_key_value}</span>
                                                        <button onClick={() => copyKey(rental.id, rental.game_key_value)}
                                                                style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: copiedId === rental.id ? '#22C55E' : '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                            {copiedId === rental.id ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Not available</p>
                                                )}
                                            </div>

                                            {/* Refund area */}
                                            {isActive && (
                                                <div>
                                                    <p className="text-gray-400 mb-2" style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif' }}>Refund</p>

                                                    {refundStatus === 'pending' && (
                                                        <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '10px 14px' }}>
                                                            <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#D97706' }}>⏳ Refund under review</p>
                                                            <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#92400E', marginTop: '2px' }}>Your request is pending admin approval.</p>
                                                        </div>
                                                    )}

                                                    {refundStatus === 'approved' && (
                                                        <div style={{ background: '#D1FAE5', borderRadius: '10px', padding: '10px 14px' }}>
                                                            <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#059669' }}>✓ Refund Approved</p>
                                                            <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#065F46', marginTop: '2px' }}>Your refund has been approved. The game has been returned.</p>
                                                        </div>
                                                    )}

                                                    {refundStatus === 'rejected' && (
                                                        <div style={{ background: '#FEE2E2', borderRadius: '10px', padding: '10px 14px' }}>
                                                            <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#DC2626' }}>✕ Refund Rejected</p>
                                                            <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#991B1B', marginTop: '2px' }}>Your refund request was not approved.</p>
                                                        </div>
                                                    )}

                                                    {!refundStatus && (
                                                        <button onClick={(e) => { e.stopPropagation(); openRefundModal(rental) }}
                                                                style={{ border: '1px solid #FECACA', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#EF4444', background: 'white', cursor: 'pointer' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                            Request Refund
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* ── Refund Modal ── */}
            {refundRental && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                     onClick={e => { if (e.target === e.currentTarget && !refundSuccess) closeRefundModal() }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>

                        {refundSuccess ? (
                            <div className="flex flex-col items-center text-center" style={{ padding: '8px 0' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '24px' }}>✓</div>
                                <h2 style={{ fontSize: '18px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>Request Submitted!</h2>
                                <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#6B7280', marginBottom: '24px' }}>
                                    Your refund request for <strong>{refundRental.game_name}</strong> has been submitted and is awaiting admin review.
                                </p>
                                <button onClick={closeRefundModal}
                                        style={{ background: '#1A1A1A', color: 'white', borderRadius: '12px', padding: '10px 28px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <img src={refundRental.game_image || `https://picsum.photos/seed/${refundRental.id * 5}/80/60`}
                                             alt={refundRental.game_name}
                                             style={{ width: '52px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                                             onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${refundRental.id * 5}/80/60` }} />
                                        <div>
                                            <h2 style={{ fontSize: '16px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#1A1A1A' }}>Request Refund</h2>
                                            <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF' }}>{refundRental.game_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={closeRefundModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    </button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Amount Paid', value: `$${parseFloat(refundRental.total_paid).toFixed(2)}` },
                                        { label: 'Time Rented', value: `${getHoursRented(refundRental.started_at)}h` },
                                        { label: 'Days Left', value: `${getDaysLeft(refundRental.expires_at)}d` },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '10px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                            <p style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#1A1A1A', marginTop: '2px' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Why are you requesting a refund?</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                    {REFUND_REASONS.map(r => (
                                        <button key={r.value} onClick={() => setSelectedReason(r.value)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: selectedReason === r.value ? '2px solid #1A1A1A' : '1px solid #E0E0E0', background: selectedReason === r.value ? '#F9FAFB' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedReason === r.value ? '5px solid #1A1A1A' : '2px solid #D1D5DB', flexShrink: 0, transition: 'all 0.15s' }} />
                                            <div>
                                                <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 600, color: '#1A1A1A' }}>{r.label}</p>
                                                <p style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginTop: '1px' }}>{r.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {refundError && (
                                    <p style={{ fontSize: '13px', color: '#EF4444', fontFamily: 'Afacad, sans-serif', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px' }}>
                                        {refundError}
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={closeRefundModal} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid #E0E0E0', background: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#374151', fontWeight: 600 }}>Cancel</button>
                                    <button onClick={submitRefund} disabled={!selectedReason || submitting}
                                            style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', cursor: !selectedReason || submitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, opacity: !selectedReason || submitting ? 0.5 : 1 }}>
                                        {submitting ? 'Submitting...' : 'Submit Refund Request'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
