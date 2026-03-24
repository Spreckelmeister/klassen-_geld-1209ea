import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-brand-primary placeholder:text-stone-400 focus:border-brand-info focus:outline-none focus:ring-2 focus:ring-brand-info/20 min-h-[44px] transition-colors ${error ? 'border-brand-expense focus:border-brand-expense focus:ring-brand-expense/20' : ''} ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
        {error && <p className="text-xs text-brand-expense">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
