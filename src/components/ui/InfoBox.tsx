import type { ReactNode } from 'react'

interface InfoBoxProps {
  children: ReactNode
  variant?: 'info' | 'warning' | 'privacy'
}

const variantStyles = {
  info: 'bg-sky-50 border-sky-200 text-sky-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  privacy: 'bg-sky-50 border-sky-200 text-sky-800',
}

const icons = {
  info: 'ℹ️',
  warning: '⚠️',
  privacy: '🔒',
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm leading-relaxed ${variantStyles[variant]}`}
      role="note"
    >
      <span className="mr-2" aria-hidden="true">{icons[variant]}</span>
      {children}
    </div>
  )
}
