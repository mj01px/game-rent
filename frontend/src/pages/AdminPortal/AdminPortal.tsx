import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Game } from '../../types'
import api from '../../services/api'
import Stars from '../../components/ui/Stars'

type AdminTab = 'overview' | 'games' | 'publishers' | 'users' | 'refunds'
type RefundFilter = 'pending' | 'approved' | 'rejected' | 'all'

const PLATFORMS = ['pc', 'playstation', 'ps5', 'xbox', 'switch']
const GENRES_LIST = ['Action', 'Adventure', 'RPG', 'FPS', 'Sports', 'Horror', 'Racing', 'Platform', 'Simulation', 'Multiplayer']
const emptyForm = { name: '', description: '', platform: 'pc', original_price: '', rental_price: '', rating: '', publisher_id: '', release_date: '', genre: [] as string[], is_featured: false, is_new: false, keys_to_add: '' }

const inputCls: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box' }
const labelCls: React.CSSProperties = { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }

function StatusPill({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string }> = {
        pending:  { bg: 'rgba(251,188,4,0.12)',  color: '#B8860B' },
        approved: { bg: 'rgba(30,142,62,0.10)',  color: 'var(--success)' },
        rejected: { bg: 'rgba(217,48,37,0.10)',  color: 'var(--danger)' },
    }
    const s = map[status] ?? { bg: 'var(--surface-2)', color: 'var(--text-muted)' }
    return (
        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: s.bg, color: s.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {status}
        </span>
    )
}

export default function AdminPortal() {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()

    const [tab, setTab] = useState<AdminTab>('overview')
    const [games, setGames]   = useState<Game[]>([])
    const [users, setUsers]   = useState<any[]>([])
    const [refunds, setRefunds] = useState<any[]>([])
    const [refundFilter, setRefundFilter] = useState<RefundFilter>('pending')
    const [loading, setLoading] = useState(false)
    const [gSearch, setGSearch] = useState('')
    const [uSearch, setUSearch] = useState('')
    const [expandedUser, setExpandedUser] = useState<number | null>(null)
    const [resetSent, setResetSent] = useState<number | null>(null)
    const [publishers, setPublishers] = useState<{ id: number; name: string }[]>([])
    const [newPubName, setNewPubName] = useState('')
    const [editPub, setEditPub] = useState<{ id: number; name: string } | null>(null)
    const [editPubName, setEditPubName] = useState('')
    const [deletePubConfirm, setDeletePubConfirm] = useState<number | null>(null)
    const [pubSaving, setPubSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editGame, setEditGame] = useState<Game | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const imgRef = useRef<HTMLInputElement>(null)

    if (!isAuthenticated || !user?.is_staff) { navigate('/'); return null }

    useEffect(() => {
        fetchGames(); fetchUsers(); fetchRefunds(); fetchPublishers()
    }, [])

    useEffect(() => {
        if (tab === 'games') { fetchGames(); fetchPublishers() }
        else if (tab === 'publishers') fetchPublishers()
        else if (tab === 'users') fetchUsers()
        else if (tab === 'refunds') fetchRefunds()
    }, [tab])

    const fetchGames      = () => { setLoading(true); api.get('/games/', { params: { page_size: 100 } }).then(({ data }) => setGames(data.data ?? data)).finally(() => setLoading(false)) }
    const fetchUsers      = () => api.get('/rentals/admin/users/').then(({ data }) => setUsers(data.data ?? data))
    const fetchRefunds    = () => api.get('/rentals/admin/refunds/').then(({ data }) => setRefunds(data.data ?? data))
    const fetchPublishers = () => api.get('/games/publishers/').then(({ data }) => setPublishers(data.data ?? data))

    const pendingCount   = refunds.filter(r => r.status === 'pending').length
    const availableKeys  = games.reduce((s, g) => s + (g.available_keys || 0), 0)
    const outOfStock     = games.filter(g => g.available_keys === 0).length

    const openCreate = () => { setEditGame(null); setForm(emptyForm); setImageFile(null); setShowModal(true) }
    const openEdit = (g: Game) => {
        setEditGame(g)
        setForm({ name: g.name, description: g.description, platform: g.platform, original_price: g.original_price, rental_price: g.rental_price, rating: g.rating, publisher_id: g.publisher?.id ? String(g.publisher.id) : '', release_date: g.release_date || '', genre: g.genre || [], is_featured: g.is_featured, is_new: g.is_new, keys_to_add: '' })
        setImageFile(null); setShowModal(true)
    }
    const saveGame = async () => {
        setSaving(true)
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => {
            if (k === 'genre') fd.append(k, JSON.stringify(v))
            else if (k === 'keys_to_add' && (!v || Number(v) <= 0)) return
            else fd.append(k, String(v))
        })
        if (imageFile) fd.append('image', imageFile)
        try {
            if (editGame) await api.patch(`/games/admin/${editGame.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            else await api.post('/games/admin/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setShowModal(false); fetchGames()
        } catch (e: any) { alert(e?.response?.data?.error || 'Save failed.') }
        finally { setSaving(false) }
    }
    const deleteGame = async (id: number) => {
        try { await api.delete(`/games/admin/${id}/`); fetchGames() } catch { alert('Delete failed.') }
        finally { setDeleteConfirm(null) }
    }
    const resolveRefund = async (id: number, action: 'approve' | 'reject') => {
        try { await api.post(`/rentals/admin/refunds/${id}/action/`, { action }); fetchRefunds() } catch { alert('Action failed.') }
    }
    const sendReset = async (userId: number) => {
        try { await api.post(`/rentals/admin/users/${userId}/send-reset/`); setResetSent(userId); setTimeout(() => setResetSent(null), 3000) } catch { alert('Failed to send.') }
    }

    const createPub = async () => {
        if (!newPubName.trim()) return
        setPubSaving(true)
        try { await api.post('/games/publishers/admin/create/', { name: newPubName }); setNewPubName(''); fetchPublishers() }
        catch (e: any) { alert(e?.response?.data?.error?.message || 'Falha ao criar publisher.') }
        finally { setPubSaving(false) }
    }
    const savePub = async () => {
        if (!editPub || !editPubName.trim()) return
        try { await api.patch(`/games/publishers/admin/${editPub.id}/`, { name: editPubName }); setEditPub(null); fetchPublishers() }
        catch (e: any) { alert(e?.response?.data?.error?.message || 'Falha ao salvar.') }
    }
    const deletePub = async (id: number) => {
        try { await api.delete(`/games/publishers/admin/${id}/`); fetchPublishers() }
        catch { alert('Falha ao deletar publisher.') }
        finally { setDeletePubConfirm(null) }
    }

    const filteredGames   = games.filter(g => g.name.toLowerCase().includes(gSearch.toLowerCase()))
    const filteredUsers   = users.filter(u => u.username?.toLowerCase().includes(uSearch.toLowerCase()) || u.email?.toLowerCase().includes(uSearch.toLowerCase()))
    const filteredRefunds = refunds.filter(r => refundFilter === 'all' || r.status === refundFilter)

    const TABS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'overview',    label: 'Overview',    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> },
        { id: 'games',       label: 'Games',       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12H10M9 11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="17" cy="10" r="1.3" fill="currentColor"/></svg>, badge: games.length },
        { id: 'publishers',  label: 'Publishers',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, badge: publishers.length },
        { id: 'users',       label: 'Users',       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21c0-4 3.13-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 11v6M22 14h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, badge: users.length },
        { id: 'refunds',     label: 'Refunds',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M3 12V6M3 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, badge: pendingCount },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Admin Portal</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>Manage games, users and refund requests</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                    Logged as <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>
                </div>
            </div>

            {}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '4px' }}>
                {TABS.map(({ id, label, icon, badge }) => {
                    const active = tab === id
                    return (
                        <button key={id} onClick={() => setTab(id)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            padding: '9px 12px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                            borderRadius: '10px', fontFamily: 'inherit', position: 'relative',
                            background: active ? 'var(--accent)' : 'transparent',
                            color: active ? 'white' : 'var(--text-secondary)',
                            transition: 'all 150ms ease',
                        }}>
                            {icon}
                            {label}
                            {badge !== undefined && badge > 0 && !active && (
                                <span style={{
                                    minWidth: '18px', height: '18px', borderRadius: '999px', padding: '0 4px',
                                    background: id === 'refunds' ? 'var(--danger)' : 'var(--accent)',
                                    color: 'white', fontSize: '10px', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {}
            {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {[
                            { label: 'Total Games', value: games.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--accent)" strokeWidth="1.8"/><path d="M8 12H10M9 11V13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="12" r="1.3" fill="var(--accent)"/><circle cx="17" cy="10" r="1.3" fill="var(--accent)"/></svg>, accent: 'var(--accent)', bg: 'var(--accent-light)' },
                            { label: 'Total Users', value: users.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="var(--success)" strokeWidth="1.8"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round"/></svg>, accent: 'var(--success)', bg: 'rgba(30,142,62,0.08)' },
                            { label: 'Pending Refunds', value: pendingCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109 9" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round"/><path d="M3 12V6M3 12H9" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round"/></svg>, accent: 'var(--danger)', bg: 'rgba(217,48,37,0.08)' },
                            { label: 'Available Keys', value: availableKeys, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="#B8860B" strokeWidth="1.8" strokeLinecap="round"/></svg>, accent: '#B8860B', bg: 'rgba(251,188,4,0.10)' },
                        ].map(({ label, value, icon, accent, bg }) => (
                            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {icon}
                                    </div>
                                </div>
                                <p style={{ fontSize: '32px', fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Stock Alerts</h3>
                            {outOfStock === 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>All games have keys available.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {games.filter(g => g.available_keys === 0).slice(0, 5).map(g => (
                                        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={g.image || `https://picsum.photos/seed/${g.id}/60/40`} alt={g.name}
                                                 style={{ width: '44px', height: '30px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                                 onError={e => (e.currentTarget.src = `https://picsum.photos/seed/${g.id}/60/40`)} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--danger)' }}>Out of stock</p>
                                            </div>
                                            <button onClick={() => { openEdit(g); setTab('games') }} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}>Edit</button>
                                        </div>
                                    ))}
                                    {outOfStock > 5 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+{outOfStock - 5} more out of stock</p>}
                                </div>
                            )}
                        </div>

                        {}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Pending Refunds</h3>
                                {pendingCount > 0 && (
                                    <button onClick={() => setTab('refunds')} style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        View all →
                                    </button>
                                )}
                            </div>
                            {pendingCount === 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No pending refunds.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {refunds.filter(r => r.status === 'pending').slice(0, 4).map(r => (
                                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.game_name}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {r.user_username} · ${parseFloat(r.total_paid || 0).toFixed(2)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                <button onClick={() => resolveRefund(r.id, 'approve')} style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, background: 'rgba(30,142,62,0.1)', color: 'var(--success)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                                                <button onClick={() => resolveRefund(r.id, 'reject')} style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, background: 'rgba(217,48,37,0.1)', color: 'var(--danger)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            {tab === 'games' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {}
                        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2"/>
                                <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <input value={gSearch} onChange={e => setGSearch(e.target.value)} placeholder="Search games..."
                                   style={{ ...inputCls, paddingLeft: '36px', maxWidth: '100%' }} />
                        </div>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}</span>
                        <button onClick={openCreate} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '9px 18px', background: 'var(--accent)', color: 'white',
                            border: 'none', borderRadius: '999px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                            Add Game
                        </button>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                    {['Game', 'Platform', 'Rental/dia', 'Rating', 'Stock', 'Tags', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '11px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGames.map((g, i) => (
                                    <tr key={g.id}
                                        style={{ borderBottom: i < filteredGames.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 120ms ease' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img src={g.image || `https://picsum.photos/seed/${g.id}/60/40`} alt={g.name}
                                                     style={{ width: '56px', height: '38px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                                                     onError={e => (e.currentTarget.src = `https://picsum.photos/seed/${g.id}/60/40`)} />
                                                <div>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</p>
                                                    {g.publisher && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{g.publisher.name}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                                                {g.platform_display}
                                            </span>
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            ${parseFloat(g.rental_price).toFixed(2)}
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Stars rating={parseFloat(g.rating)} size={11} />
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{parseFloat(g.rating).toFixed(1)}</span>
                                            </div>
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                background: g.available_keys === 0 ? 'rgba(217,48,37,0.08)' : 'rgba(30,142,62,0.08)',
                                                color: g.available_keys === 0 ? 'var(--danger)' : 'var(--success)',
                                            }}>
                                                {g.available_keys === 0 ? 'Out of stock' : `${g.available_keys} keys`}
                                            </span>
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                {g.is_featured && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: 'var(--accent-light)', color: 'var(--accent)' }}>★ Featured</span>}
                                                {g.is_new && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: '#E6F4EA', color: '#1E8E3E' }}>New</span>}
                                            </div>
                                        </td>
                                        {}
                                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <button onClick={() => openEdit(g)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                                                {deleteConfirm === g.id ? (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button onClick={() => deleteGame(g.id)} style={{ padding: '5px 10px', fontSize: '12px', fontWeight: 600, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
                                                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteConfirm(g.id)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'rgba(217,48,37,0.06)', color: 'var(--danger)', border: '1px solid rgba(217,48,37,0.15)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredGames.length === 0 && (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{loading ? 'Loading...' : 'No games found.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {}
            {tab === 'publishers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Novo Publisher</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input value={newPubName} onChange={e => setNewPubName(e.target.value)}
                                   placeholder="Nome do publisher / estúdio..."
                                   style={{ ...inputCls, flex: 1 }}
                                   onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                   onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                   onKeyDown={e => e.key === 'Enter' && createPub()} />
                            <button onClick={createPub} disabled={pubSaving || !newPubName.trim()} style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px',
                                background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px',
                                fontWeight: 600, fontSize: '13px', cursor: pubSaving || !newPubName.trim() ? 'not-allowed' : 'pointer',
                                opacity: pubSaving || !newPubName.trim() ? 0.5 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap',
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                {pubSaving ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>

                    {}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Publisher</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ações</span>
                        </div>
                        {publishers.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Nenhum publisher cadastrado.</p>
                            </div>
                        ) : publishers.map((p, i) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < publishers.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                {}
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="var(--accent)" strokeWidth="1.8"/><path d="M9 22V12h6v10" stroke="var(--accent)" strokeWidth="1.8"/></svg>
                                </div>
                                {}
                                {editPub?.id === p.id ? (
                                    <input value={editPubName} onChange={e => setEditPubName(e.target.value)}
                                           style={{ ...inputCls, flex: 1 }}
                                           onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                           onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                           onKeyDown={e => { if (e.key === 'Enter') savePub(); if (e.key === 'Escape') setEditPub(null) }}
                                           autoFocus />
                                ) : (
                                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                                )}
                                {}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {editPub?.id === p.id ? (
                                        <>
                                            <button onClick={savePub} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
                                            <button onClick={() => setEditPub(null)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
                                        </>
                                    ) : deletePubConfirm === p.id ? (
                                        <>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confirmar?</span>
                                            <button onClick={() => deletePub(p.id)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Deletar</button>
                                            <button onClick={() => setDeletePubConfirm(null)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditPub(p); setEditPubName(p.name) }} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                                            <button onClick={() => setDeletePubConfirm(p.id)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'rgba(217,48,37,0.06)', color: 'var(--danger)', border: '1px solid rgba(217,48,37,0.15)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Deletar</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {}
            {tab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2"/>
                                <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <input value={uSearch} onChange={e => setUSearch(e.target.value)} placeholder="Search by username or email..."
                                   style={{ ...inputCls, paddingLeft: '36px', maxWidth: '100%' }} />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                        {filteredUsers.map((u, i) => (
                            <div key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                {}
                                <button
                                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms ease' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {}
                                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {u.avatar
                                            ? <img src={u.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{u.username?.slice(0, 1).toUpperCase()}</span>
                                        }
                                    </div>
                                    {}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</span>
                                            {u.is_staff && <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: 'var(--accent-light)', color: 'var(--accent)' }}>Admin</span>}
                                            {!u.is_verified && <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: 'rgba(251,188,4,0.12)', color: '#B8860B' }}>Unverified</span>}
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{u.email}</p>
                                    </div>
                                    {}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.rental_count ?? 0}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>rentals</p>
                                    </div>
                                    {}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: expandedUser === u.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease', color: 'var(--text-muted)' }}>
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>

                                {}
                                {expandedUser === u.id && (
                                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '16px' }}>
                                            {[
                                                { label: 'User ID', value: `#${u.id}` },
                                                { label: 'Joined', value: u.date_joined ? new Date(u.date_joined).toLocaleDateString('pt-BR') : '—' },
                                                { label: 'Total Rentals', value: u.rental_count ?? 0 },
                                            ].map(({ label, value }) => (
                                                <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '3px' }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {}
                                        <button
                                            onClick={() => sendReset(u.id)}
                                            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: resetSent === u.id ? 'rgba(30,142,62,0.08)' : 'var(--bg)', color: resetSent === u.id ? 'var(--success)' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease' }}
                                        >
                                            {resetSent === u.id
                                                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round"/></svg> Reset Email Sent</>
                                                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8"/></svg> Send Password Reset</>
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No users found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {}
            {tab === 'refunds' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(['pending', 'approved', 'rejected', 'all'] as RefundFilter[]).map(f => {
                            const count = f === 'all' ? refunds.length : refunds.filter(r => r.status === f).length
                            return (
                                <button key={f} onClick={() => setRefundFilter(f)} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '7px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                    borderRadius: '999px', textTransform: 'capitalize',
                                    background: refundFilter === f ? 'var(--accent)' : 'var(--surface)',
                                    color: refundFilter === f ? 'white' : 'var(--text-secondary)',
                                    outline: refundFilter === f ? 'none' : '1px solid var(--border)',
                                }}>
                                    {f}
                                    <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: refundFilter === f ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)', color: refundFilter === f ? 'white' : 'var(--text-muted)' }}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredRefunds.map(r => (
                            <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img src={r.game_image || `https://picsum.photos/seed/${r.game_id}/80/54`} alt={r.game_name}
                                     style={{ width: '72px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                                     onError={e => (e.currentTarget.src = `https://picsum.photos/seed/${r.game_id}/80/54`)} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.game_name}</p>
                                        <StatusPill status={r.status} />
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        by <strong style={{ color: 'var(--text-secondary)' }}>{r.user_username}</strong>
                                        {' · '}${parseFloat(r.total_paid || 0).toFixed(2)} paid
                                    </p>
                                    {r.reason && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>"{r.reason}"</p>
                                    )}
                                </div>
                                {r.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => resolveRefund(r.id, 'approve')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, background: 'rgba(30,142,62,0.08)', color: 'var(--success)', border: '1px solid rgba(30,142,62,0.2)', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                            Approve
                                        </button>
                                        <button onClick={() => resolveRefund(r.id, 'reject')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, background: 'rgba(217,48,37,0.06)', color: 'var(--danger)', border: '1px solid rgba(217,48,37,0.15)', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredRefunds.length === 0 && (
                            <div style={{ padding: '48px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No {refundFilter !== 'all' ? refundFilter : ''} refunds found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '32px', paddingBottom: '32px', overflowY: 'auto', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
                     onClick={() => setShowModal(false)}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', width: '560px', maxWidth: '95vw', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', margin: 'auto' }}
                         onClick={e => e.stopPropagation()}>

                        {}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{editGame ? 'Edit Game' : 'Add New Game'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                        </div>

                        {}
                        <div>
                            <label style={labelCls}>Cover Image</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '120px', height: '80px', borderRadius: '12px', background: 'var(--bg)', border: '2px dashed var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(imageFile || editGame?.image) ? (
                                        <img src={imageFile ? URL.createObjectURL(imageFile) : editGame!.image!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <button onClick={() => imgRef.current?.click()} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {imageFile ? 'Change Image' : 'Upload Image'}
                                    </button>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</p>
                                </div>
                                <input ref={imgRef} type="file" accept="image}
                        <div>
                            <label style={labelCls}>Publisher</label>
                            <select value={form.publisher_id} onChange={e => setForm(f => ({ ...f, publisher_id: e.target.value }))}
                                    style={{ ...inputCls, cursor: 'pointer' }}
                                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                                <option value="">— Selecione um publisher —</option>
                                {publishers.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                            </select>
                            {publishers.length === 0 && (
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Nenhum publisher cadastrado. <button onClick={() => { setShowModal(false); setTab('publishers') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '11px', fontFamily: 'inherit' }}>Cadastrar agora →</button>
                                </p>
                            )}
                        </div>

                        {}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            {[
                                { label: 'Game Name', key: 'name', type: 'text', placeholder: 'e.g. God of War' },
                                { label: 'Original Price ($)', key: 'original_price', type: 'number', placeholder: '299.90' },
                                { label: 'Rental Price / day ($)', key: 'rental_price', type: 'number', placeholder: '9.99' },
                                { label: 'Rating (0–5)', key: 'rating', type: 'number', placeholder: '4.5' },
                                { label: 'Release Date', key: 'release_date', type: 'date', placeholder: '' },
                                { label: editGame ? 'Keys to Add' : 'Initial Keys', key: 'keys_to_add', type: 'number', placeholder: editGame ? 'e.g. 10' : 'e.g. 50' },
                            ].map(({ label, key, type, placeholder }) => (
                                <div key={key}>
                                    <label style={labelCls}>{label}</label>
                                    <input type={type} value={(form as any)[key]} placeholder={placeholder}
                                           onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                           style={inputCls}
                                           onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                           onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                                </div>
                            ))}
                        </div>

                        {}
                        <div>
                            <label style={labelCls}>Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Brief game description..."
                                      style={{ ...inputCls, resize: 'none', lineHeight: 1.6 }}
                                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                        </div>

                        {}
                        <div>
                            <label style={labelCls}>Platform</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {PLATFORMS.map(p => (
                                    <button key={p} onClick={() => setForm(f => ({ ...f, platform: p }))} style={{
                                        padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '999px', textTransform: 'capitalize',
                                        background: form.platform === p ? 'var(--accent)' : 'var(--bg)',
                                        color: form.platform === p ? 'white' : 'var(--text-secondary)',
                                        outline: form.platform === p ? 'none' : '1px solid var(--border)',
                                    }}>{p}</button>
                                ))}
                            </div>
                        </div>

                        {}
                        <div>
                            <label style={labelCls}>Genres <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>({form.genre.length} selected)</span></label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {GENRES_LIST.map(g => (
                                    <button key={g} onClick={() => setForm(f => ({ ...f, genre: f.genre.includes(g) ? f.genre.filter(x => x !== g) : [...f.genre, g] }))} style={{
                                        padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '999px',
                                        background: form.genre.includes(g) ? 'var(--accent)' : 'var(--bg)',
                                        color: form.genre.includes(g) ? 'white' : 'var(--text-secondary)',
                                        outline: form.genre.includes(g) ? 'none' : '1px solid var(--border)',
                                    }}>{g}</button>
                                ))}
                            </div>
                        </div>

                        {}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[{ label: '★ Featured', key: 'is_featured' }, { label: '🆕 New Release', key: 'is_new' }].map(({ label, key }) => (
                                <button key={key} onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))} style={{
                                    padding: '8px 18px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '999px',
                                    background: (form as any)[key] ? 'var(--accent)' : 'var(--bg)',
                                    color: (form as any)[key] ? 'white' : 'var(--text-secondary)',
                                    outline: (form as any)[key] ? 'none' : '1px solid var(--border)',
                                    transition: 'all 150ms ease',
                                }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {}
                        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={saveGame} disabled={saving} style={{ flex: 2, padding: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '999px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit', transition: 'background 150ms ease' }}>
                                {saving ? 'Saving...' : editGame ? 'Save Changes' : 'Create Game'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
