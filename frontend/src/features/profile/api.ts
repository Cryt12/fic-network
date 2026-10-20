import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey, type User } from '@/features/auth/api'
import type { DetailsValues, EmailValues, PasswordValues } from '@/features/profile/schema'
import { api } from '@/lib/api'

/** Every profile change returns the updated account, which replaces the cached "me". */
function useProfileMutation<V>(request: (values: V) => Promise<{ data: User }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: V) => (await request(values)).data,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  })
}

export const useUpdateDetails = () =>
  useProfileMutation((values: Partial<DetailsValues>) => api<{ data: User }>('/profile', { method: 'PATCH', body: values }))

export const useUpdateEmail = () => useProfileMutation((values: EmailValues) => api<{ data: User }>('/profile/email', { method: 'PATCH', body: values }))

export const useChangeMyPassword = () =>
  useProfileMutation((values: PasswordValues) => api<{ data: User }>('/auth/change-password', { method: 'POST', body: values }))

export const useUploadPhoto = () =>
  useProfileMutation((file: File) => {
    const body = new FormData()
    body.append('photo', file)
    return api<{ data: User }>('/profile/photo', { method: 'POST', body })
  })

export const useRemovePhoto = () => useProfileMutation(() => api<{ data: User }>('/profile/photo', { method: 'DELETE' }))
