import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'

interface PerformanceMetrics {
  apiCalls: number
  sessionCalls: number
  dashboardCalls: number
  lastCallTime: number
  averageResponseTime: number
  cacheHitRate: number
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCalls: 0,
    sessionCalls: 0,
    dashboardCalls: 0,
    lastCallTime: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
  })
  
  const queryClient = useQueryClient()
  const startTimeRef = useRef<number>(Date.now())
  const callTimesRef = useRef<number[]>([])

  useEffect(() => {
    // Monitor React Query cache
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'queryAdded' || event?.type === 'queryUpdated') {
        const now = Date.now()
        const queryKey = event.query.queryKey
        
        setMetrics(prev => {
          const newMetrics = { ...prev }
          newMetrics.apiCalls += 1
          newMetrics.lastCallTime = now
          
          // Track specific call types
          if (queryKey.includes('session')) {
            newMetrics.sessionCalls += 1
          }
          if (queryKey.includes('dashboard')) {
            newMetrics.dashboardCalls += 1
          }
          
          // Calculate average response time
          if (event.query.state.dataUpdatedAt) {
            const responseTime = now - (event.query.state.dataUpdatedAt || now)
            callTimesRef.current.push(responseTime)
            
            // Keep only last 10 response times
            if (callTimesRef.current.length > 10) {
              callTimesRef.current.shift()
            }
            
            newMetrics.averageResponseTime = 
              callTimesRef.current.reduce((sum, time) => sum + time, 0) / 
              callTimesRef.current.length
          }
          
          return newMetrics
        })
      }
    })

    return unsubscribe
  }, [queryClient])

  const resetMetrics = () => {
    setMetrics({
      apiCalls: 0,
      sessionCalls: 0,
      dashboardCalls: 0,
      lastCallTime: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
    })
    callTimesRef.current = []
    startTimeRef.current = Date.now()
  }

  const getCallsPerMinute = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60 // minutes
    return elapsed > 0 ? Math.round(metrics.apiCalls / elapsed) : 0
  }

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      activeQueries: queries.filter(q => q.observers.length > 0).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
    }
  }

  return {
    metrics,
    resetMetrics,
    getCallsPerMinute,
    getCacheStats,
    isHighFrequency: getCallsPerMinute() > 10, // More than 10 calls per minute
  }
}

export function useApiCallTracker() {
  const [calls, setCalls] = useState<Array<{
    timestamp: number
    endpoint: string
    duration: number
    status: 'success' | 'error' | 'loading'
  }>>([])

  const trackCall = (endpoint: string, duration: number, status: 'success' | 'error' | 'loading') => {
    setCalls(prev => [
      ...prev.slice(-19), // Keep only last 20 calls
      {
        timestamp: Date.now(),
        endpoint,
        duration,
        status,
      }
    ])
  }

  const getRecentCalls = (minutes: number = 5) => {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return calls.filter(call => call.timestamp > cutoff)
  }

  const getAverageResponseTime = () => {
    const recentCalls = getRecentCalls()
    if (recentCalls.length === 0) return 0
    
    const totalTime = recentCalls.reduce((sum, call) => sum + call.duration, 0)
    return Math.round(totalTime / recentCalls.length)
  }

  const getErrorRate = () => {
    const recentCalls = getRecentCalls()
    if (recentCalls.length === 0) return 0
    
    const errorCalls = recentCalls.filter(call => call.status === 'error').length
    return Math.round((errorCalls / recentCalls.length) * 100)
  }

  return {
    calls,
    trackCall,
    getRecentCalls,
    getAverageResponseTime,
    getErrorRate,
    clearCalls: () => setCalls([]),
  }
}
