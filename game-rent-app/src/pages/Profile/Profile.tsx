import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import api from '../../services/api'

interface ProfileProps {
    setPage: (p: string) => void
}

type Section = 'main' | 'username' | 'email' | 'password'

export default function Profile({ setPage }: ProfileProps) {
    const { user, isAuthenticated, saveTokens, logout } = useApp()
    const [section, setSection] = useState<Section>('main')

    // username
    const [newUsername, setNewUsername] = useState('')
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameChecking, setUsernameChecking] = useState(false)
    const [usernameSaving, setUsernameSaving] = useState(false)
    const [usernameError, setUsernameError] = useState('')
    const [usernameSuccess, setUsernameSuccess] = useState(false)

    // email
    const [newEmail, setNewEmail] = useState('')
    const [emailSending, setEmailSending] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [emailError, setEmailError] = useState('')

    // password
    const [passwordSending, setPasswordSending] = useState(false)
    const [passwordSent, setPasswordSent] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    // avatar
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setAvatarUrl(user?.avatar || null)
    }, [user?.avatar])

    if (!isAuthenticated) {
        setPage('home')
        return null
    }

    const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

    // --- Username check com debounce ---
    const checkUsername = async (val: string) => {
        setNewUsername(val)
        setUsernameError('')
        setUsernameSuccess(false)
        if (!val || val === user?.username) {
            setUsernameAvailable(null)
            return
        }
        setUsernameChecking(true)
        try {
            const { data } = await api.get(`/users/profile/check-username/?username=${encodeURIComponent(val)}`)
            setUsernameAvailable(data.available)
        } catch {
            setUsernameAvailable(null)
        } finally {
            setUsernameChecking(false)
        }
    }

    const saveUsername = async () => {
        if (!newUsername || !usernameAvailable) return
        setUsernameSaving(true)
        setUsernameError('')
        try {
            const { data } = await api.patch('/users/profile/update-username/', { username: newUsername })
            // Atualiza o user no contexto
            if (user) {
                saveTokens(
                    localStorage.getItem('access_token') || '',
                    localStorage.getItem('refresh_token') || '',
                    { ...user, username: data.username }
                )
            }
            setUsernameSuccess(true)
            setTimeout(() => { setSection('main'); setUsernameSuccess(false); setNewUsername('') }, 1500)
        } catch (e: any) {
            setUsernameError(e?.response?.data?.error || 'Error updating username.')
        } finally {
            setUsernameSaving(false)
        }
    }

    const requestEmailChange = async () => {
        if (!newEmail) return
        setEmailSending(true)
        setEmailError('')
        try {
            await api.post('/users/profile/request-email-change/', { new_email: newEmail })
            setEmailSent(true)
        } catch (e: any) {
            setEmailError(e?.response?.data?.error || 'Error sending email.')
        } finally {
            setEmailSending(false)
        }
    }

    const requestPasswordChange = async () => {
        setPasswordSending(true)
        setPasswordError('')
        try {
            await api.post('/users/profile/request-password-change/')
            setPasswordSent(true)
        } catch (e: any) {
            setPasswordError(e?.response?.data?.error || 'Error sending email.')
        } finally {
            setPasswordSending(false)
        }
    }

    const uploadAvatar = async (file: File) => {
        setAvatarUploading(true)
        const formData = new FormData()
        formData.append('avatar', file)
        try {
            const { data } = await api.post('/users/profile/avatar/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setAvatarUrl(data.avatar)
            if (user) {
                saveTokens(
                    localStorage.getItem('access_token') || '',
                    localStorage.getItem('refresh_token') || '',
                    { ...user, avatar: data.avatar }
                )
            }
        } catch {
            // silencia
        } finally {
            setAvatarUploading(false)
        }
    }

    const btnBase: React.CSSProperties = {
        borderRadius: '12px',
        padding: '10px 20px',
        fontSize: '14px',
        fontFamily: 'Afacad, sans-serif',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        border: 'none',
    }

    const cardStyle: React.CSSProperties = {
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #EBEBEB',
        padding: '24px',
        marginBottom: '16px',
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        border: '1px solid #E0E0E0',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '14px',
        fontFamily: 'Afacad, sans-serif',
        outline: 'none',
        color: '#1A1A1A',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        fontFamily: 'Afacad, sans-serif',
        color: '#9CA3AF',
        marginBottom: '6px',
        display: 'block',
    }

    // ---- Sub-sections ----

    if (section === 'username') {
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <button onClick={() => { setSection('main'); setNewUsername(''); setUsernameAvailable(null); setUsernameError('') }}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Back
                </button>

                <div style={cardStyle}>
                    <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '17px', fontFamily: 'Afacad, sans-serif' }}>Change Username</h2>
                    <p className="text-gray-400 mb-5" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>Current: <strong style={{ color: '#1A1A1A' }}>{user?.username}</strong></p>

                    <label style={labelStyle}>New username</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            style={{ ...inputStyle, paddingRight: '36px' }}
                            value={newUsername}
                            onChange={e => checkUsername(e.target.value)}
                            placeholder="Enter new username"
                            autoFocus
                        />
                        {newUsername && (
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                                {usernameChecking ? '⏳' : usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : ''}
                            </span>
                        )}
                    </div>

                    {usernameAvailable === false && (
                        <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px', fontFamily: 'Afacad, sans-serif' }}>Username already taken.</p>
                    )}
                    {usernameError && (
                        <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px', fontFamily: 'Afacad, sans-serif' }}>{usernameError}</p>
                    )}
                    {usernameSuccess && (
                        <p style={{ fontSize: '12px', color: '#22C55E', marginTop: '6px', fontFamily: 'Afacad, sans-serif' }}>Username updated! ✓</p>
                    )}

                    <button
                        onClick={saveUsername}
                        disabled={!newUsername || !usernameAvailable || usernameSaving}
                        style={{ ...btnBase, background: '#1A1A1A', color: 'white', marginTop: '16px', opacity: (!newUsername || !usernameAvailable || usernameSaving) ? 0.4 : 1 }}
                    >
                        {usernameSaving ? 'Saving...' : 'Save Username'}
                    </button>
                </div>
            </div>
        )
    }

    if (section === 'email') {
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <button onClick={() => { setSection('main'); setNewEmail(''); setEmailSent(false); setEmailError('') }}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Back
                </button>

                <div style={cardStyle}>
                    <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '17px', fontFamily: 'Afacad, sans-serif' }}>Change Email</h2>
                    <p className="text-gray-400 mb-5" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                        A confirmation link will be sent to your <strong style={{ color: '#1A1A1A' }}>current email</strong> ({user?.email}).
                    </p>

                    {emailSent ? (
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px' }}>
                            <p style={{ fontSize: '14px', color: '#16A34A', fontFamily: 'Afacad, sans-serif', fontWeight: 600 }}>✓ Email sent!</p>
                            <p style={{ fontSize: '13px', color: '#15803D', fontFamily: 'Afacad, sans-serif', marginTop: '4px' }}>
                                Check your inbox at <strong>{user?.email}</strong> and click the confirmation link.
                            </p>
                        </div>
                    ) : (
                        <>
                            <label style={labelStyle}>New email address</label>
                            <input
                                style={inputStyle}
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="Enter new email"
                                autoFocus
                            />
                            {emailError && (
                                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px', fontFamily: 'Afacad, sans-serif' }}>{emailError}</p>
                            )}
                            <button
                                onClick={requestEmailChange}
                                disabled={!newEmail || emailSending}
                                style={{ ...btnBase, background: '#1A1A1A', color: 'white', marginTop: '16px', opacity: (!newEmail || emailSending) ? 0.4 : 1 }}
                            >
                                {emailSending ? 'Sending...' : 'Send Confirmation Email'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    if (section === 'password') {
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <button onClick={() => { setSection('main'); setPasswordSent(false); setPasswordError('') }}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6"
                        style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Back
                </button>

                <div style={cardStyle}>
                    <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '17px', fontFamily: 'Afacad, sans-serif' }}>Change Password</h2>
                    <p className="text-gray-400 mb-5" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                        A password reset link will be sent to <strong style={{ color: '#1A1A1A' }}>{user?.email}</strong>.
                    </p>

                    {passwordSent ? (
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px' }}>
                            <p style={{ fontSize: '14px', color: '#16A34A', fontFamily: 'Afacad, sans-serif', fontWeight: 600 }}>✓ Email sent!</p>
                            <p style={{ fontSize: '13px', color: '#15803D', fontFamily: 'Afacad, sans-serif', marginTop: '4px' }}>
                                Check your inbox and click the link to set a new password.
                            </p>
                        </div>
                    ) : (
                        <>
                            {passwordError && (
                                <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '12px', fontFamily: 'Afacad, sans-serif' }}>{passwordError}</p>
                            )}
                            <button
                                onClick={requestPasswordChange}
                                disabled={passwordSending}
                                style={{ ...btnBase, background: '#1A1A1A', color: 'white', opacity: passwordSending ? 0.4 : 1 }}
                            >
                                {passwordSending ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    // ---- Main ----
    return (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button
                onClick={() => setPage('home')}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6"
                style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back
            </button>

            {/* Avatar */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 32px 32px' }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #EBEBEB' }}
                        />
                    ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#3B6FE0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white', fontFamily: 'Afacad, sans-serif', fontWeight: 'bold' }}>
                            {initials}
                        </div>
                    )}
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={avatarUploading}
                        style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#1A1A1A', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        {avatarUploading ? (
                            <span style={{ fontSize: '10px', color: 'white' }}>...</span>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                        )}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }}
                    />
                </div>
                <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}>{user?.username}</h1>
                <p className="text-gray-400" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>{user?.email}</p>
            </div>

            {/* Opções */}
            <div style={cardStyle}>
                <h2 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>Account Settings</h2>
                <div className="flex flex-col">
                    {[
                        { label: 'Change Username', sub: user?.username, section: 'username' as Section },
                        { label: 'Change Email', sub: user?.email, section: 'email' as Section },
                        { label: 'Change Password', sub: '••••••••', section: 'password' as Section },
                    ].map(({ label, sub, section: s }, i, arr) => (
                        <button
                            key={s}
                            onClick={() => setSection(s)}
                            className="flex items-center justify-between hover:bg-gray-50 transition-colors"
                            style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #F5F5F5' : 'none', textAlign: 'left', background: 'none', border: i < arr.length - 1 ? undefined : 'none', borderBottomWidth: i < arr.length - 1 ? '1px' : undefined, borderBottomStyle: i < arr.length - 1 ? 'solid' : undefined, borderBottomColor: i < arr.length - 1 ? '#F5F5F5' : undefined, cursor: 'pointer' }}
                        >
                            <div>
                                <p style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', fontWeight: 600, color: '#1A1A1A' }}>{label}</p>
                                <p style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginTop: '2px' }}>{sub}</p>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    ))}
                </div>
            </div>


        </div>
    )
}
