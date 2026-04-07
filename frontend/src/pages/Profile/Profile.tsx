import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

type Section = 'main' | 'username' | 'email' | 'password'

export default function Profile() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout, setUser } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [section, setSection] = useState<Section>('main')

    const [newUsername, setNewUsername] = useState('')
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameChecking, setUsernameChecking] = useState(false)
    const [usernameSaving, setUsernameSaving] = useState(false)
    const [usernameError, setUsernameError] = useState('')
    const [usernameSuccess, setUsernameSuccess] = useState(false)

    const [newEmail, setNewEmail] = useState('')
    const [emailSending, setEmailSending] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [emailError, setEmailError] = useState('')

    const [passwordSending, setPasswordSending] = useState(false)
    const [passwordSent, setPasswordSent] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    const [avatarUploading, setAvatarUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => { setAvatarUrl(user?.avatar || null) }, [user?.avatar])

    if (!isAuthenticated) { navigate('/login'); return null }

    const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

    const checkUsername = async (val: string) => {
        setNewUsername(val); setUsernameError(''); setUsernameSuccess(false)
        if (!val || val === user?.username) { setUsernameAvailable(null); return }
        setUsernameChecking(true)
        try {
            const { data } = await api.get(`/users/profile/check-username/?username=${encodeURIComponent(val)}`)
            setUsernameAvailable(data.available)
        } catch { setUsernameAvailable(null) }
        finally { setUsernameChecking(false) }
    }

    const saveUsername = async () => {
        if (!newUsername || !usernameAvailable) return
        setUsernameSaving(true); setUsernameError('')
        try {
            const { data } = await api.patch('/users/profile/update-username/', { username: newUsername })
            if (user) setUser({ ...user, username: data.data?.username ?? data.username })
            setUsernameSuccess(true)
            setTimeout(() => { setSection('main'); setUsernameSuccess(false); setNewUsername('') }, 1500)
        } catch (e: any) { setUsernameError(e?.response?.data?.error || 'Error updating username.') }
        finally { setUsernameSaving(false) }
    }

    const requestEmailChange = async () => {
        if (!newEmail) return
        setEmailSending(true); setEmailError('')
        try { await api.post('/users/profile/request-email-change/', { new_email: newEmail }); setEmailSent(true) }
        catch (e: any) { setEmailError(e?.response?.data?.error || 'Error sending email.') }
        finally { setEmailSending(false) }
    }

    const requestPasswordChange = async () => {
        setPasswordSending(true); setPasswordError('')
        try { await api.post('/users/profile/request-password-change/'); setPasswordSent(true) }
        catch (e: any) { setPasswordError(e?.response?.data?.error || 'Error sending email.') }
        finally { setPasswordSending(false) }
    }

    const uploadAvatar = async (file: File) => {
        setAvatarUploading(true)
        const formData = new FormData()
        formData.append('avatar', file)
        try {
            const { data } = await api.post('/users/profile/avatar/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            const url = data.data?.avatar ?? data.avatar
            setAvatarUrl(url)
            if (user) setUser({ ...user, avatar: url })
        } catch {  }
        finally { setAvatarUploading(false) }
    }

    const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }
    const input: CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', outline: 'none', color: 'var(--text-primary)', background: 'var(--surface-2)', boxSizing: 'border-box' }
    const btn: CSSProperties = { background: 'var(--accent)', color: 'white', borderRadius: '999px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }

    const BackBtn = ({ onClick }: { onClick: () => void }) => (
        <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Back
        </button>
    )

    if (section === 'username') return (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <BackBtn onClick={() => { setSection('main'); setNewUsername(''); setUsernameAvailable(null); setUsernameError('') }} />
            <div style={card}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Change Username</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Current: <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong></p>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>New username</label>
                <div style={{ position: 'relative' }}>
                    <input style={{ ...input, paddingRight: '36px' }} value={newUsername} onChange={e => checkUsername(e.target.value)} placeholder="Enter new username" autoFocus />
                    {newUsername && (
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>
                            {usernameChecking ? '⏳' : usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : ''}
                        </span>
                    )}
                </div>
                {usernameAvailable === false && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>Username already taken.</p>}
                {usernameError && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>{usernameError}</p>}
                {usernameSuccess && <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px' }}>Username updated! ✓</p>}
                <button onClick={saveUsername} disabled={!newUsername || !usernameAvailable || usernameSaving}
                        style={{ ...btn, marginTop: '16px', opacity: (!newUsername || !usernameAvailable || usernameSaving) ? 0.4 : 1 }}>
                    {usernameSaving ? 'Saving...' : 'Save Username'}
                </button>
            </div>
        </div>
    )

    if (section === 'email') return (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <BackBtn onClick={() => { setSection('main'); setNewEmail(''); setEmailSent(false); setEmailError('') }} />
            <div style={card}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Change Email</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    A confirmation link will be sent to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>.
                </p>
                {emailSent ? (
                    <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 600 }}>✓ Email sent!</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Click the link in <strong>{user?.email}</strong> to confirm.</p>
                    </div>
                ) : (
                    <>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>New email</label>
                        <input style={input} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" autoFocus />
                        {emailError && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>{emailError}</p>}
                        <button onClick={requestEmailChange} disabled={!newEmail || emailSending}
                                style={{ ...btn, marginTop: '16px', opacity: (!newEmail || emailSending) ? 0.4 : 1 }}>
                            {emailSending ? 'Sending...' : 'Send Confirmation'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )

    if (section === 'password') return (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <BackBtn onClick={() => { setSection('main'); setPasswordSent(false); setPasswordError('') }} />
            <div style={card}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Change Password</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    A reset link will be sent to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>.
                </p>
                {passwordSent ? (
                    <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 600 }}>✓ Email sent!</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Check your inbox and follow the link.</p>
                    </div>
                ) : (
                    <>
                        {passwordError && <p style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '12px' }}>{passwordError}</p>}
                        <button onClick={requestPasswordChange} disabled={passwordSending}
                                style={{ ...btn, opacity: passwordSending ? 0.4 : 1 }}>
                            {passwordSending ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )

    return (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <BackBtn onClick={() => navigate('/')} />
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 32px 32px' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
                    ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white', fontWeight: 'bold' }}>
                            {initials}
                        </div>
                    )}
                    <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                            style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                           onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
            </div>
            <div style={card}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Account</h2>
                {[
                    { label: 'Change Username', sub: user?.username, s: 'username' as Section },
                    { label: 'Change Email', sub: user?.email, s: 'email' as Section },
                    { label: 'Change Password', sub: '••••••••', s: 'password' as Section },
                ].map(({ label, sub, s }, i, arr) => (
                    <button key={s} onClick={() => setSection(s)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none', background: 'none', border: 'none', borderBottomWidth: i < arr.length - 1 ? '1px' : 0, borderBottomStyle: i < arr.length - 1 ? 'solid' : undefined, borderBottomColor: i < arr.length - 1 ? 'var(--border-light)' : undefined, cursor: 'pointer', textAlign: 'left' }}>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                ))}
            </div>
            <div style={card}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Appearance</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Theme</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                    </div>
                    <button onClick={toggleTheme} style={{ width: '48px', height: '28px', borderRadius: '14px', background: theme === 'dark' ? 'var(--accent)' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}>
                        <span style={{ position: 'absolute', top: '3px', left: theme === 'dark' ? '23px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                            {theme === 'dark'
                                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="var(--accent)"/></svg>
                                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#F59E0B"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/></svg>
                            }
                        </span>
                    </button>
                </div>
            </div>
            <button onClick={() => { logout(); navigate('/') }}
                    style={{ width: '100%', padding: '12px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', color: 'var(--danger)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Log Out
            </button>
        </div>
    )
}
