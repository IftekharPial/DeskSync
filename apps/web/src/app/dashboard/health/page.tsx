'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SystemMetrics } from '@/components/health/system-metrics'
import { WebhookHealth } from '@/components/health/webhook-health'
import { DatabaseHealth } from '@/components/health/database-health'
import { AlertsPanel } from '@/components/health/alerts-panel'
import { HealthChart } from '@/components/health/health-chart'
import { 
  Activity, 
  Server, 
  Database, 
  Webhook,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SystemHealthPage() {
  const { data: session } = useSession()
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get system health data with auto-refresh
  const { data: healthData, isLoading, refetch } = useQuery(
    'system-health',
    () => analyticsApi.getWebhookAnalytics(),
    {
      select: (response) => response.data.data,
      refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
      refetchIntervalInBackground: true,
    }
  )

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refetch])

  const systemStats = healthData?.systemStats || {}
  const webhooks = healthData?.webhooks || []

  // Calculate overall system health
  const getSystemHealth = () => {
    const successRate = systemStats.successRate || 0
    const avgResponseTime = systemStats.averageResponseTime || 0
    
    if (successRate >= 99 && avgResponseTime < 500) return 'excellent'
    if (successRate >= 95 && avgResponseTime < 1000) return 'good'
    if (successRate >= 90 && avgResponseTime < 2000) return 'warning'
    return 'critical'
  }

  const systemHealth = getSystemHealth()

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5" />
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system performance, webhook delivery, and infrastructure health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Overall system health and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner text="Loading system health..." />
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className={`p-4 rounded-lg ${getHealthColor(systemHealth)}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getHealthIcon(systemHealth)}
                  <span className="font-medium">Overall Health</span>
                </div>
                <div className="text-2xl font-bold capitalize">{systemHealth}</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Webhook className="h-5 w-5" />
                  <span className="font-medium">Webhook Success</span>
                </div>
                <div className="text-2xl font-bold">{systemStats.successRate || 0}%</div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Server className="h-5 w-5" />
                  <span className="font-medium">Response Time</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(systemStats.averageResponseTime || 0)}ms</div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Active Webhooks</span>
                </div>
                <div className="text-2xl font-bold">{webhooks.length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      <SystemMetrics data={systemStats} />

      {/* Health Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              System performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HealthChart data={healthData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Current alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsPanel systemHealth={systemHealth} systemStats={systemStats} />
          </CardContent>
        </Card>
      </div>

      {/* Component Health */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Webhook Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Webhook className="mr-2 h-5 w-5" />
              Webhook Health
            </CardTitle>
            <CardDescription>
              Webhook delivery performance and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookHealth webhooks={webhooks} systemStats={systemStats} />
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Health
            </CardTitle>
            <CardDescription>
              Database performance and connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DatabaseHealth />
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleString()}
        {autoRefresh && ' • Auto-refreshing every 30 seconds'}
      </div>
    </div>
  )
}
