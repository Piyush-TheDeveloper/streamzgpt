import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createProfile,
  deleteProfile,
  updateProfile,
} from '@/services/profiles'
import type { ProfileInput } from '@/types/profile'

function useInvalidateProfiles() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['profiles', user?.$id] })
}

export function useCreateProfile() {
  const { user } = useAuth()
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: (input: ProfileInput) => createProfile(user!.$id, input),
    onSuccess: invalidate,
  })
}

export function useUpdateProfile(id: string) {
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteProfile() {
  const invalidate = useInvalidateProfiles()
  return useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: invalidate,
  })
}
