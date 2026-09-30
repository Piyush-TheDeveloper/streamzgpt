import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isAppwriteConfigured } from '@/lib/appwrite'
import { getCurrentUser, type User } from '@/services/auth'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isAppwriteConfigured)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isAppwriteConfigured) return
    let cancelled = false
    getCurrentUser()
      .then(u => {
        if (cancelled) return
        setUser(u)
        setError(false)
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setLoading(true)
    setError(false)
    setAttempt(n => n + 1)
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, retry, setUser }),
    [user, loading, error, retry],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}
