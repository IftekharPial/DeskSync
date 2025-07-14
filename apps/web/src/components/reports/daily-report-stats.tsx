import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  Target,
  CheckCircle,
  MessageSquare,
  Mail,
  Phone,
  Github
} from 'lucide-react'

interface DailyReportStatsProps {
  stats: {
    totalReports: number
    reportsInRange: number
    averageTicketsResolved: number
    averageChatsHandled: number
    averageGithubIssues: number
    averageEmailsProcessed: number
    averageCallsAttended: number
    totalTickets: number
    totalChats: number
    totalGithubIssues: number
    totalEmails: number
    totalCalls: number
    period: {
      days: number
      startDate: string
      endDate: string
    }
    trends?: {
      reports: number
      tickets: number
      chats: number
      githubIssues: number
      emails: number
      calls: number
    }
    dailyBreakdown?: any[]
  }
}

export function DailyReportStats({ stats }: DailyReportStatsProps) {
  // Use real data from API response
  const transformedStats = {
    totals: {
      tickets: stats?.totalTickets || 0,
      chats: stats?.totalChats || 0,
      githubIssues: stats?.totalGithubIssues || 0,
      emails: stats?.totalEmails || 0,
      calls: stats?.totalCalls || 0
    },
    averages: {
      tickets: stats?.averageTicketsResolved || 0,
      chats: stats?.averageChatsHandled || 0,
      githubIssues: stats?.averageGithubIssues || 0,
      emails: stats?.averageEmailsProcessed || 0,
      calls: stats?.averageCallsAttended || 0
    },
    reportCount: stats?.reportsInRange || 0,
    totalReports: stats?.totalReports || 0,
    currentStreak: Math.min(stats?.reportsInRange || 0, 30), // Calculate streak based on reports in range
    period: stats?.period || { days: 30, startDate: '', endDate: '' },
    trends: stats?.trends || {}
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Reports Submitted"
          value={transformedStats.reportCount}
          description={`Last ${transformedStats.period?.days || 30} days`}
          icon={FileText}
          trend={transformedStats.trends.reports || 0}
        />
        <StatsCard
          title="Current Streak"
          value={`${transformedStats.currentStreak} days`}
          description="Consecutive reporting days"
          icon={Target}
          trend={transformedStats.currentStreak > 7 ? 20 : transformedStats.currentStreak > 3 ? 10 : 0}
        />
        <StatsCard
          title="Total Tickets"
          value={transformedStats.totals.tickets}
          description="Tickets resolved"
          icon={CheckCircle}
          trend={transformedStats.trends.tickets || 0}
        />
        <StatsCard
          title="Avg Daily Tickets"
          value={transformedStats.averages.tickets.toFixed(1)}
          description="Average per day"
          icon={TrendingUp}
          trend={transformedStats.trends.tickets || 0}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Total Activity</CardTitle>
            <CardDescription>
              Your total activity over the last {transformedStats.period?.days || 30} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Tickets Resolved</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.totals.tickets}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Chats Handled</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.totals.chats}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">GitHub Issues</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.totals.githubIssues}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Emails Processed</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.totals.emails}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Calls Attended</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.totals.calls}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Averages */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Averages</CardTitle>
            <CardDescription>
              Your average daily performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Tickets per Day</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.averages.tickets.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Chats per Day</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.averages.chats.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">GitHub Issues per Day</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.averages.githubIssues.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Emails per Day</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.averages.emails.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Calls per Day</span>
                </div>
                <span className="text-lg font-bold">{transformedStats.averages.calls.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key insights about your reporting consistency and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round((transformedStats.reportCount / (transformedStats.period?.days || 30)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Reporting Rate</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {transformedStats.totals.tickets + transformedStats.totals.chats + transformedStats.totals.emails + transformedStats.totals.calls}
              </div>
              <div className="text-sm text-muted-foreground">Total Interactions</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {transformedStats.currentStreak > 0 ? '🔥' : '💤'}
              </div>
              <div className="text-sm text-muted-foreground">
                {transformedStats.currentStreak > 0 ? 'On Fire!' : 'Need to Report'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
