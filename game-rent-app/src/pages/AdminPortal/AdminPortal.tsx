import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Game } from '../../types'
import api from '../../services/api'

interface AdminPortalProps {
    setPage: (p: string) => void
}

interface AdminUser {
    id: number; username: string; email: string; is_staff: boolean
    is_active: boolean; is_verified: boolean; date_joined: string
    avatar: string | null; rental_count: number
}
interface AdminRefund {
    id: number; rental_id: number; username: string; user_email: string
    user_avatar?: string | null; game_name: string; game_image: string | null
    total_paid: string; reason: string; status: string
    requested_at: string; resolved_at: string | null; resolved_by: string | null
    hours_rented?: number; days_left?: number
}

const PLATFORMS = [
    { value:'pc', label:'PC' }, { value:'ps5', label:'PlayStation 5' },
    { value:'ps4', label:'PlayStation 4' }, { value:'xbox_series', label:'Xbox Series X/S' },
    { value:'xbox_one', label:'Xbox One' }, { value:'nintendo_switch', label:'Nintendo Switch' },
    { value:'mobile', label:'Mobile' },
]
const GENRE_OPTIONS = ['Action','Adventure','RPG','FPS','Simulation','Sports','Roguelike','Party','Horror','Puzzle','Strategy','Racing']
const EMPTY_FORM = {
    name:'', description:'', platform:'pc', original_price:'', rental_price:'',
    rating:'', release_date:'', genre:[] as string[], is_featured:false, is_new:false,
    publisher_name:'', keys_to_add:1,
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
const fmtDT = (d: string) => new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
const hoursRented = (started: string) => Math.max(0, Math.floor((Date.now() - new Date(started).getTime()) / 3600000))
const daysLeft = (expires: string) => Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000))

const Badge = ({ s }: { s: string }) => {
    const m: Record<string, [string,string]> = {
        active:['#D1FAE5','#059669'], pending:['#FEF3C7','#D97706'],
        expired:['#F3F4F6','#6B7280'], approved:['#D1FAE5','#059669'], rejected:['#FEE2E2','#DC2626'],
    }
    const [bg, color] = m[s] || ['#F3F4F6','#6B7280']
    return <span style={{ fontSize:'11px', fontFamily:'Afacad, sans-serif', fontWeight:700, background:bg, color, borderRadius:'6px', padding:'3px 8px' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
}

const Av = ({ src, name, size=32 }: { src?: string|null, name:string, size?:number }) => (
    src ? <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
        : <div style={{ width:size, height:size, borderRadius:'50%', background:'#3B6FE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, color:'white', fontFamily:'Afacad, sans-serif', fontWeight:700, flexShrink:0 }}>{name.slice(0,2).toUpperCase()}</div>
)

const inputSt: React.CSSProperties = { width:'100%', border:'1px solid #E0E0E0', borderRadius:'10px', padding:'9px 12px', fontSize:'13px', fontFamily:'Afacad, sans-serif', color:'#1A1A1A', outline:'none', background:'white' }
const labelSt: React.CSSProperties = { fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF', marginBottom:'4px', display:'block', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }
const cardSt: React.CSSProperties = { background:'white', borderRadius:'16px', border:'1px solid #EBEBEB' }
const thSt: React.CSSProperties = { fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', padding:'10px 14px' }

export default function AdminPortal({ setPage }: AdminPortalProps) {
    const { user, isAuthenticated } = useApp()
    const [tab, setTab] = useState<'games'|'users'|'refunds'>('games')

    // Games
    const [games, setGames] = useState<Game[]>([])
    const [gLoading, setGLoading] = useState(true)
    const [gSearch, setGSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingGame, setEditingGame] = useState<Game|null>(null)
    const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [delConfirm, setDelConfirm] = useState<number|null>(null)
    const [imgFile, setImgFile] = useState<File|null>(null)
    const [imgPreview, setImgPreview] = useState<string|null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    // Users
    const [users, setUsers] = useState<AdminUser[]>([])
    const [uLoading, setULoading] = useState(false)
    const [uSearch, setUSearch] = useState('')
    const [sendingReset, setSendingReset] = useState<number|null>(null)
    const [resetSent, setResetSent] = useState<number|null>(null)
    const [expandedUser, setExpandedUser] = useState<number|null>(null)

    // Refunds
    const [refunds, setRefunds] = useState<AdminRefund[]>([])
    const [rfLoading, setRfLoading] = useState(false)
    const [rfFilter, setRfFilter] = useState('pending')
    const [actioning, setActioning] = useState<number|null>(null)

    useEffect(() => { if (!isAuthenticated || !user?.is_staff) setPage('home') }, [isAuthenticated, user])

    // Carrega tudo na inicialização para ter os counts corretos nas tabs
    useEffect(() => {
        loadGames()
        loadUsers()
        loadRefunds()
    }, [])

    // Recarrega quando muda de tab (para refresh dos dados)
    useEffect(() => {
        if (tab==='games') loadGames()
        if (tab==='users') loadUsers()
        if (tab==='refunds') loadRefunds()
    }, [tab])

    const loadGames = async () => { setGLoading(true); try { const { data } = await api.get('/games/'); setGames(data) } catch {} finally { setGLoading(false) } }
    const loadUsers = async () => { setULoading(true); try { const { data } = await api.get('/rentals/admin/users/'); setUsers(data) } catch {} finally { setULoading(false) } }
    const loadRefunds = async () => { setRfLoading(true); try { const { data } = await api.get('/rentals/admin/refunds/'); setRefunds(data) } catch {} finally { setRfLoading(false) } }

    const openCreate = () => { setEditingGame(null); setForm(EMPTY_FORM); setImgFile(null); setImgPreview(null); setSaveError(''); setShowModal(true) }
    const openEdit = (g: Game) => {
        setEditingGame(g)
        setForm({ name:g.name, description:g.description, platform:g.platform, original_price:g.original_price, rental_price:g.rental_price, rating:g.rating, release_date:g.release_date||'', genre:g.genre||[], is_featured:g.is_featured, is_new:g.is_new, publisher_name:g.publisher?.name||'', keys_to_add:0 })
        setImgFile(null); setImgPreview(g.image||null); setSaveError(''); setShowModal(true)
    }
    const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setImgFile(file)
        const r = new FileReader(); r.onload = ev => setImgPreview(ev.target?.result as string); r.readAsDataURL(file)
    }
    const toggleGenre = (g: string) => setForm(p => ({ ...p, genre: p.genre.includes(g) ? p.genre.filter(x=>x!==g) : [...p.genre, g] }))
    const handleSave = async () => {
        setSaving(true); setSaveError('')
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k,v]) => fd.append(k, k==='genre' ? JSON.stringify(v) : String(v)))
            if (imgFile) fd.append('image', imgFile)
            if (editingGame) await api.patch(`/games/admin/${editingGame.id}/`, fd, { headers:{'Content-Type':'multipart/form-data'} })
            else await api.post('/games/admin/create/', fd, { headers:{'Content-Type':'multipart/form-data'} })
            setShowModal(false); loadGames()
        } catch (e: any) { setSaveError(e?.response?.data?.error || JSON.stringify(e?.response?.data) || 'Error saving.') }
        finally { setSaving(false) }
    }
    const handleDelete = async (id: number) => { try { await api.delete(`/games/admin/${id}/`); setDelConfirm(null); loadGames() } catch {} }

    const sendReset = async (userId: number) => {
        setSendingReset(userId)
        try { await api.post(`/rentals/admin/users/${userId}/send-reset/`); setResetSent(userId); setTimeout(()=>setResetSent(null), 3000) }
        catch {} finally { setSendingReset(null) }
    }

    const handleRefundAction = async (id: number, action: 'approve'|'reject') => {
        setActioning(id)
        try { await api.post(`/rentals/admin/refunds/${id}/action/`, { action }); loadRefunds() }
        catch {} finally { setActioning(null) }
    }

    const filteredGames = games.filter(g => g.name.toLowerCase().includes(gSearch.toLowerCase()))
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(uSearch.toLowerCase()) || u.email.toLowerCase().includes(uSearch.toLowerCase()))
    const filteredRefunds = refunds.filter(r => rfFilter==='all' || r.status===rfFilter)
    const pendingCount = refunds.filter(r => r.status==='pending').length

    const tabs = [
        { key:'games', label:'Games', count:games.length },
        { key:'users', label:'Users', count:users.length },
        { key:'refunds', label:'Refunds', count:pendingCount, alert:pendingCount>0 },
    ]

    return (
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => setPage('home')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'6px', fontSize:'14px', fontFamily:'Afacad, sans-serif' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        Back
                    </button>
                    <span style={{ color:'#E0E0E0' }}>/</span>
                    <div>
                        <h1 style={{ fontSize:'20px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>Admin Portal</h1>
                        <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>Logged as {user?.username}</p>
                    </div>
                </div>
                {tab==='games' && (
                    <button onClick={openCreate} style={{ background:'#1A1A1A', color:'white', borderRadius:'12px', padding:'10px 20px', fontSize:'14px', fontFamily:'Afacad, sans-serif', fontWeight:600, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        Add Game
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ background:'white', borderRadius:'14px', border:'1px solid #EBEBEB', padding:'4px', display:'inline-flex', gap:'2px', marginBottom:'20px' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                            style={{ padding:'8px 18px', borderRadius:'10px', fontSize:'14px', fontFamily:'Afacad, sans-serif', fontWeight:tab===t.key?700:500, border:'none', cursor:'pointer', background:tab===t.key?'#1A1A1A':'transparent', color:tab===t.key?'white':'#6B7280', display:'flex', alignItems:'center', gap:'6px', transition:'all 0.15s' }}>
                        {t.label}
                        <span style={{ fontSize:'11px', fontWeight:700, background:(t as any).alert?'#EF4444':(tab===t.key?'rgba(255,255,255,0.2)':'#F3F4F6'), color:(t as any).alert?'white':(tab===t.key?'white':'#9CA3AF'), borderRadius:'20px', padding:'1px 7px', minWidth:'22px', textAlign:'center' }}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ══ GAMES ══ */}
            {tab==='games' && (
                <div>
                    <div className="relative mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <input type="text" placeholder="Search games..." value={gSearch} onChange={e => setGSearch(e.target.value)} style={{ ...inputSt, paddingLeft:'34px' }} />
                    </div>
                    <div style={cardSt}>
                        <div style={{ display:'grid', gridTemplateColumns:'56px 1fr 130px 100px 80px 70px 90px 110px', borderBottom:'1px solid #F5F5F5', background:'#FAFAFA', borderRadius:'16px 16px 0 0' }}>
                            {['','Game','Platform','Rent/wk','Rating','Keys','Status','Actions'].map(h => <span key={h} style={thSt}>{h}</span>)}
                        </div>
                        {gLoading ? <div style={{ padding:'48px', textAlign:'center' }}><p style={{ color:'#9CA3AF', fontFamily:'Afacad, sans-serif', fontSize:'14px' }}>Loading...</p></div>
                            : filteredGames.map((game, i) => (
                                <div key={game.id} style={{ display:'grid', gridTemplateColumns:'56px 1fr 130px 100px 80px 70px 90px 110px', padding:'10px 0', borderBottom:i<filteredGames.length-1?'1px solid #F9F9F9':'none', alignItems:'center' }}>
                                    <div style={{ padding:'0 14px' }}>
                                        <img src={game.image} alt={game.name} style={{ width:'38px', height:'30px', borderRadius:'6px', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${game.id}/80/60` }} />
                                    </div>
                                    <div style={{ padding:'0 14px', minWidth:0 }}>
                                        <p style={{ fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:600, color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{game.name}</p>
                                        <p style={{ fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>{game.publisher?.name||'—'}</p>
                                    </div>
                                    <span style={{ padding:'0 14px', fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#6B7280' }}>{game.platform_display}</span>
                                    <span style={{ padding:'0 14px', fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>${parseFloat(game.rental_price).toFixed(2)}</span>
                                    <span style={{ padding:'0 14px', fontSize:'13px', fontFamily:'Afacad, sans-serif', color:'#F59E0B', fontWeight:700 }}>★ {parseFloat(game.rating).toFixed(1)}</span>
                                    <span style={{ padding:'0 14px', fontSize:'13px', fontFamily:'Afacad, sans-serif', color:game.available_keys===0?'#EF4444':'#22C55E', fontWeight:700 }}>{game.available_keys}</span>
                                    <div style={{ padding:'0 14px', display:'flex', gap:'4px', flexWrap:'wrap' }}>
                                        {game.is_featured && <span style={{ fontSize:'10px', background:'#FEF3C7', color:'#D97706', borderRadius:'6px', padding:'2px 6px', fontWeight:700, fontFamily:'Afacad, sans-serif' }}>★</span>}
                                        {game.is_new && <span style={{ fontSize:'10px', background:'#D1FAE5', color:'#059669', borderRadius:'6px', padding:'2px 6px', fontWeight:700, fontFamily:'Afacad, sans-serif' }}>NEW</span>}
                                    </div>
                                    <div style={{ padding:'0 14px', display:'flex', gap:'6px' }}>
                                        <button onClick={() => openEdit(game)} style={{ padding:'5px 12px', borderRadius:'8px', border:'1px solid #E0E0E0', background:'white', cursor:'pointer', fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#374151' }} onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'} onMouseLeave={e=>e.currentTarget.style.background='white'}>Edit</button>
                                        {delConfirm===game.id
                                            ? <button onClick={() => handleDelete(game.id)} style={{ padding:'5px 12px', borderRadius:'8px', border:'none', background:'#EF4444', cursor:'pointer', fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'white' }}>Sure?</button>
                                            : <button onClick={() => setDelConfirm(game.id)} style={{ padding:'5px 12px', borderRadius:'8px', border:'1px solid #FEE2E2', background:'white', cursor:'pointer', fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#EF4444' }} onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'} onMouseLeave={e=>e.currentTarget.style.background='white'}>Del</button>
                                        }
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ══ USERS ══ */}
            {tab==='users' && (
                <div>
                    <div className="relative mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <input type="text" placeholder="Search users..." value={uSearch} onChange={e => setUSearch(e.target.value)} style={{ ...inputSt, paddingLeft:'34px' }} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {uLoading ? <div style={{ ...cardSt, padding:'48px', textAlign:'center' }}><p style={{ color:'#9CA3AF', fontFamily:'Afacad, sans-serif' }}>Loading...</p></div>
                            : filteredUsers.map(u => (
                                <div key={u.id} style={cardSt}>
                                    <div className="flex items-center gap-4" style={{ padding:'16px 20px', cursor:'pointer' }} onClick={() => setExpandedUser(expandedUser===u.id ? null : u.id)}>
                                        <Av src={u.avatar} name={u.username} size={40} />
                                        <div style={{ flex:1 }}>
                                            <div className="flex items-center gap-2">
                                                <p style={{ fontSize:'14px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>{u.username}</p>
                                                {u.is_staff && <span style={{ fontSize:'10px', background:'#EDE9FE', color:'#7C3AED', borderRadius:'6px', padding:'2px 7px', fontWeight:700, fontFamily:'Afacad, sans-serif' }}>ADMIN</span>}
                                                {!u.is_verified && <span style={{ fontSize:'10px', background:'#FEF3C7', color:'#D97706', borderRadius:'6px', padding:'2px 7px', fontWeight:700, fontFamily:'Afacad, sans-serif' }}>UNVERIFIED</span>}
                                            </div>
                                            <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-6" style={{ flexShrink:0 }}>
                                            <div style={{ textAlign:'right' }}>
                                                <p style={{ fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>{u.rental_count}</p>
                                                <p style={{ fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>rentals</p>
                                            </div>
                                            <div style={{ textAlign:'right' }}>
                                                <p style={{ fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>Joined</p>
                                                <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#374151' }}>{fmtDate(u.date_joined)}</p>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color:'#9CA3AF', transition:'transform 0.2s', transform:expandedUser===u.id?'rotate(180deg)':'rotate(0)' }}><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                        </div>
                                    </div>
                                    {expandedUser===u.id && (
                                        <div style={{ padding:'16px 20px', borderTop:'1px solid #F5F5F5', background:'#FAFAFA', borderRadius:'0 0 16px 16px' }}>
                                            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'16px' }}>
                                                <div><p style={labelSt}>User ID</p><p style={{ fontSize:'13px', fontFamily:'Afacad, sans-serif', color:'#1A1A1A', fontWeight:600 }}>#{u.id}</p></div>
                                                <div><p style={labelSt}>Account</p><Badge s={u.is_active ? 'active' : 'expired'} /></div>
                                                <div><p style={labelSt}>Email</p><Badge s={u.is_verified ? 'approved' : 'pending'} /></div>
                                                <div><p style={labelSt}>Role</p><Badge s={u.is_staff ? 'active' : 'expired'} /></div>
                                            </div>
                                            <div style={{ display:'flex', gap:'12px', alignItems:'center', padding:'12px 16px', background:'white', borderRadius:'12px', border:'1px solid #EBEBEB' }}>
                                                <div style={{ flex:1 }}>
                                                    <p style={{ fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:600, color:'#1A1A1A' }}>Send Password Reset</p>
                                                    <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>Email a reset link to {u.email}</p>
                                                </div>
                                                {resetSent===u.id ? (
                                                    <span style={{ fontSize:'13px', color:'#22C55E', fontFamily:'Afacad, sans-serif', fontWeight:600, flexShrink:0 }}>✓ Reset link sent!</span>
                                                ) : (
                                                    <button onClick={() => sendReset(u.id)} disabled={sendingReset===u.id}
                                                            style={{ padding:'8px 18px', borderRadius:'10px', border:'1px solid #E0E0E0', background:'white', cursor:'pointer', fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:600, color:'#374151', opacity:sendingReset===u.id?0.5:1, flexShrink:0 }}
                                                            onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                                                        {sendingReset===u.id ? 'Sending...' : 'Send Reset Email'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ══ REFUNDS ══ */}
            {tab==='refunds' && (
                <div>
                    <div className="flex gap-2 mb-4">
                        {['pending','approved','rejected','all'].map(f => (
                            <button key={f} onClick={() => setRfFilter(f)}
                                    style={{ padding:'6px 16px', borderRadius:'20px', fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:rfFilter===f?700:500, border:rfFilter===f?'none':'1px solid #E0E0E0', background:rfFilter===f?'#1A1A1A':'white', color:rfFilter===f?'white':'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                                {f.charAt(0).toUpperCase()+f.slice(1)}
                                {f==='pending' && pendingCount>0 && <span style={{ background:'#EF4444', color:'white', borderRadius:'10px', padding:'0 6px', fontSize:'10px', fontWeight:700 }}>{pendingCount}</span>}
                            </button>
                        ))}
                    </div>

                    {rfLoading ? <div style={{ ...cardSt, padding:'48px', textAlign:'center' }}><p style={{ color:'#9CA3AF', fontFamily:'Afacad, sans-serif' }}>Loading...</p></div>
                        : filteredRefunds.length===0 ? (
                            <div style={{ ...cardSt, padding:'56px', textAlign:'center' }}>
                                <p style={{ fontSize:'32px', marginBottom:'12px' }}></p>
                                <p style={{ color:'#9CA3AF', fontFamily:'Afacad, sans-serif', fontWeight:600, fontSize:'14px' }}>No {rfFilter==='all' ? '' : rfFilter} refund requests.</p>
                            </div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                                {filteredRefunds.map(rf => (
                                    <div key={rf.id} style={{ ...cardSt, padding:'20px 24px' }}>
                                        <div className="flex items-start gap-4">
                                            {/* Game image */}
                                            {rf.game_image
                                                ? <img src={rf.game_image} alt={rf.game_name} style={{ width:'72px', height:'54px', borderRadius:'10px', objectFit:'cover', flexShrink:0 }} />
                                                : <div style={{ width:'72px', height:'54px', borderRadius:'10px', background:'#F3F4F6', flexShrink:0 }} />
                                            }

                                            {/* Main info */}
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p style={{ fontSize:'15px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>{rf.game_name}</p>
                                                    <Badge s={rf.status} />
                                                </div>

                                                {/* Stats row */}
                                                <div style={{ display:'flex', gap:'16px', marginBottom:'10px', flexWrap:'wrap' }}>
                                                    {[
                                                        { label:'User', value: rf.username },
                                                        { label:'Email', value: rf.user_email },
                                                        { label:'Amount Paid', value: `$${rf.total_paid}` },
                                                        { label:'Requested', value: fmtDT(rf.requested_at) },
                                                    ].map(({ label, value }) => (
                                                        <div key={label}>
                                                            <p style={{ fontSize:'10px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</p>
                                                            <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', fontWeight:600, color:'#374151' }}>{value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Reason */}
                                                {rf.reason && (
                                                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'#FEF3C7', borderRadius:'8px', marginBottom:'8px' }}>
                                                        <span style={{ fontSize:'14px' }}></span>
                                                        <p style={{ fontSize:'12px', fontFamily:'Afacad, sans-serif', color:'#92400E', fontWeight:600 }}>
                                                            Reason: {rf.reason}
                                                        </p>
                                                    </div>
                                                )}

                                                {rf.resolved_at && (
                                                    <p style={{ fontSize:'11px', fontFamily:'Afacad, sans-serif', color:'#9CA3AF' }}>
                                                        Resolved by <strong>{rf.resolved_by}</strong> · {fmtDT(rf.resolved_at)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {rf.status==='pending' && (
                                                <div className="flex flex-col gap-2" style={{ flexShrink:0 }}>
                                                    <button onClick={() => handleRefundAction(rf.id,'approve')} disabled={actioning===rf.id}
                                                            style={{ padding:'9px 22px', borderRadius:'10px', border:'none', background:'#22C55E', color:'white', cursor:'pointer', fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:700, opacity:actioning===rf.id?0.5:1, whiteSpace:'nowrap' }}>
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => handleRefundAction(rf.id,'reject')} disabled={actioning===rf.id}
                                                            style={{ padding:'9px 22px', borderRadius:'10px', border:'1px solid #FEE2E2', background:'white', color:'#EF4444', cursor:'pointer', fontSize:'13px', fontFamily:'Afacad, sans-serif', fontWeight:700, opacity:actioning===rf.id?0.5:1, whiteSpace:'nowrap' }}>
                                                        ✕ Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            )}

            {/* ══ GAME MODAL ══ */}
            {showModal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
                     onClick={e => { if (e.target===e.currentTarget) setShowModal(false) }}>
                    <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'640px', maxHeight:'90vh', overflowY:'auto', padding:'28px', boxShadow:'0 24px 64px rgba(0,0,0,0.15)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 style={{ fontSize:'18px', fontFamily:'Afacad, sans-serif', fontWeight:700, color:'#1A1A1A' }}>{editingGame ? `Edit — ${editingGame.name}` : 'Add New Game'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label style={labelSt}>Cover Image</label>
                                <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                                    {imgPreview && <img src={imgPreview} alt="preview" style={{ width:'80px', height:'60px', borderRadius:'8px', objectFit:'cover', border:'1px solid #EBEBEB' }} />}
                                    <button onClick={() => fileRef.current?.click()} style={{ padding:'8px 16px', border:'1px dashed #D0D0D0', borderRadius:'10px', background:'#FAFAFA', cursor:'pointer', fontSize:'13px', fontFamily:'Afacad, sans-serif', color:'#6B7280' }}>{imgPreview ? 'Change image' : 'Upload image'}</button>
                                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImgChange} />
                                </div>
                            </div>
                            <div><label style={labelSt}>Game Name *</label><input style={inputSt} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. God of War: Ragnarök" /></div>
                            <div><label style={labelSt}>Description</label><textarea style={{ ...inputSt, minHeight:'80px', resize:'vertical' }} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                <div><label style={labelSt}>Platform *</label><select style={inputSt} value={form.platform} onChange={e=>setForm(p=>({...p,platform:e.target.value}))}>{PLATFORMS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                <div><label style={labelSt}>Release Date</label><input style={inputSt} type="date" value={form.release_date} onChange={e=>setForm(p=>({...p,release_date:e.target.value}))} /></div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                                <div><label style={labelSt}>Original Price ($)</label><input style={inputSt} type="number" step="0.01" value={form.original_price} onChange={e=>setForm(p=>({...p,original_price:e.target.value}))} placeholder="59.99" /></div>
                                <div><label style={labelSt}>Rental/wk ($)</label><input style={inputSt} type="number" step="0.01" value={form.rental_price} onChange={e=>setForm(p=>({...p,rental_price:e.target.value}))} placeholder="0.30" /></div>
                                <div><label style={labelSt}>Rating (0–5)</label><input style={inputSt} type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e=>setForm(p=>({...p,rating:e.target.value}))} placeholder="4.5" /></div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                <div><label style={labelSt}>Publisher Name</label><input style={inputSt} value={form.publisher_name} onChange={e=>setForm(p=>({...p,publisher_name:e.target.value}))} placeholder="e.g. Naughty Dog" /></div>
                                <div><label style={labelSt}>{editingGame ? 'Add Keys' : 'Initial Keys'}</label><input style={inputSt} type="number" min="0" value={form.keys_to_add} onChange={e=>setForm(p=>({...p,keys_to_add:parseInt(e.target.value)||0}))} /></div>
                            </div>
                            <div>
                                <label style={labelSt}>Genres</label>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                    {GENRE_OPTIONS.map(g=><button key={g} onClick={()=>toggleGenre(g)} style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontFamily:'Afacad, sans-serif', cursor:'pointer', border:form.genre.includes(g)?'none':'1px solid #E0E0E0', background:form.genre.includes(g)?'#1A1A1A':'white', color:form.genre.includes(g)?'white':'#6B7280', fontWeight:form.genre.includes(g)?600:400 }}>{g}</button>)}
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:'20px' }}>
                                {[{key:'is_featured',label:'Featured (rating ≥ 4.7)'},{key:'is_new',label:'Mark as New'}].map(({key,label})=>(
                                    <label key={key} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'Afacad, sans-serif', color:'#374151' }}>
                                        <input type="checkbox" checked={form[key as 'is_featured'|'is_new']} onChange={e=>setForm(p=>({...p,[key]:e.target.checked}))} style={{ width:'15px', height:'15px', cursor:'pointer' }} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                            {saveError && <p style={{ fontSize:'13px', color:'#EF4444', fontFamily:'Afacad, sans-serif', background:'#FEF2F2', padding:'10px 14px', borderRadius:'10px' }}>{saveError}</p>}
                            <div className="flex justify-end gap-3 mt-2">
                                <button onClick={() => setShowModal(false)} style={{ padding:'10px 20px', borderRadius:'12px', border:'1px solid #E0E0E0', background:'white', cursor:'pointer', fontSize:'14px', fontFamily:'Afacad, sans-serif', color:'#374151' }}>Cancel</button>
                                <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', borderRadius:'12px', border:'none', background:'#1A1A1A', color:'white', cursor:saving?'not-allowed':'pointer', fontSize:'14px', fontFamily:'Afacad, sans-serif', fontWeight:600, opacity:saving?0.6:1 }}>
                                    {saving ? 'Saving...' : editingGame ? 'Save Changes' : 'Create Game'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
