import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { verifyPin } from '@/utils/privacy'
import { Button } from '@/components/ui/Button'

export function PinLock() {
  const setAuthenticated = useAppStore((s) => s.setAuthenticated)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const storedHash = localStorage.getItem('pin')
    if (!storedHash) {
      setAuthenticated(true)
      return
    }
    const valid = await verifyPin(pin, storedHash)
    if (valid) {
      setAuthenticated(true)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-xs text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-primary">Klassenkasse</h1>
          <p className="mt-1 text-sm text-stone-500">PIN eingeben</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''))
              setError(false)
            }}
            className={`w-full text-center text-2xl tracking-[0.5em] rounded-xl border bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              error
                ? 'border-brand-expense focus:ring-brand-expense'
                : 'border-stone-200 focus:ring-brand-primary'
            }`}
            placeholder="····"
          />
          {error && <p className="text-sm text-brand-expense">Falsche PIN</p>}
          <Button type="submit" disabled={!pin}>Entsperren</Button>
        </form>
      </div>
    </div>
  )
}
