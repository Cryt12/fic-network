import { createContext, use } from 'react'
import type { User } from '@/features/auth/api'

/**
 * Provided by ProtectedRoute. Reading the user from context (not the query cache)
 * means components never see it vanish mid-logout before the redirect happens.
 */
export const CurrentUserContext = createContext<User | null>(null)

export function useCurrentUser(): User {
  const user = use(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser() must be used inside ProtectedRoute')
  return user
}
