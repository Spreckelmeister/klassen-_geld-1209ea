import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'income' | 'expense' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-slate-700 to-slate-900 text-white hover:from-slate-600 hover:to-slate-800 focus:ring-brand-primary shadow-sm',
  secondary: 'bg-slate-100 text-brand-primary hover:bg-slate-200 focus:ring-slate-400',
  ghost: 'bg-transparent text-brand-primary hover:bg-slate-100 focus:ring-slate-400',
  income: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white hover:from-emerald-300 hover:to-emerald-500 focus:ring-brand-income shadow-sm',
  expense: 'bg-gradient-to-b from-rose-400 to-rose-600 text-white hover:from-rose-300 hover:to-rose-500 focus:ring-brand-expense shadow-sm',
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
