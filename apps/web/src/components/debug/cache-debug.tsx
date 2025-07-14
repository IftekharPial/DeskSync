'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useCacheManagement } from '@/hooks/use-cache-management'
import { 
  RefreshCw, 
  Trash2, 
  Bug, 
  ChevronDown, 
  ChevronRight,
  Database,
  Clock,
  Eye
} from 'lucide-react'

interface CacheDebugProps {
  className?: string
  compact?: boolean
}

export function CacheDebug({ className, compact = false }: CacheDebugProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const cacheManager = useCacheManagement()

  const handleGetStatus = () => {
    const status = cacheManager.getCacheStatus()
    setCacheStatus(status)
  }

  const handleDebugCache = () => {
    cacheManager.debugCache()
  }

  const handleClearAll = async () => {
    await cacheManager.clearAllCache()
    handleGetStatus() // Refresh status after clearing
  }

  const handleRefreshAll = async () => {
    await cacheManager.refreshAllData()
    handleGetStatus() // Refresh status after refreshing
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache Debug</span>
            </div>
            <div className="flex space-x-1">
              <Button size="sm" variant="outline" onClick={handleGetStatus}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRefreshAll}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {cacheStatus && (
            <div className="mt-2 text-xs text-muted-foreground">
              {cacheStatus.totalQueries} queries, {cacheStatus.staleQueries} stale
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Cache Debug Tools</CardTitle>
                  <CardDescription>
                    Debug and manage React Query cache
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button size="sm" variant="outline" onClick={handleGetStatus}>
                  <Eye className="h-4 w-4 mr-1" />
                  Status
                </Button>
                <Button size="sm" variant="outline" onClick={handleDebugCache}>
                  <Database className="h-4 w-4 mr-1" />
                  Debug
                </Button>
                <Button size="sm" variant="outline" onClick={handleRefreshAll}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button size="sm" variant="destructive" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>

              {/* Specific Cache Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={cacheManager.clearDashboardCache}
                >
                  Clear Dashboard
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={cacheManager.clearReportsCache}
                >
                  Clear Reports
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={cacheManager.clearAnalyticsCache}
                >
                  Clear Analytics
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={cacheManager.clearWebhooksCache}
                >
                  Clear Webhooks
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={cacheManager.clearUsersCache}
                >
                  Clear Users
                </Button>
              </div>

              {/* Cache Status Display */}
              {cacheStatus && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Cache Status
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {cacheStatus.totalQueries}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Queries
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {cacheStatus.staleQueries}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stale Queries
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {cacheStatus.activeQueries}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Active Queries
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {cacheStatus.cachedQueries}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cached Queries
                      </div>
                    </div>
                  </div>

                  {/* Query Keys */}
                  <div>
                    <h5 className="font-medium mb-2">Query Keys:</h5>
                    <div className="flex flex-wrap gap-1">
                      {cacheStatus.queryKeys.map((key: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {Array.isArray(key) ? key.join(' > ') : String(key)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
                <p className="font-medium mb-1">💡 Debug Tips:</p>
                <ul className="space-y-1">
                  <li>• Click "Status" to see current cache state</li>
                  <li>• Click "Debug" to log detailed cache info to console</li>
                  <li>• Use "Refresh" to reload all data without clearing cache</li>
                  <li>• Use "Clear All" if you see stale demo data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
