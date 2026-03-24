import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
  interactive?: boolean
}

export function Card({ children, padding = true, interactive = false, className = '', ...props }: CardProps) {
  const hasBg = /bg-/.test(className)
  return (
    <div
      className={`rounded-2xl shadow-card border border-slate-200/60 ${hasBg ? '' : 'bg-white'} ${padding ? 'p-5' : ''} ${interactive ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
