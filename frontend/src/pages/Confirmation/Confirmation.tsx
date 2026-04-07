import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Rental } from '../../types'

const CONFETTI = [
    { color: '#1A73E8', x: 10,  delay: 0.0,  dur: 1.1, size: 8  },
    { color: '#FBC02D', x: 20,  delay: 0.15, dur: 1.3, size: 6  },
    { color: '#E53935', x: 33,  delay: 0.05, dur: 1.0, size: 7  },
    { color: '#43A047', x: 45,  delay: 0.25, dur: 1.4, size: 5  },
    { color: '#8E24AA', x: 55,  delay: 0.1,  dur: 1.2, size: 9  },
    { color: '#00ACC1', x: 65,  delay: 0.3,  dur: 1.1, size: 6  },
    { color: '#FB8C00', x: 75,  delay: 0.0,  dur: 1.3, size: 7  },
    { color: '#1A73E8', x: 85,  delay: 0.2,  dur: 1.0, size: 5  },
    { color: '#E53935', x: 92,  delay: 0.08, dur: 1.2, size: 8  },
    { color: '#FBC02D', x: 50,  delay: 0.18, dur: 1.4, size: 6  },
    { color: '#43A047', x: 28,  delay: 0.35, dur: 1.1, size: 7  },
    { color: '#8E24AA', x: 70,  delay: 0.12, dur: 1.3, size: 5  },
]

export default function Confirmation() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const rentals: Rental[] = state?.rentals ?? []
    const [copied, setCopied] = useState<number | null>(null)

    const copy = (text: string, id: number) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    if (rentals.length === 0) {
        navigate('/')
        return null
    }

    return (
        <>
            <style>{`
                @keyframes confettiFall {
                    0%   { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
                    80%  { opacity: 1; }
                    100% { transform: translateY(380px) rotate(600deg) scale(0.5); opacity: 0; }
                }
                @keyframes circlePop {
                    0%   { transform: scale(0); opacity: 0; }
                    60%  { transform: scale(1.15); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes checkDraw {
                    from { stroke-dashoffset: 50; opacity: 0; }
                    30%  { opacity: 1; }
                    to   { stroke-dashoffset: 0; opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>

            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 0 80px', position: 'relative' }}>

                {}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '0', overflow: 'visible', pointerEvents: 'none' }}>
                    {CONFETTI.map((p, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: `${p.x}%`,
                            top: '60px',
                            width: `${p.size}px`,
                            height: `${p.size * 1.6}px`,
                            borderRadius: '2px',
                            background: p.color,
                            animation: `confettiFall ${p.dur}s ease-out ${p.delay}s both`,
                        }} />
                    ))}
                </div>

                {}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 12l4.5 4.5L19 7"
                                stroke="var(--accent)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="50"
                                style={{ animation: 'checkDraw 0.5s ease 0.5s both' }}
                            />
                        </svg>
                    </div>
                </div>

                {}
                <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'slideUp 0.5s ease 0.3s both' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Payment confirmed!
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                        {rentals.length === 1
                            ? 'Your rental is active. Use the key below to activate your game.'
                            : `Your ${rentals.length} rentals are active. Use the keys below to activate your games.`}
                    </p>
                </div>

                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {rentals.map((rental, idx) => (
                        <div
                            key={rental.id}
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '20px',
                                padding: '20px',
                                animation: `slideUp 0.45s ease ${0.5 + idx * 0.1}s both`,
                            }}
                        >
                            {}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{rental.game_name}</p>
                                <span style={{
                                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                    background: 'rgba(30,142,62,0.10)', color: 'var(--success)',
                                }}>
                                    Active
                                </span>
                            </div>

                            {}
                            <div style={{
                                borderRadius: '12px',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                padding: '12px 16px',
                                marginBottom: '14px',
                            }}>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                    Activation Key
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <code style={{
                                        fontSize: '14px', fontFamily: 'monospace',
                                        color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em',
                                        wordBreak: 'break-all',
                                    }}>
                                        {rental.game_key_value}
                                    </code>
                                    <button
                                        onClick={() => copy(rental.game_key_value, rental.id)}
                                        style={{
                                            padding: '5px 12px', fontSize: '11px', fontWeight: 600, flexShrink: 0,
                                            background: copied === rental.id ? 'rgba(30,142,62,0.10)' : 'var(--surface)',
                                            color: copied === rental.id ? 'var(--success)' : 'var(--text-secondary)',
                                            border: `1px solid ${copied === rental.id ? 'var(--success)' : 'var(--border)'}`,
                                            borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'all 200ms ease',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {copied === rental.id ? '✓ Copied!' : 'Copy key'}
                                    </button>
                                </div>
                            </div>

                            {}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { label: 'Started', value: new Date(rental.started_at).toLocaleDateString('pt-BR') },
                                    { label: 'Expires', value: new Date(rental.expires_at).toLocaleDateString('pt-BR') },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 12px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '3px' }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {}
                <div style={{ display: 'flex', gap: '12px', animation: `slideUp 0.45s ease ${0.5 + rentals.length * 0.1}s both` }}>
                    <button
                        onClick={() => navigate('/my-games')}
                        style={{
                            flex: 1, padding: '13px', background: 'var(--accent)', color: 'white',
                            border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            borderRadius: '999px', fontFamily: 'inherit', transition: 'background 150ms ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                    >
                        Go to My Games
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            flex: 1, padding: '13px', background: 'var(--surface)', color: 'var(--text-primary)',
                            border: '1px solid var(--border)', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            borderRadius: '999px', fontFamily: 'inherit',
                        }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </>
    )
}
