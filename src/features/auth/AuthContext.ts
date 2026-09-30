import { createContext, useContext } from 'react'
import type { User } from '@/services/auth'

export interface AuthState {
  user: User | null
  loading: boolean
  error: boolean
  retry: () => void
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
