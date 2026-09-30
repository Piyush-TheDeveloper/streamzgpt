import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAppwriteConfigured } from '@/lib/appwrite'
import { getCurrentUser, type User } from '@/services/auth'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isAppwriteConfigured)

  useEffect(() => {
    if (!isAppwriteConfigured) return
    let cancelled = false
    getCurrentUser()
      .then(u => !cancelled && setUser(u))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ user, loading, setUser }), [user, loading])
  return <AuthContext value={value}>{children}</AuthContext>
}
