import type { ReactNode } from 'react'

type BadgeVariant =
    | 'featured' | 'new'
    | 'pc' | 'playstation' | 'ps5' | 'xbox' | 'switch'
    | 'active' | 'expired' | 'pending' | 'approved' | 'rejected'
    | 'default'

const variants: Record<BadgeVariant, { bg: string; color: string }> = {
    featured:    { bg: 'rgba(3,105,161,0.12)',   color: '#0369A1' },
    new:         { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
    pc:          { bg: 'rgba(88,28,135,0.12)',   color: '#7C3AED' },
    playstation: { bg: 'rgba(3,105,161,0.12)',   color: '#0369A1' },
    ps5:         { bg: 'rgba(3,105,161,0.12)',   color: '#0369A1' },
    xbox:        { bg: 'rgba(22,101,52,0.12)',   color: '#15803D' },
    switch:      { bg: 'rgba(185,28,28,0.12)',   color: '#B91C1C' },
    active:      { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
    expired:     { bg: 'rgba(120,113,108,0.12)', color: '#78716C' },
    pending:     { bg: 'rgba(180,83,9,0.12)',    color: '#B45309' },
    approved:    { bg: 'rgba(22,163,74,0.12)',   color: '#16A34A' },
    rejected:    { bg: 'rgba(220,38,38,0.12)',   color: '#DC2626' },
    default:     { bg: 'rgba(120,113,108,0.12)', color: '#78716C' },
}

interface BadgeProps {
    variant?: BadgeVariant
    children: ReactNode
    className?: string
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
    const { bg, color } = variants[variant] ?? variants.default
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold tracking-wide ${className}`}
            style={{ background: bg, color, borderRadius: '6px' }}
        >
            {children}
        </span>
    )
}

export function platformBadge(platform: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
        pc: 'pc', playstation: 'playstation', ps5: 'ps5', xbox: 'xbox', switch: 'switch',
    }
    return map[platform.toLowerCase()] ?? 'default'
}
