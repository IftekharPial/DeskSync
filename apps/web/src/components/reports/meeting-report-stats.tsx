import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  Timer
} from 'lucide-react'

interface MeetingReportStatsProps {
  stats: {
    totalMeetings: number
    outcomeStats: {
      SUCCESSFUL: number
      RESCHEDULED: number
      CANCELLED: number
    }
    totalMinutes: number
    averageDuration: number
    successRate: number
    period?: string
    trends?: {
      totalMeetings: string
      successRate: string
      averageDuration: string
    }
  }
}

export function MeetingReportStats({ stats }: MeetingReportStatsProps) {
  // Defensive programming with default values
  const {
    totalMeetings = 0,
    outcomeStats = {
      SUCCESSFUL: 0,
      RESCHEDULED: 0,
      CANCELLED: 0
    },
    totalMinutes = 0,
    averageDuration = 0,
    successRate = 0,
    period = 'Last 30 days',
    trends = {
      totalMeetings: '+0%',
      successRate: '+0%',
      averageDuration: '+0%'
    }
  } = stats || {}

  // Calculate additional metrics
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10
  const averageHours = Math.round(averageDuration / 60 * 10) / 10
  const productiveMeetings = outcomeStats.SUCCESSFUL
  const unproductiveMeetings = outcomeStats.CANCELLED + outcomeStats.RESCHEDULED

  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
  }

  // Parse trend value for StatsCard
  const parseTrend = (trendStr: string) => {
    const match = trendStr.match(/([+-]?)(\d+)%/)
    if (match) {
      const sign = match[1] === '-' ? -1 : 1
      const value = parseInt(match[2])
      return sign * value
    }
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Meetings"
          value={totalMeetings}
          description={period}
          icon={Users}
          trend={parseTrend(trends.totalMeetings)}
        />
        <StatsCard
          title="Success Rate"
          value={`${successRate}%`}
          description="Successful meetings"
          icon={Target}
          trend={parseTrend(trends.successRate)}
        />
        <StatsCard
          title="Total Time"
          value={totalHours > 0 ? `${totalHours}h` : formatDuration(totalMinutes)}
          description="Time in meetings"
          icon={Clock}
          trend={0}
        />
        <StatsCard
          title="Avg Duration"
          value={formatDuration(averageDuration)}
          description="Average per meeting"
          icon={Timer}
          trend={parseTrend(trends.averageDuration)}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Outcome Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Outcomes</CardTitle>
            <CardDescription>
              Breakdown of meeting results over {period.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Successful</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{outcomeStats.SUCCESSFUL}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalMeetings > 0 ? Math.round((outcomeStats.SUCCESSFUL / totalMeetings) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Rescheduled</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{outcomeStats.RESCHEDULED}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalMeetings > 0 ? Math.round((outcomeStats.RESCHEDULED / totalMeetings) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Cancelled</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{outcomeStats.CANCELLED}</span>
                  <div className="text-xs text-muted-foreground">
                    {totalMeetings > 0 ? Math.round((outcomeStats.CANCELLED / totalMeetings) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Time Analysis</CardTitle>
            <CardDescription>
              Meeting time distribution and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Meeting Time</span>
                </div>
                <span className="text-lg font-bold">
                  {totalHours > 0 ? `${totalHours}h` : formatDuration(totalMinutes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Average Duration</span>
                </div>
                <span className="text-lg font-bold">{formatDuration(averageDuration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Productive Time</span>
                </div>
                <span className="text-lg font-bold">
                  {totalMeetings > 0 ? Math.round((productiveMeetings / totalMeetings) * totalHours * 10) / 10 : 0}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Meetings per Week</span>
                </div>
                <span className="text-lg font-bold">
                  {Math.round((totalMeetings / 30) * 7 * 10) / 10}
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
            Key insights about your meeting effectiveness and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {successRate}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                {successRate >= 80 ? 'Excellent' : successRate >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {formatDuration(averageDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
              <div className="text-xs text-muted-foreground mt-1">
                {averageDuration <= 30 ? 'Efficient' : averageDuration <= 60 ? 'Standard' : 'Long'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {totalMeetings > 0 ? '📊' : '📅'}
              </div>
              <div className="text-sm text-muted-foreground">
                {totalMeetings > 0 ? 'Active Scheduler' : 'Start Scheduling'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalMeetings} meetings tracked
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
