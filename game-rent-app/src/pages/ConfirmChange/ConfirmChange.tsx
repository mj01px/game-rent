import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { useApp } from '../../context/AppContext'

interface ConfirmChangeProps {
    token: string
    type: string
    setPage: (p: string) => void
}

function validatePassword(password: string): string {
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
    if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/\+\=\~\`\;\'\&]/.test(password)) return 'Password must contain at least one special character (!@#$%^&* etc).'
    return ''
}

export default function ConfirmChange({ token, type, setPage }: ConfirmChangeProps) {
    const { refreshUser } = useApp()

    // Tipos de step:
    // loading → carregando info do token
    // email_confirm → mostra de/para e pede confirmação explícita
    // email_pending → aguardando verificação do novo email
    // password_form → formulário de nova senha
    // success → tudo certo
    // error → token inválido/expirado
    const [step, setStep] = useState<'loading' | 'email_confirm' | 'email_pending' | 'password_form' | 'success' | 'error'>('loading')

    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)

    // Email confirm info
    const [currentEmail, setCurrentEmail] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [emailUsername, setEmailUsername] = useState('')

    // Password form
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [passwordHint, setPasswordHint] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    useEffect(() => {
        if (type === 'verify') {
            // Verifica direto
            api.post('/users/profile/confirm-change/', { token, type })
                .then(({ data }) => { setMessage(data.detail); setStep('success'); refreshUser() })
                .catch(e => { setMessage(e?.response?.data?.error || 'Invalid or expired link.'); setStep('error') })

        } else if (type === 'email') {
            // Busca info do token para mostrar de/para antes de confirmar
            api.get(`/users/profile/confirm-change/?token=${token}&type=email`)
                .then(({ data }) => {
                    setCurrentEmail(data.current_email)
                    setNewEmail(data.new_email)
                    setEmailUsername(data.username)
                    setStep('email_confirm')
                })
                .catch(e => { setMessage(e?.response?.data?.error || 'Invalid or expired link.'); setStep('error') })

        } else if (type === 'email_new') {
            // Verifica novo email direto (usuário clicou no link do novo email)
            api.post('/users/profile/confirm-change/', { token, type: 'email_new' })
                .then(({ data }) => { setMessage(data.detail); setStep('success'); refreshUser() })
                .catch(e => { setMessage(e?.response?.data?.error || 'Invalid or expired link.'); setStep('error') })

        } else if (type === 'password') {
            setStep('password_form')

        } else {
            setMessage('Unknown confirmation type.')
            setStep('error')
        }
    }, [token, type])

    const confirmEmailChange = async () => {
        setSaving(true)
        try {
            const { data } = await api.post('/users/profile/confirm-change/', { token, type: 'email', confirmed: true })
            setMessage(data.detail)
            setStep('email_pending')
        } catch (e: any) {
            setMessage(e?.response?.data?.error || 'Failed to confirm. Please try again.')
            setStep('error')
        } finally {
            setSaving(false)
        }
    }

    const submitPassword = async () => {
        setPasswordError('')
        if (newPassword !== confirmPassword) { setPasswordError("Passwords don't match."); return }
        const hint = validatePassword(newPassword)
        if (hint) { setPasswordError(hint); return }

        setSaving(true)
        try {
            const { data } = await api.post('/users/profile/confirm-change/', { token, type: 'password', new_password: newPassword })
            setMessage(data.detail)
            setStep('success')
            refreshUser()
        } catch (e: any) {
            setPasswordError(e?.response?.data?.error || 'Invalid or expired link.')
        } finally {
            setSaving(false)
        }
    }

    const goHome = () => {
        window.history.replaceState({}, '', '/')
        setPage('home')
    }

    const EyeIcon = ({ visible }: { visible: boolean }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            {visible ? (
                <><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></>
            ) : (
                <><path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12a18.09 18.09 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>
            )}
        </svg>
    )

    const inputStyle: React.CSSProperties = {
        border: '1px solid #E0E0E0', borderRadius: '10px', padding: '10px 44px 10px 14px',
        fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#111',
        width: '100%', outline: 'none', background: 'white',
    }

    const CardHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
        <div className="flex flex-col items-center mb-8">
            <button onClick={goHome} className="flex items-center justify-center rounded-full mb-4"
                    style={{ width: '56px', height: '56px', background: '#E8342A' }}>
                <img src="/src/assets/logo.png" alt="GameRent" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            </button>
            <h1 className="font-bold text-gray-900" style={{ fontSize: '22px', fontFamily: 'Afacad, sans-serif' }}>{title}</h1>
            <p className="text-gray-400 mt-1" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{subtitle}</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">

            {/* Loading */}
            {step === 'loading' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="GameRent" subtitle="Verifying your link..." />
                    <div className="flex flex-col items-center">
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#9CA3AF' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#9CA3AF' }}>Please wait...</p>
                    </div>
                </div>
            )}

            {/* Email confirm — mostra de/para e pede confirmação */}
            {step === 'email_confirm' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="Confirm Email Change" subtitle={`Hi ${emailUsername}, please review this change`} />

                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <p style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current email</p>
                            <p style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#6B7280', fontWeight: 500 }}>{currentEmail}</p>
                        </div>
                        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                            <p style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New email</p>
                            <p style={{ fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#1A1A1A', fontWeight: 700 }}>{newEmail}</p>
                        </div>
                    </div>

                    <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginBottom: '20px', textAlign: 'center' }}>
                        After confirming, a verification link will be sent to your <strong style={{ color: '#374151' }}>new email</strong> to complete the change.
                    </p>

                    {message && (
                        <p style={{ fontSize: '13px', color: '#EF4444', fontFamily: 'Afacad, sans-serif', marginBottom: '12px', textAlign: 'center' }}>{message}</p>
                    )}

                    <button onClick={confirmEmailChange} disabled={saving}
                            className="w-full font-bold transition-opacity hover:opacity-90"
                            style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginBottom: '10px' }}>
                        {saving ? 'Confirming...' : 'Yes, change my email'}
                    </button>

                    <button onClick={goHome}
                            className="w-full font-medium transition-colors hover:bg-gray-50"
                            style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#6B7280', background: 'white', cursor: 'pointer' }}>
                        No, cancel
                    </button>
                </div>
            )}

            {/* Email pending — aguardando verificação do novo email */}
            {step === 'email_pending' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="Almost done!" subtitle="One more step" />
                    <div className="flex flex-col items-center" style={{ textAlign: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="22,6 12,13 2,6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#374151', fontWeight: 600, marginBottom: '8px' }}>Check your new inbox!</p>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>
                            We sent a verification link to <strong style={{ color: '#1A1A1A' }}>{newEmail}</strong>. Click it to complete the email change.
                        </p>
                        <button onClick={goHome} className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', color: 'white', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', border: 'none', cursor: 'pointer' }}>
                            Back to GameRent
                        </button>
                    </div>
                </div>
            )}

            {/* Password form */}
            {step === 'password_form' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="Set New Password" subtitle="Must have uppercase, lowercase, number and special character" />
                    <div className="flex flex-col gap-3 mb-4">
                        <div>
                            <label className="text-gray-500 block mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>New password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showNew ? 'text' : 'password'} placeholder="Enter new password"
                                       value={newPassword}
                                       onChange={e => { setNewPassword(e.target.value); setPasswordHint(validatePassword(e.target.value)); setPasswordError('') }}
                                       onKeyDown={e => e.key === 'Enter' && submitPassword()}
                                       style={inputStyle} autoFocus />
                                <button type="button" onClick={() => setShowNew(v => !v)}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    <EyeIcon visible={showNew} />
                                </button>
                            </div>
                            {newPassword && passwordHint && (
                                <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '5px', fontFamily: 'Afacad, sans-serif' }}>⚠ {passwordHint}</p>
                            )}
                            {newPassword && !passwordHint && (
                                <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '5px', fontFamily: 'Afacad, sans-serif' }}>✓ Strong password</p>
                            )}
                        </div>
                        <div>
                            <label className="text-gray-500 block mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Confirm password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password"
                                       value={confirmPassword}
                                       onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
                                       onKeyDown={e => e.key === 'Enter' && submitPassword()}
                                       style={{ ...inputStyle, borderColor: passwordError.includes('match') ? '#FECACA' : '#E0E0E0' }} />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    <EyeIcon visible={showConfirm} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {passwordError && (
                        <p className="text-red-500 mb-4 text-center" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{passwordError}</p>
                    )}

                    <button onClick={submitPassword} disabled={saving || !newPassword || !confirmPassword}
                            className="w-full font-bold transition-opacity hover:opacity-90"
                            style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: 'white', border: 'none', opacity: (saving || !newPassword || !confirmPassword) ? 0.4 : 1, cursor: (saving || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving...' : 'Save Password'}
                    </button>

                    <button onClick={goHome} className="mt-4 text-gray-400 hover:text-gray-600 transition-colors"
                            style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ← Back to home
                    </button>
                </div>
            )}

            {/* Success */}
            {step === 'success' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="All done!" subtitle="Your changes have been saved" />
                    <div className="flex flex-col items-center">
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#9CA3AF', marginBottom: '24px', textAlign: 'center' }}>{message}</p>
                        <button onClick={goHome} className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', color: 'white', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', border: 'none', cursor: 'pointer' }}>
                            Back to GameRent
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {step === 'error' && (
                <div className="bg-white flex flex-col" style={{ width: '400px', borderRadius: '20px', padding: '36px', border: '1px solid #EBEBEB' }}>
                    <CardHeader title="Link Invalid" subtitle="This link has expired or is invalid" />
                    <div className="flex flex-col items-center">
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: 'Afacad, sans-serif', fontSize: '14px', color: '#9CA3AF', marginBottom: '24px', textAlign: 'center' }}>{message}</p>
                        <button onClick={goHome} className="w-full font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#1A1A1A', color: 'white', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', border: 'none', cursor: 'pointer' }}>
                            Back to GameRent
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
