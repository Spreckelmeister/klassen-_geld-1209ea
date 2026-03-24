import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'income' | 'expense' | 'warning' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  income: 'bg-brand-income-light text-emerald-800 ring-1 ring-emerald-200/60',
  expense: 'bg-brand-expense-light text-rose-800 ring-1 ring-rose-200/60',
  warning: 'bg-brand-warning-light text-amber-800 ring-1 ring-amber-200/60',
  info: 'bg-brand-info-light text-blue-800 ring-1 ring-blue-200/60',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
