import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'income' | 'expense' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-stone-700 focus:ring-brand-primary',
  secondary: 'bg-stone-100 text-brand-primary hover:bg-stone-200 focus:ring-stone-400',
  ghost: 'bg-transparent text-brand-primary hover:bg-stone-100 focus:ring-stone-400',
  income: 'bg-brand-income text-white hover:bg-emerald-700 focus:ring-brand-income',
  expense: 'bg-brand-expense text-white hover:bg-rose-700 focus:ring-brand-expense',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-400',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
