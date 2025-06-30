'use client'

import { useQuery } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { StatsCard } from '@/components/dashboard/stats-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Webhook, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'

export function WebhookStats() {
  const { data: analyticsData, isLoading } = useQuery(
    'webhook-analytics',
    () => analyticsApi.getWebhookAnalytics(),
    {
      select: (response) => {
        // Ensure we always return a valid structure
        if (!response?.data?.data) {
          return { webhooks: [], systemStats: {} }
        }

        const data = response.data.data
        return {
          webhooks: Array.isArray(data.webhooks) ? data.webhooks : [],
          systemStats: data.systemStats || {}
        }
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  const systemStats = analyticsData?.systemStats || {}
  const webhookCount = analyticsData?.webhooks?.length || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Active Webhooks"
        value={webhookCount}
        description="Total configured webhooks"
        icon={Webhook}
        trend={webhookCount > 0 ? 5 : 0}
      />
      <StatsCard
        title="Success Rate"
        value={`${systemStats.successRate || 0}%`}
        description="Delivery success rate"
        icon={CheckCircle}
        trend={systemStats.successRate > 95 ? 8 : systemStats.successRate > 90 ? 3 : -2}
      />
      <StatsCard
        title="Total Deliveries"
        value={systemStats.totalDeliveries || 0}
        description="Last 24 hours"
        icon={Activity}
        trend={15}
      />
      <StatsCard
        title="Avg Response Time"
        value={`${Math.round(systemStats.averageResponseTime || 0)}ms`}
        description="Average delivery time"
        icon={Clock}
        trend={systemStats.averageResponseTime < 1000 ? 5 : systemStats.averageResponseTime < 2000 ? 0 : -3}
      />
    </div>
  )
}
