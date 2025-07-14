'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { webhooksApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  ArrowLeft, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Globe,
  Zap,
  BarChart3
} from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default function WebhookStatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const webhookId = params.id as string

  const [timeRange, setTimeRange] = useState('30')

  // Check if user is admin
  const isAdmin = (session as any)?.user?.role === 'ADMIN'
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get webhook details
  const { data: webhook, isLoading: loadingWebhook } = useQuery(
    ['webhook', webhookId],
    () => webhooksApi.getById(webhookId),
    {
      select: (response) => response.data?.data,
      enabled: !!webhookId,
    }
  )

  // Get webhook stats
  const { data: stats, isLoading: loadingStats } = useQuery(
    ['webhook-stats', webhookId, timeRange],
    () => webhooksApi.getStats(webhookId),
    {
      select: (response) => response.data?.data,
      enabled: !!webhookId,
    }
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PAUSED':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loadingWebhook || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!webhook) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/webhooks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webhooks
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Webhook Not Found</h3>
              <p className="text-muted-foreground">
                The webhook you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/webhooks/${webhookId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Webhook
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Webhook Statistics</h1>
            <p className="text-muted-foreground">
              {webhook.name} - Performance metrics and analytics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Webhook Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">{webhook.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center space-x-2">
                {getStatusIcon(webhook.status)}
                <Badge className={getStatusColor(webhook.status)}>
                  {webhook.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <p className="text-sm text-muted-foreground">
                {webhook.type === 'MEETING' ? '🤝 Meeting' : '📡 Generic'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground">
                {format(new Date(webhook.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Payloads"
          value={stats?.totals?.payloadLogs || 0}
          description={`${stats?.totals?.recentPayloadLogs || 0} in last ${timeRange} days`}
          icon={Activity}
          trend={stats?.totals?.recentPayloadLogs > 0 ? 5 : 0}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.performance?.successRate || 0}%`}
          description="Delivery success rate"
          icon={CheckCircle}
          trend={stats?.performance?.successRate > 95 ? 8 : stats?.performance?.successRate > 90 ? 3 : -2}
        />
        <StatsCard
          title="Active Endpoints"
          value={stats?.totals?.activeEndpoints || 0}
          description={`${stats?.totals?.endpoints || 0} total configured`}
          icon={Globe}
          trend={stats?.totals?.activeEndpoints > 0 ? 5 : 0}
        />
        <StatsCard
          title="Avg Response Time"
          value={`${stats?.performance?.averageResponseTime || 0}ms`}
          description="Average delivery time"
          icon={Clock}
          trend={stats?.performance?.averageResponseTime < 1000 ? 5 : stats?.performance?.averageResponseTime < 2000 ? 0 : -3}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Delivery Statistics
            </CardTitle>
            <CardDescription>
              Breakdown of webhook delivery performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Deliveries</span>
                <span className="text-sm text-muted-foreground">{stats?.totals?.deliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Successful</span>
                <span className="text-sm text-green-600">{stats?.totals?.successfulDeliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Failed</span>
                <span className="text-sm text-red-600">{stats?.totals?.failedDeliveries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm font-medium">{stats?.performance?.successRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Daily Activity
            </CardTitle>
            <CardDescription>
              Recent webhook activity breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.dailyBreakdown && stats.dailyBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.dailyBreakdown.slice(0, 7).map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {format(new Date(day.date), 'MMM dd')}
                    </span>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{day.payloads} payloads</span>
                      <span>{day.deliveries} deliveries</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No activity data</h3>
                <p>No webhook activity recorded for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
