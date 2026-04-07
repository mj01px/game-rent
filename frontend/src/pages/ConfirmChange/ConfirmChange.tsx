import { useEffect, useState, type ReactNode, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useTheme } from '../../context/ThemeContext'

type Step = 'loading' | 'email_confirm' | 'email_pending' | 'password_form' | 'success' | 'error'

export default function ConfirmChange() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { theme } = useTheme()
    const token = searchParams.get('token') || ''
    const type  = searchParams.get('type')  || ''

    const [step,            setStep]            = useState<Step>('loading')
    const [info,            setInfo]            = useState<any>(null)
    const [errorMsg,        setErrorMsg]        = useState('')
    const [newPassword,     setNewPassword]     = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading,         setLoading]         = useState(false)

    useEffect(() => {
        if (!token || !type) { setStep('error'); setErrorMsg('Invalid or missing token.'); return }
        api.get('/users/profile/confirm-change/', { params: { token, type } })
            .then(({ data }) => {
                setInfo(data.data ?? data)
                setStep(type === 'password' ? 'password_form' : 'email_confirm')
            })
            .catch(() => { setStep('error'); setErrorMsg('This link is invalid or has expired.') })
    }, [])

    const confirmEmail = async () => {
        setLoading(true)
        try {
            await api.post('/users/profile/confirm-change/', { token, type })
            setStep('success')
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.error || 'Failed to verify.')
            setStep('error')
        } finally { setLoading(false) }
    }

    const confirmEmailChange = async (confirmed: boolean) => {
        setLoading(true)
        try {
            const { data } = await api.post('/users/profile/confirm-change/', { token, type: 'email', confirmed })
            if (confirmed) { setInfo(data.data ?? data); setStep('email_pending') }
            else           { setStep('error'); setErrorMsg('Email change cancelled.') }
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.error || 'Failed.')
            setStep('error')
        } finally { setLoading(false) }
    }

    const submitPassword = async (e: FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return }
        if (newPassword.length < 8)          { setErrorMsg('Password must be at least 8 characters.'); return }
        setLoading(true); setErrorMsg('')
        try {
            await api.post('/users/profile/confirm-change/', { token, type: 'password', new_password: newPassword })
            setStep('success')
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.error || 'Failed to update password.')
        } finally { setLoading(false) }
    }

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: '12px',
        fontSize: '14px', outline: 'none',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box' as const,
        fontFamily: 'inherit',
    }

    const pillBtn = (accent = true): React.CSSProperties => ({
        padding: '11px 24px',
        background: accent ? 'var(--accent)' : 'var(--surface-2)',
        color: accent ? 'white' : 'var(--text-primary)',
        border: accent ? 'none' : '1px solid var(--border)',
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        width: '100%',
    })

    const wrapper = (children: ReactNode) => (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--bg)',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
            }}>
                {}
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                >
                    <img src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="Game Rent" style={{ height: '28px', objectFit: 'contain' }} />
                </button>

                {children}
            </div>
        </div>
    )

    if (step === 'loading') return wrapper(
        <>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Verifying your link...</p>
        </>
    )

    if (step === 'error') return wrapper(
        <>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(217,48,37,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="var(--danger)" strokeWidth="2"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Link Invalid</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{errorMsg}</p>
            <button onClick={() => navigate('/')} style={pillBtn()}>Go Home</button>
        </>
    )

    if (step === 'success') return wrapper(
        <>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="var(--success)" strokeWidth="2"/>
                    <path d="M8 12l3 3 5-5" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>All done!</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Your {type === 'password' ? 'password' : type === 'verify' ? 'email' : 'account'} has been updated successfully.
            </p>
            <button onClick={() => navigate('/login')} style={pillBtn()}>Sign In</button>
        </>
    )

    if (step === 'email_pending') return wrapper(
        <>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="var(--accent)" strokeWidth="2"/>
                    <polyline points="22,6 12,13 2,6" stroke="var(--accent)" strokeWidth="2"/>
                </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Check your new inbox</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                A verification link was sent to <strong style={{ color: 'var(--text-primary)' }}>{info?.new_email}</strong>. Click it to complete the change.
            </p>
            <button onClick={() => navigate('/')} style={pillBtn(false)}>Go Home</button>
        </>
    )

    if (step === 'email_confirm') return wrapper(
        <>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {type === 'email_new' ? 'Verify New Email' : 'Confirm Email Change'}
            </p>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {type === 'email_new' ? (
                    info?.new_email
                        ? <>Please confirm your new email: <strong style={{ color: 'var(--text-primary)' }}>{info.new_email}</strong></>
                        : 'Please click the button below to verify your new email address and complete the change.'
                ) : (
                    info?.email && info?.new_email
                        ? <>Change email from <strong style={{ color: 'var(--text-primary)' }}>{info.email}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{info.new_email}</strong>?</>
                        : 'Are you sure you want to change your email address?'
                )}
            </p>

            {['verify', 'email_new'].includes(type) ? (
                <button onClick={confirmEmail} disabled={loading} style={{ ...pillBtn(), opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>
            ) : (
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button onClick={() => confirmEmailChange(false)} disabled={loading} style={{ ...pillBtn(false), flex: 1 }}>Cancel</button>
                    <button onClick={() => confirmEmailChange(true)}  disabled={loading} style={{ ...pillBtn(true),  flex: 1, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Confirming...' : 'Confirm'}
                    </button>
                </div>
            )}
        </>
    )

    if (step === 'password_form') return wrapper(
        <form onSubmit={submitPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>Set New Password</p>
            {[
                { label: 'New Password',     value: newPassword,     setter: setNewPassword },
                { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword },
            ].map(({ label, value, setter }) => (
                <div key={label} style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
                    <input
                        type="password"
                        value={value}
                        onChange={e => setter(e.target.value)}
                        required
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                </div>
            ))}
            {errorMsg && <p style={{ fontSize: '13px', color: 'var(--danger)' }}>{errorMsg}</p>}
            <button type="submit" disabled={loading} style={{ ...pillBtn(), opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving...' : 'Save Password'}
            </button>
        </form>
    )

    return null
}