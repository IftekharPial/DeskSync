'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { dailyReportsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DailyReportForm } from '@/components/reports/daily-report-form'
import { DailyReportsTable } from '@/components/reports/daily-reports-table'
import { DailyReportStats } from '@/components/reports/daily-report-stats'
import { Plus, Calendar, BarChart3 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DailyReportsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  // Check if report exists for today
  const { data: todayReport, isLoading: loadingTodayReport } = useQuery(
    ['daily-report', selectedDate],
    () => dailyReportsApi.getByDate(selectedDate),
    {
      select: (response) => response.data.data,
    }
  )

  // Get user stats
  const { data: stats, isLoading: loadingStats } = useQuery(
    'daily-report-stats',
    () => dailyReportsApi.getStats({ days: 30 }),
    {
      select: (response) => response.data.data,
    }
  )

  const hasReportToday = !!todayReport

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">
            Track your daily activities and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowForm(!showForm)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {hasReportToday ? 'Edit Today\'s Report' : 'Create Today\'s Report'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {!loadingStats && stats && (
        <DailyReportStats stats={stats} />
      )}

      {/* Today's Report Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Today's Report - {formatDate(new Date())}
          </CardTitle>
          <CardDescription>
            {hasReportToday 
              ? 'You have submitted your daily report for today'
              : 'You haven\'t submitted your daily report yet'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTodayReport ? (
            <LoadingSpinner text="Checking today's report..." />
          ) : hasReportToday ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {todayReport.ticketsResolved}
                  </div>
                  <div className="text-sm text-muted-foreground">Tickets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {todayReport.chatsHandled}
                  </div>
                  <div className="text-sm text-muted-foreground">Chats</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {todayReport.githubIssues}
                  </div>
                  <div className="text-sm text-muted-foreground">GitHub Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {todayReport.emailsProcessed}
                  </div>
                  <div className="text-sm text-muted-foreground">Emails</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {todayReport.callsAttended}
                  </div>
                  <div className="text-sm text-muted-foreground">Calls</div>
                </div>
              </div>
              {todayReport.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {todayReport.notes}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                Edit Today's Report
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No report for today</h3>
              <p className="text-muted-foreground mb-4">
                Create your daily report to track your activities and performance
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Today's Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasReportToday ? 'Edit Daily Report' : 'Create Daily Report'}
            </CardTitle>
            <CardDescription>
              {hasReportToday 
                ? 'Update your daily activities and metrics'
                : 'Record your daily activities and performance metrics'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyReportForm
              initialData={todayReport}
              onSuccess={() => {
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Reports History
          </CardTitle>
          <CardDescription>
            View and manage your previous daily reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyReportsTable />
        </CardContent>
      </Card>
    </div>
  )
}
