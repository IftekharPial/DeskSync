'use client'

import { useQuery } from 'react-query'
import { dailyReportsApi, meetingReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Users, BarChart3, FileText, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  // Get daily report stats
  const { data: dailyStats, isLoading: loadingDailyStats } = useQuery(
    'daily-report-stats',
    () => dailyReportsApi.getStats({ days: 30 }),
    {
      select: (response) => response.data.data,
    }
  )

  // Get meeting stats
  const { data: meetingStats, isLoading: loadingMeetingStats } = useQuery(
    'meeting-stats',
    () => meetingReportsApi.getStats({ days: 30 }),
    {
      select: (response) => response.data.data,
    }
  )

  // Check if report exists for today
  const { data: todayReport, isLoading: loadingTodayReport } = useQuery(
    ['daily-report', new Date().toISOString().split('T')[0]],
    () => dailyReportsApi.getByDate(new Date().toISOString().split('T')[0]),
    {
      select: (response) => response.data.data,
    }
  )

  const hasReportToday = !!todayReport
  const isLoading = loadingDailyStats || loadingMeetingStats || loadingTodayReport

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading reports overview..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Track your daily activities and meeting outcomes
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Reports</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingStats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tickets/Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(dailyStats?.averageTicketsResolved || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Performance metric
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Success</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingStats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Daily Reports
            </CardTitle>
            <CardDescription>
              Track your daily activities and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Today's Report Status:</span>
                <span className={`font-medium ${hasReportToday ? 'text-green-600' : 'text-orange-600'}`}>
                  {hasReportToday ? 'Completed' : 'Pending'}
                </span>
              </div>
              {dailyStats && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {Math.round(dailyStats.averageTicketsResolved || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {Math.round(dailyStats.averageChatsHandled || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Chats</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard/reports/daily">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Daily Reports
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/reports/daily">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Meeting Reports
            </CardTitle>
            <CardDescription>
              Track meeting outcomes and action items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {meetingStats && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {meetingStats.successRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {meetingStats.outcomeStats?.SUCCESSFUL || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {meetingStats.outcomeStats?.RESCHEDULED || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Rescheduled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {meetingStats.outcomeStats?.CANCELLED || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Cancelled</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard/reports/meeting">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Meeting Reports
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/reports/meeting">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common reporting tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Daily Reporting</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/dashboard/reports/daily">
                    <Calendar className="mr-2 h-4 w-4" />
                    {hasReportToday ? 'Edit Today\'s Report' : 'Create Today\'s Report'}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/dashboard/reports/daily">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Report History
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Meeting Management</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/dashboard/reports/meeting">
                    <Users className="mr-2 h-4 w-4" />
                    Create Meeting Report
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/dashboard/reports/meeting">
                    <Clock className="mr-2 h-4 w-4" />
                    View Meeting History
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
