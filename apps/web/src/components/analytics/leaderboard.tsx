import { useState } from 'react'
import { useQuery } from 'react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Medal, Award, TrendingUp, Users, Target } from 'lucide-react'

interface LeaderboardProps {
  className?: string
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [metric, setMetric] = useState('tickets')
  const [limit, setLimit] = useState('10')

  const { data: leaderboardData, isLoading, error } = useQuery(
    ['leaderboard', metric, limit],
    async () => {
      const response = await fetch(`/api/analytics/leaderboard?metric=${metric}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data')
      }
      return response.json()
    },
    {
      select: (response) => {
        // Ensure we always return a valid structure
        if (!response?.data?.leaderboard || !Array.isArray(response.data.leaderboard)) {
          return { leaderboard: [], metadata: null }
        }
        return response.data
      },
      retry: 3,
      retryDelay: 1000,
    }
  )

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getMetricValue = (item: any, selectedMetric: string) => {
    // Use the value from the API response
    if (selectedMetric === 'success_rate' || selectedMetric === 'completion') {
      return `${item.value}%`
    }
    return item.value
  }

  const getMetricLabel = (selectedMetric: string) => {
    switch (selectedMetric) {
      case 'chats':
        return 'Total Chats'
      case 'meetings':
        return 'Total Meetings'
      case 'reports':
        return 'Total Reports'
      case 'success_rate':
        return 'Success Rate'
      default: // tickets
        return 'Total Tickets'
    }
  }

  const getMetricIcon = (selectedMetric: string) => {
    switch (selectedMetric) {
      case 'chats':
        return <Users className="h-4 w-4" />
      case 'meetings':
        return <Users className="h-4 w-4" />
      case 'reports':
        return <TrendingUp className="h-4 w-4" />
      case 'success_rate':
        return <Target className="h-4 w-4" />
      default: // tickets
        return <Trophy className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading leaderboard..." />
        </CardContent>
      </Card>
    )
  }

  // Ensure leaderboard is always an array
  const leaderboard = Array.isArray(leaderboardData?.leaderboard)
    ? leaderboardData.leaderboard
    : []

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          Team Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers based on selected metrics
        </CardDescription>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Metric</label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tickets">Tickets Resolved</SelectItem>
                <SelectItem value="chats">Chats Handled</SelectItem>
                <SelectItem value="meetings">Meetings Held</SelectItem>
                <SelectItem value="reports">Reports Submitted</SelectItem>
                <SelectItem value="success_rate">Meeting Success Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Show Top</label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No leaderboard data available
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((item: any, index: number) => (
              <div
                key={item.user?.id || index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index < 3 ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(item.rank || index + 1)}
                  </div>
                  <div>
                    <div className="font-medium">{item.user?.name || 'Unknown User'}</div>
                    <div className="text-sm text-muted-foreground">{item.user?.email || ''}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getMetricIcon(metric)}
                    <span className="text-lg font-bold">
                      {getMetricValue(item, metric)}
                    </span>
                    {item.trend && (
                      <span className={`text-xs ${
                        item.trend === 'up' ? 'text-green-500' :
                        item.trend === 'down' ? 'text-red-500' :
                        'text-gray-500'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getMetricLabel(metric)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {leaderboardData?.period && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            Period: {leaderboardData.period.startDate} to {leaderboardData.period.endDate}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
