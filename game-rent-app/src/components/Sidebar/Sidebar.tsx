import React from 'react'
import { useApp } from '../../context/AppContext'

interface SidebarProps {
    page: string
    setPage: (p: string) => void
}

const navItems = [
    {
        p: 'home',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        p: 'favorites',
        badge: true,
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        p: 'mygames',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2"/>
                <path d="M8 12H10M9 11V13"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15" cy="12" r="1" fill={active ? '#fff' : '#9CA3AF'}/>
                <circle cx="17" cy="10" r="1" fill={active ? '#fff' : '#9CA3AF'}/>
            </svg>
        ),
    },
    {
        p: 'cart',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2"/>
                <path d="M16 10a4 4 0 01-8 0"
                      stroke={active ? '#fff' : '#9CA3AF'} strokeWidth="2"/>
            </svg>
        ),
    },
]

export default function Sidebar({ page, setPage }: SidebarProps) {
    const { isAuthenticated, user, cart, favorites } = useApp()
    const isActive = (p: string) => page === p || (p === 'home' && page === 'gamedetail')
    const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

    return (
        <aside
            className="fixed left-0 bottom-0 flex flex-col items-center py-6 z-50"
            style={{ top: '88px', width: '88px', background: 'white' }}
        >
            {/* Canto côncavo */}
            <div style={{
                position: 'absolute', top: 0, right: '-16px',
                width: '16px', height: '16px',
                background: 'transparent',
                borderTopLeftRadius: '16px',
                boxShadow: '-4px -4px 0 4px white',
                pointerEvents: 'none', zIndex: 51,
            }} />

            {/* Nav items */}
            <div className="flex flex-col items-center gap-2 flex-1 justify-start" style={{ paddingTop: '200px' }}>
                {navItems.map(({ p, icon, badge }) => {
                    const active = isActive(p)
                    const showBadge = badge && favorites.length > 0 && isAuthenticated
                    const isCart = p === 'cart'
                    const cartCount = isCart ? cart.length : 0

                    return (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            title={p}
                            className="relative flex items-center justify-center transition-all"
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: active ? '#3B6FE0' : 'transparent',
                            }}
                        >
                            {icon(active)}
                            {showBadge && (
                                <span className="absolute top-0.5 right-0.5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold"
                                      style={{ width: '14px', height: '14px', fontSize: '9px' }}>
                                    {favorites.length}
                                </span>
                            )}
                            {isCart && cartCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold"
                                      style={{ width: '14px', height: '14px', fontSize: '9px' }}>
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Avatar */}
            {isAuthenticated && (
                <button
                    onClick={() => setPage('profile')}
                    className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{
                        width: '36px', height: '36px',
                        border: page === 'profile' ? '2px solid #3B6FE0' : '2px solid transparent',
                        overflow: 'hidden',
                        background: user?.avatar ? 'transparent' : '#3B6FE0',
                    }}
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt="avatar"
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ color: 'white', fontSize: '13px', fontFamily: 'Afacad, sans-serif', fontWeight: 700 }}>
                            {initials}
                        </span>
                    )}
                </button>
            )}
        </aside>
    )
}
