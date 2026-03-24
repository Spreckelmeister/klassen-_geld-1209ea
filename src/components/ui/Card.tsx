import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

export function Card({ children, padding = true, className = '', ...props }: CardProps) {
  const hasBg = /bg-/.test(className)
  return (
    <div
      className={`rounded-2xl shadow-sm border border-stone-100 ${hasBg ? '' : 'bg-white'} ${padding ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
