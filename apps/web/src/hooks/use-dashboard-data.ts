import { useQuery, useQueryClient } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export function useDashboardData() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const query = useQuery(
    ['analytics', 'dashboard', session?.user?.id],
    analyticsApi.getDashboard,
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchInterval: false, // Disable automatic refetching
      enabled: !!session?.user, // Only fetch when user is authenticated
      retry: 2, // Limit retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  const refreshDashboard = () => {
    queryClient.invalidateQueries(['analytics', 'dashboard'])
  }

  const prefetchDashboard = () => {
    queryClient.prefetchQuery(
      ['analytics', 'dashboard', session?.user?.id],
      analyticsApi.getDashboard,
      {
        staleTime: 5 * 60 * 1000,
      }
    )
  }

  return {
    ...query,
    refreshDashboard,
    prefetchDashboard,
  }
}

export function useOptimizedDashboard() {
  const { data: session } = useSession()

  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => [
    'analytics',
    'dashboard',
    session?.user?.id,
    session?.user?.role
  ], [session?.user?.id, session?.user?.role])

  return useQuery(
    queryKey,
    analyticsApi.getDashboard,
    {
      select: (response) => response.data.data,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      enabled: !!session?.user,
      retry: 1, // Reduce retries for better performance
      retryDelay: 1000, // Fixed delay instead of exponential backoff
      notifyOnChangeProps: ['data', 'error', 'isLoading'], // Only re-render on these changes
      // Prevent duplicate requests
      structuralSharing: true,
      // Use background refetching for better UX
      keepPreviousData: true,
    }
  )
}
