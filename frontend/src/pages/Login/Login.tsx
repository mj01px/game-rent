import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api, { login as apiLogin, register as apiRegister } from '../../services/api'

type Tab = 'signin' | 'register'

const pwRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Number', test: (p: string) => /\d/.test(p) },
    { label: 'Special character', test: (p: string) => /[!@#$%^&*]/.test(p) },
]

export default function Login() {
    const navigate = useNavigate()
    const { saveTokens } = useAuth()
    const { theme } = useTheme()
    const [tab, setTab] = useState<Tab>('signin')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotOpen, setForgotOpen] = useState(false)
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotSuccess, setForgotSuccess] = useState('')

    const reset = () => { setError(''); setSuccess(''); setUsername(''); setEmail(''); setPassword('') }
    const switchTab = (t: Tab) => { setTab(t); reset() }

    const signin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const { data } = await apiLogin({ username, password })
            saveTokens(data.access, data.refresh, data.user)
            navigate('/')
        } catch (err: any) {
            setError(err?.response?.data?.detail || err?.response?.data?.error || 'Invalid credentials.')
        } finally { setLoading(false) }
    }

    const registerUser = async (e: React.FormEvent) => {
        e.preventDefault()
        const allValid = pwRules.every(r => r.test(password))
        if (!allValid) { setError('Password does not meet all requirements.'); return }
        setLoading(true); setError('')
        try {
            await apiRegister({ username, email, password })
            setSuccess('Account created! Check your email to verify.')
            setUsername(''); setEmail(''); setPassword('')
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Registration failed.')
        } finally { setLoading(false) }
    }

    const forgot = async (e: React.FormEvent) => {
        e.preventDefault()
        setForgotLoading(true)
        try {
            await api.post('/users/forgot-password/', { email: forgotEmail })
        } catch {
            // always show success to avoid email enumeration
        } finally {
            setForgotLoading(false)
            setForgotSuccess('If this email exists, a reset link was sent.')
            setForgotEmail('')
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '11px 14px',
        borderRadius: '12px',
        fontSize: '14px',
        outline: 'none',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: 600,
        display: 'block',
        marginBottom: '6px',
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '420px',
            }}>
                {/* Logo */}
                <button
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '28px', padding: 0, width: '100%' }}
                >
                    <img src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="Game Rent" style={{ height: '32px', objectFit: 'contain' }} />
                </button>

                {/* Tab switcher */}
                {!forgotOpen && <div style={{
                    display: 'flex',
                    background: 'var(--surface-2)',
                    borderRadius: '999px',
                    padding: '4px',
                    marginBottom: '24px',
                }}>
                    {([['signin', 'Sign In'], ['register', 'Register']] as [Tab, string][]).map(([t, label]) => (
                        <button
                            key={t}
                            onClick={() => switchTab(t)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '999px',
                                background: tab === t ? 'var(--surface)' : 'transparent',
                                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                fontFamily: 'inherit',
                                transition: 'all 150ms ease',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>}

                {/* Success message */}
                {success && (
                    <div style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                    }}>
                        <p style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 500 }}>{success}</p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                    }}>
                        <p style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
                    </div>
                )}

                {/* Forgot password — full replacement view */}
                {tab === 'signin' && forgotOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <button
                            onClick={() => { setForgotOpen(false); setForgotSuccess(''); setForgotEmail('') }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'inherit',
                                padding: 0, alignSelf: 'flex-start',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Back to Sign In
                        </button>

                        {forgotSuccess ? (
                            <div style={{
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                            }}>
                                <p style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 500 }}>{forgotSuccess}</p>
                            </div>
                        ) : (
                            <form onSubmit={forgot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                    Enter your email and we'll send you a reset link.
                                </p>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        placeholder="you@email.com"
                                        required
                                        autoFocus
                                        style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    style={{
                                        background: 'var(--accent)',
                                        borderRadius: '999px',
                                        padding: '13px',
                                        width: '100%',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: 'white',
                                        border: 'none',
                                        cursor: forgotLoading ? 'not-allowed' : 'pointer',
                                        opacity: forgotLoading ? 0.6 : 1,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Sign In */}
                {tab === 'signin' && !forgotOpen && (
                    <form onSubmit={signin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>Username or Email</label>
                            <input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                style={inputStyle}
                                placeholder="your_username"
                                autoFocus
                                required
                                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                                <button
                                    type="button"
                                    onClick={() => { setForgotOpen(true); setForgotSuccess(''); setForgotEmail('') }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '12px', color: 'var(--accent)', fontWeight: 500,
                                        fontFamily: 'inherit', padding: 0,
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                    placeholder="••••••••"
                                    required
                                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        {showPw
                                            ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                                        }
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'var(--accent)',
                                borderRadius: '999px',
                                padding: '13px',
                                width: '100%',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                marginTop: '4px',
                                fontFamily: 'inherit',
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* Register */}
                {tab === 'register' && (
                    <form onSubmit={registerUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                            { label: 'Username', value: username, setter: setUsername, placeholder: 'choose_username', type: 'text' },
                            { label: 'Email', value: email, setter: setEmail, placeholder: 'you@email.com', type: 'email' },
                        ].map(({ label, value, setter, placeholder, type }) => (
                            <div key={label}>
                                <label style={labelStyle}>{label}</label>
                                <input
                                    type={type}
                                    value={value}
                                    onChange={e => setter(e.target.value)}
                                    placeholder={placeholder}
                                    required
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                />
                            </div>
                        ))}
                        <div>
                            <label style={labelStyle}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                            />
                        </div>
                        {/* Password hints */}
                        {password.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {pwRules.map(({ label, test }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: test(password) ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '11px', color: test(password) ? 'var(--success)' : 'var(--text-muted)' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'var(--accent)',
                                borderRadius: '999px',
                                padding: '13px',
                                width: '100%',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                marginTop: '4px',
                                fontFamily: 'inherit',
                            }}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}
