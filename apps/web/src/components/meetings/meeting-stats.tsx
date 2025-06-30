import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  MessageSquare, 
  Clock, 
  Users, 
  CheckCircle,
  Calendar,
  TrendingUp,
  Target
} from 'lucide-react'

interface MeetingStatsProps {
  stats: {
    period: {
      days: number
      startDate: string
      endDate: string
    }
    totalMeetings: number
    outcomeStats: Record<string, number>
    totalMinutes: number
    averageDuration: number
    recentMeetings: any[]
  }
}

export function MeetingStats({ stats }: MeetingStatsProps) {
  const {
    totalMeetings = 0,
    outcomeStats = {},
    totalMinutes = 0,
    averageDuration = 0,
    period = { days: 30, startDate: '', endDate: '' }
  } = stats || {}

  const successfulMeetings = outcomeStats?.SUCCESSFUL || 0
  const successRate = totalMeetings > 0 ? Math.round((successfulMeetings / totalMeetings) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Meetings"
          value={totalMeetings}
          description={`Last ${period?.days || 30} days`}
          icon={MessageSquare}
          trend={totalMeetings > 10 ? 15 : totalMeetings > 5 ? 8 : 0}
        />
        <StatsCard
          title="Success Rate"
          value={`${successRate}%`}
          description="Successful meetings"
          icon={CheckCircle}
          trend={successRate > 80 ? 12 : successRate > 60 ? 5 : -3}
        />
        <StatsCard
          title="Total Time"
          value={`${Math.round(totalMinutes / 60)}h`}
          description="Time in meetings"
          icon={Clock}
          trend={8}
        />
        <StatsCard
          title="Avg Duration"
          value={`${averageDuration}min`}
          description="Average meeting length"
          icon={TrendingUp}
          trend={averageDuration < 60 ? 5 : averageDuration < 90 ? 0 : -2}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Meeting Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Outcomes</CardTitle>
            <CardDescription>
              Breakdown of meeting results over the last {period?.days || 30} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(outcomeStats || {}).map(([outcome, count]) => {
                const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0
                const getOutcomeColor = (outcome: string) => {
                  switch (outcome) {
                    case 'SUCCESSFUL':
                      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                    case 'CANCELLED':
                      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                    case 'RESCHEDULED':
                      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
                    case 'PENDING':
                      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
                    default:
                      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
                  }
                }

                return (
                  <div key={outcome} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(outcome)}`}>
                        {outcome}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{count}</div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Time Analysis</CardTitle>
            <CardDescription>
              Meeting time breakdown and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Meeting Time</span>
                </div>
                <span className="text-lg font-bold">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Average Duration</span>
                </div>
                <span className="text-lg font-bold">{averageDuration} minutes</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Meetings per Day</span>
                </div>
                <span className="text-lg font-bold">
                  {(totalMeetings / (period?.days || 30)).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Efficiency Score</span>
                </div>
                <span className={`text-lg font-bold ${
                  successRate > 80 ? 'text-green-600' : 
                  successRate > 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {successRate > 80 ? 'Excellent' : 
                   successRate > 60 ? 'Good' : 'Needs Improvement'}
                </span>
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
            Key insights about your meeting patterns and effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {successRate}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {averageDuration < 60 ? '⚡' : averageDuration < 90 ? '⏱️' : '🐌'}
              </div>
              <div className="text-sm text-muted-foreground">
                {averageDuration < 60 ? 'Quick Meetings' : 
                 averageDuration < 90 ? 'Standard Length' : 'Long Meetings'}
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {totalMeetings > 20 ? '🔥' : totalMeetings > 10 ? '📈' : '🌱'}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalMeetings > 20 ? 'Very Active' : 
                 totalMeetings > 10 ? 'Active' : 'Getting Started'}
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round(totalMinutes / totalMeetings) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Minutes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
