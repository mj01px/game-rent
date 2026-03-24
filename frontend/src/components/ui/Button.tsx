import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger:  { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
}

const sizeStyles: Record<Size, CSSProperties> = {
    sm: { padding: '6px 12px',  fontSize: '12px', borderRadius: '6px' },
    md: { padding: '10px 20px', fontSize: '14px', borderRadius: '10px' },
    lg: { padding: '13px 26px', fontSize: '15px', borderRadius: '10px' },
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
    fullWidth?: boolean
    children: ReactNode
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    disabled,
    children,
    style,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            style={{
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.5 : 1,
                border: 'none',
                transition: 'background 150ms ease, transform 150ms ease, opacity 150ms ease',
                width: fullWidth ? '100%' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                ...variantStyles[variant],
                ...sizeStyles[size],
                ...style,
            }}
        >
            {loading ? (
                <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    {children}
                </>
            ) : children}
        </button>
    )
}
