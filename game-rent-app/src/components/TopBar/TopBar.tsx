import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import React from "react"

interface TopBarProps {
    page: string
    setPage: (p: string) => void
    onSearch?: (q: string) => void
}

const nav = [
    { label: 'Catalog', p: 'home' },
    { label: 'Favorites', p: 'favorites' },
    { label: 'My Games', p: 'mygames' },
    { label: 'New releases', p: 'newreleases' },
]

export default function TopBar({ page, setPage, onSearch }: TopBarProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { user, isAuthenticated, logout } = useApp()

    const isActive = (p: string) =>
        page === p || (p === 'home' && (page === 'home' || page === 'gamedetail'))

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const goTo = (p: string) => {
        setDropdownOpen(false)
        setPage(p)
    }

    const dropdownItems = [
        { label: 'Profile', page: 'profile', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
        ...(user?.is_staff ? [{ label: 'Admin Portal', page: 'admin', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg> }] : []),
    ]

    return (
        <header
            className="fixed top-0 left-0 right-0 bg-white flex items-center px-4 gap-12 z-40"
            style={{ height: '88px' }}
        >
            {/* Logo */}
            <button onClick={() => setPage('home')} className="flex-shrink-0">
                <div className="flex items-center justify-center rounded-full"
                     style={{ width: '50px', height: '50px', background: '#E8342A' }}>
                    <img src="/src/assets/logo.png" alt="GameRent"/>
                </div>
            </button>

            {/* Nav */}
            <div className="flex items-center gap-1">
                {nav.map(({ label, p }) =>
                    isActive(p) ? (
                        <button key={p} onClick={() => setPage(p)}
                                className="flex items-center gap-1.5 text-white font-medium"
                                style={{ background: '#1A1A1A', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="1" y="1" width="6" height="6" rx="1" fill="white"/>
                                <rect x="9" y="1" width="6" height="6" rx="1" fill="white"/>
                                <rect x="1" y="9" width="6" height="6" rx="1" fill="white"/>
                                <rect x="9" y="9" width="6" height="6" rx="1" fill="white"/>
                            </svg>
                            {label}
                        </button>
                    ) : (
                        <button key={p} onClick={() => setPage(p)}
                                className="font-medium transition-colors"
                                style={{ padding: '6px 14px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#4B5563', background: 'none', border: 'none' }}>
                            {label}
                        </button>
                    )
                )}
            </div>

            <div className="flex-1" />

            {/* Right side */}
            <div className="flex items-center gap-3">
                {isAuthenticated ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(v => !v)}
                            className="flex items-center gap-2 text-white font-medium transition-opacity hover:opacity-90"
                            style={{ background: '#4A7FE5', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="avatar"
                                     style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)' }} />
                            ) : (
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                    {user?.username?.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            Hello, {user?.username}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                 style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0"
                                 style={{ top: 'calc(100% + 8px)', width: '180px', background: 'white', borderRadius: '14px', border: '1px solid #EBEBEB', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', overflow: 'hidden', zIndex: 100 }}>

                                <div style={{ padding: '12px 14px', borderBottom: '1px solid #F5F5F5' }}>
                                    <p style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700, color: '#1A1A1A' }}>{user?.username}</p>
                                    <p style={{ fontSize: '11px', fontFamily: 'Afacad, sans-serif', color: '#9CA3AF', marginTop: '1px' }}>{user?.email}</p>
                                </div>

                                {dropdownItems.map(({ label, page: p, icon }) => (
                                    <button key={p} onClick={() => goTo(p)}
                                            className="w-full flex items-center gap-2 transition-colors"
                                            style={{ padding: '10px 14px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <span style={{ color: '#9CA3AF' }}>{icon}</span>
                                        {label}
                                    </button>
                                ))}

                                <div style={{ borderTop: '1px solid #F5F5F5' }}>
                                    <button onClick={() => { logout(); goTo('home') }}
                                            className="w-full flex items-center gap-2 transition-colors"
                                            style={{ padding: '10px 14px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        Log out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setPage('login')}
                            className="text-white font-medium"
                            style={{ background: '#1A1A1A', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', fontFamily: 'Afacad, sans-serif' }}>
                        Login
                    </button>
                )}
            </div>
        </header>
    )
}
