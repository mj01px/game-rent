import React from 'react'
import { Game } from '../../types'

interface FeaturedSidebarProps {
    games: Game[]
    activeIndex: number
    progress: number
    onSelect: (index: number) => void
    onSeeAll: () => void
}

export default function FeaturedSidebar({ games, activeIndex, progress, onSelect, onSeeAll }: FeaturedSidebarProps) {
    if (!games.length) return null

    const visible = Array.from({ length: Math.min(4, games.length) }, (_, i) => {
        const idx = (activeIndex + i) % games.length
        return { game: games[idx], idx }
    })

    return (
        <aside style={{ width: '306px', flexShrink: 0, alignSelf: 'flex-start' }}>
            <div className="bg-white sticky"
                 style={{ top: '112px', borderRadius: '16px', padding: '16px', border: '1px solid #EBEBEB', height: '380px', display: 'flex', flexDirection: 'column' }}>

                <div className="flex items-center justify-between mb-4" style={{ flexShrink: 0 }}>
                    <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px', fontFamily: 'Afacad, sans-serif' }}>
                        Featured Games
                    </h3>
                    <button onClick={onSeeAll} className="flex items-center gap-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                            style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                        See All
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col flex-1 justify-between" style={{ paddingBottom: '4px' }}>
                    {visible.map(({ game, idx }, i) => {
                        const isActive = i === 0
                        return (
                            <button key={game.id} onClick={() => onSelect(idx)}
                                    className="flex items-center gap-3 text-left w-full transition-all"
                                    style={{ borderRadius: '12px', padding: '8px', border: isActive ? '1px solid #D0D0D0' : '1px solid #F0F0F0', background: isActive ? '#FAFAFA' : 'white', cursor: 'pointer' }}>
                                <img src={game.image} alt={game.name} className="object-cover flex-shrink-0"
                                     style={{ width: '75px', height: '58px', borderRadius: '10px', border: '1px solid #EBEBEB', opacity: isActive ? 1 : 0.6 }}
                                     onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id * 10}/150/124` }} />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-medium leading-snug line-clamp-2"
                                          style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', color: isActive ? '#111' : '#999' }}>
                                        {game.name}
                                    </span>
                                    {isActive && (
                                        <div className="mt-2" style={{ height: '2px', background: '#EBEBEB', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, background: '#1A1A1A', borderRadius: '99px', transition: 'width 0.05s linear' }} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </aside>
    )
}
