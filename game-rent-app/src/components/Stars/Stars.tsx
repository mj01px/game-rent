import React from 'react'

interface StarsProps {
    rating: number
    size?: number
}

export default function Stars({ rating, size = 14 }: StarsProps) {
    return (
        <span className="flex items-center" style={{ gap: '1px' }}>
            {[1, 2, 3, 4, 5].map(i => {
                const fill = Math.min(Math.max(rating - (i - 1), 0), 1) // 0 a 1
                const id = `star-clip-${i}-${Math.round(rating * 10)}`

                return (
                    <svg
                        key={i}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <clipPath id={id}>
                                <rect x="0" y="0" width={`${fill * 100}%`} height="100%" />
                            </clipPath>
                        </defs>
                        {/* Estrela de fundo (vazia) */}
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="#E5E7EB"
                        />
                        {/* Estrela preenchida (clip parcial) */}
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="#FACC15"
                            clipPath={`url(#${id})`}
                        />
                    </svg>
                )
            })}
        </span>
    )
}
