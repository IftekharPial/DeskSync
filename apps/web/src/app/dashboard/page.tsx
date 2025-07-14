'use client'

import { useSession } from 'next-auth/react'
import { useOptimizedDashboard } from '@/hooks/use-dashboard-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { EmptyDashboard } from '@/components/ui/empty-state'
import { WelcomeBanner } from '@/components/onboarding/welcome-banner'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { QuickStartGuide } from '@/components/onboarding/quick-start-guide'
import { useOnboardingChecks, useOnboarding } from '@/hooks/use-onboarding'
import { CacheDebug } from '@/components/debug/cache-debug'
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

  // Onboarding hooks
  const onboardingChecks = useOnboardingChecks()
  const { actions: onboardingActions } = useOnboarding()

  const { data: dashboardData, isLoading, error } = useOptimizedDashboard()

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

  const { dailyReports, meetingReports, userStats, deliveryStats, recentActivity } = dashboardData || {}

  // Check if this is a completely empty system (no data at all)
  const hasAnyData = (
    (dailyReports?.reportCount || 0) > 0 ||
    (meetingReports?.reportCount || 0) > 0 ||
    (userStats?.dailyReportsThisMonth || 0) > 0 ||
    (userStats?.meetingReportsThisMonth || 0) > 0 ||
    (recentActivity && recentActivity.length > 0)
  )

  // Show empty dashboard state for completely new systems
  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Overview of system performance and team metrics'
              : 'Your personal performance and recent activity'
            }
          </p>
        </div>

        {/* Onboarding Components */}
        {onboardingChecks.shouldShowWelcomeBanner && (
          <WelcomeBanner
            userRole={isAdmin ? 'ADMIN' : 'USER'}
            userName={session?.user?.name}
            onDismiss={onboardingActions.dismissWelcomeBanner}
            onStartTour={onboardingActions.startOnboardingWizard}
          />
        )}

        {onboardingChecks.shouldShowOnboardingWizard && (
          <OnboardingWizard
            userRole={isAdmin ? 'ADMIN' : 'USER'}
            onComplete={onboardingActions.completeOnboardingWizard}
            onSkip={onboardingActions.completeOnboardingWizard}
          />
        )}

        {onboardingChecks.shouldShowQuickStart && (
          <QuickStartGuide
            userRole={isAdmin ? 'ADMIN' : 'USER'}
          />
        )}

        {/* Empty State - only show if no onboarding is active */}
        {!onboardingChecks.shouldShowWelcomeBanner &&
         !onboardingChecks.shouldShowOnboardingWizard &&
         !onboardingChecks.shouldShowQuickStart && (
          <EmptyDashboard isAdmin={isAdmin} />
        )}

        {/* Quick Actions for Empty State */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium">Daily Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Track your daily activities and performance
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium">Meeting Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Log meeting outcomes and action items
                </p>
              </div>
            </div>
          </Card>
          {isAdmin && (
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">Team Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage users and view team analytics
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

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
              trend={dailyReports?.reportsTrend || 0}
            />
            <StatsCard
              title="Recent Reports"
              value={dailyReports?.reportsInRange || 0}
              description="Reports this week"
              icon={Users}
              trend={dailyReports?.reportsTrend || 0}
            />
            <StatsCard
              title="Total Tickets"
              value={dailyReports?.totalTickets || 0}
              description="Tickets resolved this week"
              icon={CheckCircle}
              trend={dailyReports?.ticketsTrend || 0}
            />
            <StatsCard
              title="Total Meetings"
              value={meetingReports?.reportCount || 0}
              description="Meetings this week"
              icon={Clock}
              trend={meetingReports?.meetingsTrend || 0}
            />
          </>
        ) : (
          // User stats
          <>
            <StatsCard
              title="Reports This Week"
              value={userStats?.dailyReportsThisMonth || 0}
              description="Daily reports submitted"
              icon={FileText}
              trend={dailyReports?.reportsTrend || 0}
            />
            <StatsCard
              title="Tickets Resolved"
              value={userStats?.totalTicketsResolved || 0}
              description="Total tickets handled"
              icon={CheckCircle}
              trend={dailyReports?.ticketsTrend || 0}
            />
            <StatsCard
              title="Meetings This Week"
              value={userStats?.meetingReportsThisMonth || 0}
              description="Meetings attended"
              icon={MessageSquare}
              trend={meetingReports?.meetingsTrend || 0}
            />
            <StatsCard
              title="Chats Handled"
              value={userStats?.totalChatsHandled || 0}
              description="Total chats handled"
              icon={TrendingUp}
              trend={dailyReports?.chatsTrend || 0}
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

      {/* Cache Debug Component (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <CacheDebug compact className="mt-6" />
      )}
    </div>
  )
}
