'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface PerformanceChartProps {
  data: any
  isAdmin: boolean
}

export function PerformanceChart({ data, isAdmin }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data) return []

    if (isAdmin) {
      // For admin, show team performance over time
      const timeSeries = data.timeSeries || []
      if (!Array.isArray(timeSeries)) return []
      return timeSeries.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        tickets: item.tickets,
        chats: item.chats,
        emails: item.emails,
      }))
    } else {
      // For users, show their recent reports
      const recentReports = data.userStats?.dailyReports?.recentReports || []
      if (!Array.isArray(recentReports)) return []
      return recentReports.slice(-7).map((report: any) => ({
        date: new Date(report.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        tickets: report.ticketsResolved,
        chats: report.chatsHandled,
        emails: report.emailsProcessed,
        calls: report.callsAttended,
      }))
    }
  }, [data, isAdmin])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No data available</p>
          <p className="text-xs mt-1">
            {isAdmin 
              ? 'Team performance data will appear here once reports are submitted'
              : 'Your performance data will appear here once you submit daily reports'
            }
          </p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    // Line chart for admin (time series)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Tickets"
          />
          <Line
            type="monotone"
            dataKey="chats"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            name="Chats"
          />
          <Line
            type="monotone"
            dataKey="emails"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            name="Emails"
          />
        </LineChart>
      </ResponsiveContainer>
    )
  } else {
    // Bar chart for individual users
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
          />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Bar
            dataKey="tickets"
            fill="hsl(var(--primary))"
            name="Tickets"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="chats"
            fill="hsl(var(--destructive))"
            name="Chats"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="emails"
            fill="hsl(var(--muted-foreground))"
            name="Emails"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }
}
