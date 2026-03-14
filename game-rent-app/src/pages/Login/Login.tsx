import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import api, { login, register } from '../../services/api'

interface LoginProps {
    setPage: (p: string) => void
}

type Mode = 'login' | 'register' | 'forgot'

function validatePassword(password: string): string {
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
    if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/\+\=\~\`\;\'\&]/.test(password)) return 'Password must contain at least one special character (!@#$%^&* etc).'
    return ''
}

export default function Login({ setPage }: LoginProps) {
    const [mode, setMode] = useState<Mode>('login')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [registered, setRegistered] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')
    const [forgotSent, setForgotSent] = useState(false)
    const [passwordHint, setPasswordHint] = useState('')
    const { saveTokens } = useApp()

    const handlePasswordChange = (val: string) => {
        setPassword(val)
        if (mode === 'register' && val) setPasswordHint(validatePassword(val))
        else setPasswordHint('')
    }

    const handleSubmit = async () => {
        setError('')
        if (mode === 'forgot') {
            if (!email) { setError('Please enter your email.'); return }
            setIsLoading(true)
            try { await api.post('/users/forgot-password/', { email }) } catch {}
            finally { setIsLoading(false); setForgotSent(true) }
            return
        }
        if (!username || !password) { setError('Please fill in all fields.'); return }
        if (mode === 'register' && !email) { setError('Please enter your email.'); return }
        if (mode === 'register') { const pwErr = validatePassword(password); if (pwErr) { setError(pwErr); return } }
        setIsLoading(true)
        try {
            if (mode === 'login') {
                const { data } = await login({ username, password })
                saveTokens(data.access, data.refresh, data.user)
                setPage('home')
            } else {
                await register({ username, email, password })
                setRegisteredEmail(email)
                setRegistered(true)
            }
        } catch (err: any) {
            const msg = err?.response?.data
            if (mode === 'login') {
                const detail = msg?.non_field_errors?.[0] || ''
                setError(detail.includes('verify') ? 'Please verify your email before logging in.' : 'Username or password is incorrect.')
            } else {
                setError(msg?.error || 'Could not create account. Please try again.')
            }
        } finally { setIsLoading(false) }
    }

    const switchMode = (m: Mode) => { setMode(m); setError(''); setPasswordHint(''); setForgotSent(false) }

    const inputStyle: React.CSSProperties = {
        border: '1px solid #E0E0E0', borderRadius: '10px', padding: '10px 14px',
        fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#111',
        width: '100%', outline: 'none',
    }

    if (registered) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <div className="flex flex-col items-center mb-8">
                        <button onClick={() => setPage('home')} className="flex items-center justify-center rounded-full mb-4" style={{ width: '56px', height: '56px', background: '#E8342A' }}>
                            <img src="/src/assets/logo.png" alt="GameRent" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        </button>
                        <h1 className="font-bold text-gray-900" style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}>Check your inbox</h1>
                        <p className="text-gray-400 mt-1" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>Almost there!</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="22,6 12,13 2,6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>We sent a verification link to</p>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '24px' }}>{registeredEmail}</p>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>
                            Click the link in the email to activate your account before logging in.
                        </p>
                        <button onClick={() => { setRegistered(false); switchMode('login'); setUsername(''); setPassword(''); setEmail('') }}
                                className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
                            Go to Sign In
                        </button>
                        <button onClick={() => setPage('home')} className="text-gray-400 hover:text-gray-600 transition-colors"
                                style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                            ← Back to home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>

                <div className="flex flex-col items-center mb-8">
                    <button onClick={() => setPage('home')} className="flex items-center justify-center rounded-full mb-4" style={{ width: '56px', height: '56px', background: '#E8342A' }}>
                        <img src="/src/assets/logo.png" alt="GameRent" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    </button>
                    <h1 className="font-bold text-gray-900" style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}>
                        {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Forgot password'}
                    </h1>
                    <p className="text-gray-400 mt-1" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                        {mode === 'login' ? 'Sign in to your GameRent account' : mode === 'register' ? 'Join GameRent today' : 'Enter your email to reset your password'}
                    </p>
                </div>

                {mode !== 'forgot' && (
                    <div className="flex mb-6" style={{ background: '#F5F5F5', borderRadius: '12px', padding: '4px' }}>
                        {(['login', 'register'] as const).map(m => (
                            <button key={m} onClick={() => switchMode(m)} className="flex-1 font-medium transition-all"
                                    style={{ borderRadius: '10px', padding: '8px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: mode === m ? 'white' : 'transparent', color: mode === m ? '#111' : '#999', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', border: 'none', cursor: 'pointer' }}>
                                {m === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>
                )}

                {mode === 'forgot' && forgotSent ? (
                    <div className="flex flex-col items-center text-center">
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: 600 }}>Check your inbox!</p>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>
                            If this email is registered, you will receive a reset link shortly.
                        </p>
                        <button onClick={() => switchMode('login')} className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Back to Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 mb-4">
                            {mode !== 'forgot' && (
                                <div>
                                    <label className="text-gray-500 block mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                           placeholder="Enter your username" style={inputStyle} />
                                </div>
                            )}
                            {(mode === 'register' || mode === 'forgot') && (
                                <div>
                                    <label className="text-gray-500 block mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                           placeholder="Enter your email" style={inputStyle} />
                                </div>
                            )}
                            {mode !== 'forgot' && (
                                <div>
                                    <label className="text-gray-500 block mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Password</label>
                                    <input type="password" value={password} onChange={e => handlePasswordChange(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                           placeholder="Enter your password" style={inputStyle} />
                                    {mode === 'register' && passwordHint && (
                                        <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '5px', fontFamily: 'Afacad, sans-serif' }}>⚠ {passwordHint}</p>
                                    )}
                                    {mode === 'register' && password && !passwordHint && (
                                        <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '5px', fontFamily: 'Afacad, sans-serif' }}>✓ Strong password</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {mode === 'login' && (
                            <button onClick={() => switchMode('forgot')} className="text-left mb-4 hover:underline"
                                    style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif', color: '#3B6FE0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                Forgot your password?
                            </button>
                        )}

                        {error && (
                            <p className="text-red-500 mb-4 text-center" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{error}</p>
                        )}

                        <button onClick={handleSubmit} disabled={isLoading} className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none' }}>
                            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                        </button>

                        {mode === 'forgot' && (
                            <button onClick={() => switchMode('login')} className="mt-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                                ← Back to Sign In
                            </button>
                        )}
                        {mode !== 'forgot' && (
                            <button onClick={() => setPage('home')} className="mt-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                                ← Back to home
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
