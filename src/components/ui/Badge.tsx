import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'income' | 'expense' | 'warning' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-stone-100 text-stone-700',
  income: 'bg-emerald-50 text-emerald-700',
  expense: 'bg-rose-50 text-rose-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sky-50 text-sky-700',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
