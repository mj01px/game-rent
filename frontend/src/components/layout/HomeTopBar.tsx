import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_LINKS = [
    { label: 'Home',         path: '/' },
    { label: 'Catalog',      path: '/catalog' },
    { label: 'My Games',     path: '/my-games' },
    { label: 'Favorite Games', path: '/favorites' },
]

const iconBtn: React.CSSProperties = {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    transition: 'background 150ms ease',
}

export default function HomeTopBar() {
    const navigate   = useNavigate()
    const location   = useLocation()
    const { user, isAuthenticated, isAuthLoading, logout } = useAuth()
    const { cartCount } = useCart()
    const { theme } = useTheme()

    const [searchOpen, setSearchOpen]     = useState(false)
    const [query, setQuery]               = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef   = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus()
    }, [searchOpen])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setSearchOpen(false); setQuery('') }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        const q = query.trim()
        if (q) {
            navigate(`/catalog?q=${encodeURIComponent(q)}`)
            setSearchOpen(false)
            setQuery('')
        }
    }

    const openSearch = () => setSearchOpen(true)
    const closeSearch = () => { setSearchOpen(false); setQuery('') }

    return (
        <>
            {}
            {searchOpen && (
                <div
                    onClick={closeSearch}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.50)',
                        zIndex: 49,
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {}
            <header
                style={{
                    position: 'fixed',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 80px)',
                    maxWidth: '1280px',
                    height: '56px',
                    zIndex: 50,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.07), 0 2px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px 0 20px',
                    gap: '0',
                    transition: 'box-shadow 200ms ease',
                }}
            >
                {}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        flexShrink: 0, padding: '0',
                    }}
                >
                    <img
                        src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                        alt="Game Rent"
                        style={{
                            height: '36px',
                            width: '36px',
                            objectFit: 'contain',
                            display: 'block',
                            flexShrink: 0,
                        }}
                    />
                </button>

                {}
                {searchOpen ? (
                    <form
                        onSubmit={handleSearch}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '16px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search GameRent..."
                            style={{
                                flex: 1,
                                marginLeft: '10px',
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                color: 'var(--text-primary)',
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            type="button"
                            onClick={closeSearch}
                            style={{ ...iconBtn, marginLeft: '4px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,33,36,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </form>
                ) : (
                    <>
                        {}
                        <nav style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
                            {NAV_LINKS.map(({ label, path }) => {
                                const active = location.pathname === path
                                return (
                                    <button
                                        key={path}
                                        onClick={() => navigate(path)}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: active ? 500 : 400,
                                            color: active ? 'var(--accent)' : 'var(--text-secondary)',
                                            fontFamily: 'inherit',
                                            whiteSpace: 'nowrap',
                                            position: 'relative',
                                            transition: 'color 150ms ease',
                                            borderRadius: '999px',
                                        }}
                                        onMouseEnter={e => {
                                            if (!active) {
                                                e.currentTarget.style.color = 'var(--text-primary)'
                                                e.currentTarget.style.background = 'rgba(32,33,36,0.06)'
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!active) {
                                                e.currentTarget.style.color = 'var(--text-secondary)'
                                                e.currentTarget.style.background = 'none'
                                            }
                                        }}
                                    >
                                        {label}
                                        {active && (
                                            <span style={{
                                                position: 'absolute',
                                                bottom: '0px', left: '14px', right: '14px',
                                                height: '2px',
                                                background: 'var(--accent)',
                                                borderRadius: '999px',
                                            }} />
                                        )}
                                    </button>
                                )
                            })}
                        </nav>

                        {}
                        <div style={{ flex: 1 }} />

                        {}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

                            {}
                            <button
                                onClick={openSearch}
                                style={iconBtn}
                                title="Search"
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,33,36,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>

                            {}
                            <button
                                onClick={() => navigate('/cart')}
                                style={{ ...iconBtn, position: 'relative' }}
                                title="Cart"
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,33,36,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                {cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '3px', right: '3px',
                                        minWidth: '15px', height: '15px',
                                        background: 'var(--accent)', color: 'white',
                                        fontSize: '9px', fontWeight: 700,
                                        borderRadius: '999px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px', lineHeight: 1,
                                    }}>
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </button>

                            {}

                            {}
                            {isAuthLoading ? (
                                <div style={{
                                    width: '34px', height: '34px',
                                    borderRadius: '999px',
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0,
                                }} />
                            ) : isAuthenticated ? (
                                <div style={{ position: 'relative' }} ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(v => !v)}
                                        style={{
                                            width: '34px', height: '34px',
                                            borderRadius: '999px',
                                            overflow: 'hidden',
                                            border: dropdownOpen ? '2px solid var(--accent)' : '2px solid transparent',
                                            cursor: 'pointer',
                                            background: 'var(--accent)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            transition: 'border-color 150ms ease, box-shadow 150ms ease',
                                            padding: 0,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-light)'
                                            e.currentTarget.style.borderColor = 'var(--accent)'
                                        }}
                                        onMouseLeave={e => {
                                            if (!dropdownOpen) {
                                                e.currentTarget.style.boxShadow = 'none'
                                                e.currentTarget.style.borderColor = 'transparent'
                                            }
                                        }}
                                        title={user?.username}
                                    >
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="avatar"
                                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ color: 'white', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>
                                                {user?.username?.slice(0, 1).toUpperCase()}
                                            </span>
                                        )}
                                    </button>

                                    {dropdownOpen && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                                            width: '210px',
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                padding: '16px',
                                                borderBottom: '1px solid var(--border-light)',
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                            }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '999px',
                                                    background: 'var(--accent)', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden',
                                                }}>
                                                    {user?.avatar ? (
                                                        <img src={user.avatar} alt="avatar"
                                                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>
                                                            {user?.username?.slice(0, 1).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user?.username}
                                                    </p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user?.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {([
                                                { label: 'Profile',      path: '/profile' },
                                                ...(user?.is_staff ? [{ label: 'Portal', path: '/admin' }] : []),
                                            ] as { label: string; path: string }[]).map(({ label, path }) => (
                                                <button
                                                    key={path}
                                                    onClick={() => { navigate(path); setDropdownOpen(false) }}
                                                    style={{
                                                        width: '100%', textAlign: 'left',
                                                        padding: '10px 16px',
                                                        fontSize: '13px',
                                                        color: 'var(--text-primary)',
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer',
                                                        fontFamily: 'inherit',
                                                        display: 'block',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    {label}
                                                </button>
                                            ))}

                                            <div style={{ borderTop: '1px solid var(--border-light)' }}>
                                                <button
                                                    onClick={() => { logout(); navigate('/'); setDropdownOpen(false) }}
                                                    style={{
                                                        width: '100%', textAlign: 'left',
                                                        padding: '10px 16px',
                                                        fontSize: '13px',
                                                        color: 'var(--danger)',
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer',
                                                        fontFamily: 'inherit',
                                                        display: 'block',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(211,48,37,0.06)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    style={iconBtn}
                                    title="Sign in"
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,33,36,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </header>
        </>
    )
}
