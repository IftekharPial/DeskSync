'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { OnboardingProvider } from '@/hooks/use-onboarding'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - longer cache for better performance
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false
              }
              // Limit retries to prevent infinite loops
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            refetchOnWindowFocus: false, // Prevent excessive refetching
            refetchOnMount: false, // Reduce initial mount refetching
            refetchOnReconnect: true,
            refetchInterval: false, // Disable automatic refetching
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <SessionProvider
      refetchInterval={0} // Disable automatic session refetching
      refetchOnWindowFocus={false} // Prevent excessive session checks
      refetchWhenOffline={false} // Don't refetch when offline
    >
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </OnboardingProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
