'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import { UserPerformanceTable } from '@/components/analytics/user-performance-table'
import { WebhookAnalyticsChart } from '@/components/analytics/webhook-analytics-chart'
import { ExportDialog } from '@/components/analytics/export-dialog'
import { Leaderboard } from '@/components/analytics/leaderboard'
import { 
  BarChart3, 
  Download, 
  Users, 
  TrendingUp, 
  Calendar,
  Webhook,
  FileText
} from 'lucide-react'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [showExportDialog, setShowExportDialog] = useState(false)

  const isAdmin = (session as any)?.user?.role === 'ADMIN'

  // Get daily reports analytics
  const { data: dailyReportsData, isLoading: loadingDailyReports } = useQuery(
    ['analytics-daily-reports', dateRange],
    () => analyticsApi.getDailyReports(dateRange),
    {
      select: (response) => response.data.data,
    }
  )

  // Get user performance data (admin only)
  const { data: userPerformanceData, isLoading: loadingUserPerformance } = useQuery(
    ['analytics-user-performance', dateRange],
    () => analyticsApi.getUserPerformance(dateRange),
    {
      select: (response) => response.data.data,
      enabled: isAdmin,
    }
  )

  // Get webhook analytics (admin only)
  const { data: webhookAnalyticsData, isLoading: loadingWebhookAnalytics } = useQuery(
    ['analytics-webhook', dateRange],
    () => analyticsApi.getWebhookAnalytics(dateRange),
    {
      select: (response) => response.data.data,
      enabled: isAdmin,
    }
  )

  const isLoading = loadingDailyReports || (isAdmin && (loadingUserPerformance || loadingWebhookAnalytics))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Comprehensive analytics and insights across the platform'
              : 'Your personal performance analytics and insights'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading analytics..." />
        </div>
      )}

      {/* Analytics Content */}
      {!isLoading && (
        <>
          {/* Daily Reports Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Daily Reports Performance
              </CardTitle>
              <CardDescription>
                {isAdmin 
                  ? 'Team performance metrics and trends'
                  : 'Your daily reporting performance and trends'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyReportsData ? (
                <PerformanceChart 
                  data={dailyReportsData} 
                  isAdmin={isAdmin}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected date range
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin-only sections */}
          {isAdmin && (
            <>
              {/* Team Leaderboard */}
              <Leaderboard />

              {/* User Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Team Performance
                  </CardTitle>
                  <CardDescription>
                    Individual team member performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userPerformanceData ? (
                    <UserPerformanceTable data={userPerformanceData.metrics} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No user performance data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Webhook Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Webhook className="mr-2 h-5 w-5" />
                    Webhook Analytics
                  </CardTitle>
                  <CardDescription>
                    Webhook delivery performance and system health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookAnalyticsData ? (
                    <WebhookAnalyticsChart data={webhookAnalyticsData} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No webhook analytics data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Summary Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Key Insights
              </CardTitle>
              <CardDescription>
                Summary of key performance indicators and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dailyReportsData?.analytics && (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {dailyReportsData.analytics.totalReports}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Reports</div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {Math.round(dailyReportsData.analytics.averageTickets || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Tickets/Day</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {Math.round(dailyReportsData.analytics.totalTickets || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Tickets</div>
                    </div>
                  </>
                )}

                {isAdmin && webhookAnalyticsData?.systemStats && (
                  <>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                        {webhookAnalyticsData.systemStats.successRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Webhook Success Rate</div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                        {Math.round(webhookAnalyticsData.systemStats.averageResponseTime)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        {webhookAnalyticsData.systemStats.totalDeliveries}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Deliveries</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        dateRange={dateRange}
      />
    </div>
  )
}
