import type { ReactNode } from 'react'

interface InfoBoxProps {
  children: ReactNode
  variant?: 'info' | 'warning' | 'privacy'
}

const variantStyles = {
  info: 'border-l-brand-info bg-brand-info-light/40 text-blue-900',
  warning: 'border-l-brand-warning bg-brand-warning-light/40 text-amber-900',
  privacy: 'border-l-brand-info bg-brand-info-light/40 text-blue-900',
}

const icons = {
  info: 'ℹ️',
  warning: '⚠️',
  privacy: '🔒',
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  return (
    <div
      className={`rounded-xl border-l-4 border border-transparent p-5 text-sm leading-relaxed ${variantStyles[variant]}`}
      role="note"
    >
      <span className="mr-2 text-base" aria-hidden="true">{icons[variant]}</span>
      {children}
    </div>
  )
}
