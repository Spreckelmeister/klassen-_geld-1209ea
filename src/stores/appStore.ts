import { create } from 'zustand'

export type UserRole = 'treasurer' | 'auditor'

interface AppState {
  isSetupComplete: boolean
  isAuthenticated: boolean
  role: UserRole
  activeClassId: number | null
  setSetupComplete: (value: boolean) => void
  setAuthenticated: (value: boolean) => void
  setRole: (role: UserRole) => void
  setActiveClassId: (id: number | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  isSetupComplete: localStorage.getItem('setupComplete') === 'true',
  isAuthenticated: !localStorage.getItem('pin'),
  role: 'treasurer',
  activeClassId: (() => {
    const stored = localStorage.getItem('activeClassId')
    return stored ? parseInt(stored) : null
  })(),
  setSetupComplete: (value) => {
    localStorage.setItem('setupComplete', String(value))
    set({ isSetupComplete: value })
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setRole: (role) => set({ role }),
  setActiveClassId: (id) => {
    if (id !== null) {
      localStorage.setItem('activeClassId', String(id))
    } else {
      localStorage.removeItem('activeClassId')
    }
    set({ activeClassId: id })
  },
}))
