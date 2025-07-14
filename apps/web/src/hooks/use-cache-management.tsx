'use client'

import { useQueryClient } from 'react-query'
import { useCallback, useRef } from 'react'

export function useCacheManagement() {
  const queryClient = useQueryClient()

  const clearAllCache = useCallback(() => {
    console.log('🧹 Clearing all React Query cache...')
    queryClient.clear()
  }, [queryClient])

  const invalidateAllQueries = useCallback(() => {
    console.log('🔄 Invalidating all React Query queries...')
    queryClient.invalidateQueries()
  }, [queryClient])

  const clearDashboardCache = useCallback(() => {
    console.log('🏠 Clearing dashboard cache...')
    queryClient.removeQueries('dashboard')
    queryClient.invalidateQueries('dashboard')
  }, [queryClient])

  const clearReportsCache = useCallback(() => {
    console.log('📊 Clearing reports cache...')
    queryClient.removeQueries(['daily-reports'])
    queryClient.removeQueries(['meeting-reports'])
    queryClient.invalidateQueries(['daily-reports'])
    queryClient.invalidateQueries(['meeting-reports'])
  }, [queryClient])

  const clearAnalyticsCache = useCallback(() => {
    console.log('📈 Clearing analytics cache...')
    queryClient.removeQueries(['analytics'])
    queryClient.invalidateQueries(['analytics'])
  }, [queryClient])

  const clearWebhooksCache = useCallback(() => {
    console.log('🔗 Clearing webhooks cache...')
    queryClient.removeQueries(['webhooks'])
    queryClient.invalidateQueries(['webhooks'])
  }, [queryClient])

  const clearUsersCache = useCallback(() => {
    console.log('👥 Clearing users cache...')
    queryClient.removeQueries(['users'])
    queryClient.invalidateQueries(['users'])
  }, [queryClient])

  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all application data...')
    
    // Clear all cached data
    clearAllCache()
    
    // Wait a moment for cache to clear
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Refetch critical queries
    await Promise.all([
      queryClient.refetchQueries('dashboard'),
      queryClient.refetchQueries(['daily-reports']),
      queryClient.refetchQueries(['meeting-reports']),
      queryClient.refetchQueries(['analytics']),
      queryClient.refetchQueries(['webhooks']),
      queryClient.refetchQueries(['users'])
    ])
    
    console.log('✅ Data refresh complete')
  }, [queryClient, clearAllCache])

  const getCacheStatus = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    const status = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      queryKeys: queries.map(q => q.queryKey)
    }
    
    console.log('📊 React Query Cache Status:', status)
    return status
  }, [queryClient])

  const debugCache = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    console.log('🔍 React Query Cache Debug:')
    console.log('Total queries:', queries.length)
    
    queries.forEach((query, index) => {
      console.log(`Query ${index + 1}:`, {
        key: query.queryKey,
        state: query.state.status,
        hasData: !!query.state.data,
        isStale: query.isStale(),
        lastUpdated: query.state.dataUpdatedAt,
        observers: query.getObserversCount()
      })
    })
  }, [queryClient])

  return {
    clearAllCache,
    invalidateAllQueries,
    clearDashboardCache,
    clearReportsCache,
    clearAnalyticsCache,
    clearWebhooksCache,
    clearUsersCache,
    refreshAllData,
    getCacheStatus,
    debugCache
  }
}

// Hook for automatic cache management during onboarding
export function useOnboardingCacheManagement() {
  const cacheManager = useCacheManagement()

  // Add a flag to prevent multiple simultaneous cache clearing operations
  const isClearingCache = useRef(false)

  const clearCacheForNewUser = useCallback(async () => {
    if (isClearingCache.current) {
      console.log('🔄 Cache clearing already in progress, skipping...')
      return
    }

    try {
      isClearingCache.current = true
      console.log('🆕 New user detected - clearing stale cache...')
      await cacheManager.refreshAllData()
      console.log('✅ Cache cleared successfully for new user')
    } catch (error) {
      console.error('❌ Error clearing cache for new user:', error)
    } finally {
      isClearingCache.current = false
    }
  }, [cacheManager.refreshAllData])

  const clearCacheAfterDataChange = useCallback(async (dataType?: 'reports' | 'webhooks' | 'users' | 'all') => {
    console.log(`📝 Data changed (${dataType || 'all'}) - refreshing cache...`)

    switch (dataType) {
      case 'reports':
        cacheManager.clearReportsCache()
        cacheManager.clearDashboardCache()
        break
      case 'webhooks':
        cacheManager.clearWebhooksCache()
        break
      case 'users':
        cacheManager.clearUsersCache()
        break
      default:
        await cacheManager.refreshAllData()
    }
  }, [
    cacheManager.clearReportsCache,
    cacheManager.clearDashboardCache,
    cacheManager.clearWebhooksCache,
    cacheManager.clearUsersCache,
    cacheManager.refreshAllData
  ])

  return {
    ...cacheManager,
    clearCacheForNewUser,
    clearCacheAfterDataChange
  }
}
