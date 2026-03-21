import type { CSSProperties } from 'react'

interface SkeletonProps {
    className?: string
    style?: CSSProperties
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{ background: 'var(--surface-2)', borderRadius: '6px', ...style }}
        />
    )
}

export function GameCardSkeleton() {
    return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <Skeleton style={{ aspectRatio: '3/4', borderRadius: 0 }} />
            <div className="p-3 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton style={{ height: '36px', marginTop: '8px', borderRadius: '10px' }} />
            </div>
        </div>
    )
}
