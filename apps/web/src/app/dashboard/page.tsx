'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = (session as any)?.user?.role === 'ADMIN'

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    analyticsApi.getDashboard,
    {
      select: (response) => response.data.data,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>
              Unable to load dashboard data. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { dailyReports, userStats, deliveryStats, recentActivity } = dashboardData || {}

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Overview of system performance and team metrics'
            : 'Your personal performance and recent activity'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          // Admin stats
          <>
            <StatsCard
              title="Total Reports"
              value={dailyReports?.reportCount || 0}
              description="Daily reports submitted"
              icon={FileText}
              trend={12}
            />
            <StatsCard
              title="Active Users"
              value={Array.isArray(dashboardData?.userPerformance) ? dashboardData.userPerformance.length : 0}
              description="Team members reporting"
              icon={Users}
              trend={5}
            />
            <StatsCard
              title="Webhook Success"
              value={`${deliveryStats?.successRate || 0}%`}
              description="Delivery success rate"
              icon={CheckCircle}
              trend={deliveryStats?.successRate > 95 ? 2 : -1}
            />
            <StatsCard
              title="Avg Response Time"
              value={`${Math.round(deliveryStats?.averageResponseTime || 0)}ms`}
              description="Webhook response time"
              icon={Clock}
              trend={-5}
            />
          </>
        ) : (
          // User stats
          <>
            <StatsCard
              title="Reports This Month"
              value={userStats?.dailyReports?.count || 0}
              description="Daily reports submitted"
              icon={FileText}
              trend={8}
            />
            <StatsCard
              title="Tickets Resolved"
              value={userStats?.dailyReports?.totals?.tickets || 0}
              description="Total tickets handled"
              icon={CheckCircle}
              trend={15}
            />
            <StatsCard
              title="Meetings Attended"
              value={userStats?.meetings?.count || 0}
              description="Meetings this month"
              icon={MessageSquare}
              trend={3}
            />
            <StatsCard
              title="Avg Daily Tickets"
              value={Math.round(userStats?.dailyReports?.averages?.tickets || 0)}
              description="Average per day"
              icon={TrendingUp}
              trend={userStats?.dailyReports?.averages?.tickets > 5 ? 10 : -2}
            />
          </>
        )}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              {isAdmin ? 'Team performance metrics' : 'Your performance over time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={dashboardData} isAdmin={isAdmin} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest reports and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={recentActivity || []} />
          </CardContent>
        </Card>
      </div>

      {/* Admin-only sections */}
      {isAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Webhook delivery and system status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Webhook Deliveries</span>
                  <span className="text-sm text-muted-foreground">
                    {deliveryStats?.totalDeliveries || 0} total
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className={`text-sm font-medium ${
                    (deliveryStats?.successRate || 0) > 95 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {deliveryStats?.successRate || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Deliveries</span>
                  <span className="text-sm text-destructive">
                    {deliveryStats?.failedDeliveries || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Team Summary</CardTitle>
              <CardDescription>
                Overall team performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Tickets</span>
                  <span className="text-sm text-muted-foreground">
                    {dailyReports?.totalTickets || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Chats</span>
                  <span className="text-sm text-muted-foreground">
                    {dailyReports?.totalChats || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Tickets/Day</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(dailyReports?.averageTickets || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
