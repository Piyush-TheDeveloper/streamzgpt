import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { listProfiles } from '@/services/profiles'
import { ProfileContext } from './ProfileContext'

const storageKey = (userId: string) => `streamz.profile.${userId}`

function readStored(userId: string | undefined) {
  if (!userId) return null
  try {
    return localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.$id
  const [chosen, setChosen] = useState<{ userId?: string; id: string | null }>(
    () => ({ userId, id: readStored(userId) }),
  )
  // The remembered choice belongs to one user: reload it only when that changes.
  if (chosen.userId !== userId) {
    setChosen({ userId, id: readStored(userId) })
  }
  const activeId = chosen.userId === userId ? chosen.id : null

  const query = useQuery({
    queryKey: ['profiles', userId],
    queryFn: () => listProfiles(userId!),
    enabled: Boolean(userId),
    staleTime: Infinity,
  })

  const setActive = useCallback(
    (id: string | null) => {
      setChosen({ userId, id })
      if (!userId) return
      try {
        if (id) localStorage.setItem(storageKey(userId), id)
        else localStorage.removeItem(storageKey(userId))
      } catch {
        /* storage unavailable: choice lasts for this page load only */
      }
    },
    [userId],
  )

  const profiles = useMemo(() => query.data ?? [], [query.data])
  const { refetch } = query
  const value = useMemo(
    () => ({
      profiles,
      active: profiles.find(p => p.id === activeId) ?? null,
      // A failed background refetch must not hide profiles we already have.
      status:
        query.isError && !query.data
          ? ('error' as const)
          : query.isPending && userId
            ? ('loading' as const)
            : ('ready' as const),
      setActive,
      refetch: () => void refetch(),
    }),
    [
      profiles,
      activeId,
      query.isError,
      query.data,
      query.isPending,
      userId,
      setActive,
      refetch,
    ],
  )
  return <ProfileContext value={value}>{children}</ProfileContext>
}
