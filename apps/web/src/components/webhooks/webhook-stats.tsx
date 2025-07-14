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
        // Extract the actual data from the API response
        if (!response?.data?.data) {
          return {
            totalWebhooks: 0,
            activeWebhooks: 0,
            successRate: 0,
            totalDeliveries: 0,
            averageResponseTime: 0,
            webhookStats: []
          }
        }

        return response.data.data
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

  // Use the correct property names from the API response
  const totalWebhooks = analyticsData?.totalWebhooks || 0
  const activeWebhooks = analyticsData?.activeWebhooks || 0
  const successRate = analyticsData?.successRate || 0
  const totalDeliveries = analyticsData?.totalDeliveries || 0
  const averageResponseTime = analyticsData?.averageResponseTime || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Active Webhooks"
        value={activeWebhooks}
        description={`${totalWebhooks} total configured`}
        icon={Webhook}
        trend={activeWebhooks > 0 ? 5 : 0}
      />
      <StatsCard
        title="Success Rate"
        value={`${successRate}%`}
        description="Delivery success rate"
        icon={CheckCircle}
        trend={successRate > 95 ? 8 : successRate > 90 ? 3 : -2}
      />
      <StatsCard
        title="Total Deliveries"
        value={totalDeliveries}
        description="All time deliveries"
        icon={Activity}
        trend={totalDeliveries > 0 ? 15 : 0}
      />
      <StatsCard
        title="Avg Response Time"
        value={`${Math.round(averageResponseTime)}ms`}
        description="Average delivery time"
        icon={Clock}
        trend={averageResponseTime < 1000 ? 5 : averageResponseTime < 2000 ? 0 : -3}
      />
    </div>
  )
}
