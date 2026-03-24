interface StarsProps {
    rating: number
    size?: number
}

export default function Stars({ rating, size = 12 }: StarsProps) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(n => {
                const fill = Math.min(1, Math.max(0, rating - (n - 1)))
                const id = `star-${n}-${rating}`
                return (
                    <svg key={n} width={size} height={size} viewBox="0 0 24 24">
                        <defs>
                            <linearGradient id={id}>
                                <stop offset={`${fill * 100}%`} stopColor="#F59E0B" />
                                <stop offset={`${fill * 100}%`} stopColor="#D1D5DB" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={`url(#${id})`}
                        />
                    </svg>
                )
            })}
        </div>
    )
}
