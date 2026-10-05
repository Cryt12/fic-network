import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'
import { meQueryKey } from '@/features/auth/api'

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Session expired or logged out elsewhere: forget the user, and the route guard sends them to /login.
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(meQueryKey, null)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
})
