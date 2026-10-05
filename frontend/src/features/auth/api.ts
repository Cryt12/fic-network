import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { LoginValues, RegisterValues } from '@/features/auth/schemas'

export type Role = 'user' | 'superadmin'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  is_superadmin: boolean
  created_at: string
}

export const meQueryKey = ['me'] as const

/** The logged-in user, or null when there is no session. */
export const meQuery = queryOptions({
  queryKey: meQueryKey,
  queryFn: async (): Promise<User | null> => {
    try {
      return (await api<{ data: User }>('/auth/me')).data
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  staleTime: 5 * 60_000,
})

export function useMe() {
  return useQuery(meQuery)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: LoginValues) => (await api<{ data: User }>('/auth/login', { method: 'POST', body: values })).data,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: RegisterValues) =>
      (await api<{ data: User }>('/auth/register', { method: 'POST', body: values })).data,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      // Drop every cached response that belonged to this user.
      queryClient.clear()
      queryClient.setQueryData(meQueryKey, null)
    },
  })
}
