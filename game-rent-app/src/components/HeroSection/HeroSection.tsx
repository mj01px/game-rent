import React, { useState, useEffect } from 'react'
import { Game } from '../../types'
import Stars from '../Stars/Stars'

interface HeroSectionProps {
    games: Game[]
    activeIndex: number
    onIndexChange: (i: number) => void
    onDetails: (game: Game) => void
    onRent: (game: Game) => void
    onPublisher: (id: number, name: string) => void
}

export default function HeroSection({ games, activeIndex, onIndexChange, onDetails, onRent, onPublisher }: HeroSectionProps) {
    const [tab, setTab] = useState<'details' | 'more'>('details')

    useEffect(() => { setTab('details') }, [activeIndex])

    if (!games.length) return null

    const game = games[activeIndex]
    const prev = () => onIndexChange(activeIndex === 0 ? games.length - 1 : activeIndex - 1)
    const next = () => onIndexChange(activeIndex === games.length - 1 ? 0 : activeIndex + 1)

    return (
        <div className="flex w-full" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', height: '380px', border: '1px solid #EBEBEB' }}>
            {/* LEFT: imagem */}
            <div className="relative flex-shrink-0" style={{ width: '433px', height: '100%' }}>
                <img src={game.image} alt={game.name} className="w-full h-full object-cover"
                     onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${game.id + 20}/433/380` }} />

                <div className="absolute bottom-0 left-4 right-4"
                     style={{ borderRadius: '14px', padding: '14px', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center justify-between">
                        <p className="text-white font-bold" style={{ fontSize: '17px', fontFamily: 'Afacad, sans-serif' }}>
                            {parseFloat(game.rental_price).toFixed(2)} USD
                            <span className="font-normal opacity-60 ml-1" style={{ fontSize: '11px' }}>per/week</span>
                        </p>
                        <button onClick={() => onRent(game)} className="flex items-center gap-2 font-bold transition-opacity hover:opacity-90"
                                style={{ background: '#C8F135', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', fontFamily: 'Afacad, sans-serif', color: '#000', width: '124px', height: '41px', justifyContent: 'center' }}>
                            Rent Now
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                </div>

                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white flex items-center justify-center rounded-full shadow-md hover:scale-105 transition-transform" style={{ width: '32px', height: '32px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white flex items-center justify-center rounded-full shadow-md hover:scale-105 transition-transform" style={{ width: '32px', height: '32px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>

            {/* RIGHT: info */}
            <div className="flex flex-col flex-1 p-6 min-w-0">
                <div className="flex gap-2 mb-3">
                    {(['details', 'more'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className="transition-all font-medium"
                                style={{ padding: '5px 18px', borderRadius: '20px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: tab === t ? 'white' : 'transparent', border: tab === t ? '1px solid #D0D0D0' : '1px solid transparent', color: tab === t ? '#000' : '#999', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                            {t === 'details' ? 'Details' : 'More Infos'}
                        </button>
                    ))}
                </div>

                <p className="text-gray-400 mb-1" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>
                    Release Date: {game.release_date || 'N/A'}
                </p>

                <h2 className="font-bold text-gray-900 leading-tight mb-2" style={{ fontSize: '26px', fontFamily: 'Afacad, sans-serif' }}>
                    {game.name}
                </h2>

                <div className="flex items-center gap-1 mb-3">
                    <Stars rating={parseFloat(game.rating)} size={13}/>
                    <span className="text-gray-500 font-medium" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                        {parseFloat(game.rating).toFixed(1)}
                    </span>
                </div>

                {tab === 'details' ? (
                    <p className="text-gray-500 leading-relaxed mb-4 flex-1"
                       style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {game.description}
                    </p>
                ) : (
                    <div className="flex flex-col flex-1 mb-4" style={{ gap: '8px' }}>
                        {[
                            { label: 'Genre', val: game.genre?.join(', ') || '—' },
                            { label: 'Platform', val: game.platform_display || game.platform },
                            { label: 'Original Price', val: `$${parseFloat(game.original_price).toFixed(2)}` },
                            { label: 'Available Keys', val: `${game.available_keys} ${game.available_keys === 1 ? 'copy' : 'copies'}` },
                            { label: 'Publisher', val: game.publisher?.name || '—' },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>{label}</span>
                                <span className="font-medium text-gray-800" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>{val}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ height: '1px', background: '#F0F0F0', marginBottom: '12px' }}/>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400" style={{ fontSize: '12px', fontFamily: 'Afacad, sans-serif' }}>Created By:</span>
                        <span className="font-medium text-gray-800" style={{ fontSize: '13px', fontFamily: 'Afacad, sans-serif' }}>
                            {game.publisher?.name || 'N/A'}
                        </span>
                    </div>
                    <button onClick={() => game.publisher && onPublisher(game.publisher.id, game.publisher.name)}
                            className="font-medium text-gray-700 transition-colors"
                            style={{ border: '1px solid #D0D0D0', borderRadius: '20px', padding: '7px 18px', fontSize: '13px', fontFamily: 'Afacad, sans-serif', background: 'transparent' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        View Publisher
                    </button>
                </div>
            </div>
        </div>
    )
}
