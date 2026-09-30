import { createContext, useContext } from 'react'
import type { Profile } from '@/types/profile'

export interface ProfileState {
  profiles: Profile[]
  active: Profile | null
  status: 'loading' | 'error' | 'ready'
  setActive: (id: string | null) => void
  refetch: () => void
}

export const ProfileContext = createContext<ProfileState | null>(null)

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
