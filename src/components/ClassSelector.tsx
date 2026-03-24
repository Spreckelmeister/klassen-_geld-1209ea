import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClassInfo } from '@/types'

interface ClassSelectorProps {
  classes: ClassInfo[]
  activeId: number | null
  onChange: (id: number) => void
}

export function ClassSelector({ classes, activeId, onChange }: ClassSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const activeClass = classes.find((c) => c.id === activeId) || classes[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200 transition-colors min-h-[36px]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Klasse wechseln"
      >
        <span>{activeClass?.className || 'Klasse'}</span>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Klassen"
        >
          {classes.map((c) => (
            <button
              key={c.id}
              role="option"
              aria-selected={c.id === activeId}
              onClick={() => {
                if (c.id) {
                  onChange(c.id)
                  setOpen(false)
                }
              }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-stone-50 ${
                c.id === activeId ? 'text-brand-primary font-medium' : 'text-stone-700'
              }`}
            >
              <div>
                <span>{c.className}</span>
                <span className="ml-2 text-xs text-stone-400">{c.schoolYear}</span>
              </div>
              {c.id === activeId && (
                <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-stone-100 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false)
                navigate('/setup?mode=add-class')
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-brand-primary hover:bg-stone-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Neue Klasse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
