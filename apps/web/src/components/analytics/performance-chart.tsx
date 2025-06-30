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
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

interface PerformanceChartProps {
  data: {
    analytics?: any
    timeSeries?: any[]
  }
  isAdmin: boolean
}

export function PerformanceChart({ data, isAdmin }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data?.timeSeries || !Array.isArray(data.timeSeries)) return []

    return data.timeSeries.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      tickets: item.tickets || 0,
      chats: item.chats || 0,
      emails: item.emails || 0,
      calls: item.calls || 0,
      githubIssues: item.githubIssues || 0,
    }))
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No data available</p>
          <p className="text-xs mt-1">
            Performance data will appear here once reports are submitted
          </p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    // Area chart for admin showing team trends
    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
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
            <Legend />
            <Area
              type="monotone"
              dataKey="tickets"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.6}
              name="Tickets"
            />
            <Area
              type="monotone"
              dataKey="chats"
              stackId="1"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive))"
              fillOpacity={0.6}
              name="Chats"
            />
            <Area
              type="monotone"
              dataKey="emails"
              stackId="1"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.6}
              name="Emails"
            />
            <Area
              type="monotone"
              dataKey="calls"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="Calls"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {chartData.reduce((sum, item) => sum + item.tickets, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {chartData.reduce((sum, item) => sum + item.chats, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Chats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {chartData.reduce((sum, item) => sum + item.emails, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {chartData.reduce((sum, item) => sum + item.calls, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Calls</div>
          </div>
        </div>
      </div>
    )
  } else {
    // Line chart for individual users
    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={400}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="tickets"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              name="Tickets"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="chats"
              stroke="hsl(var(--destructive))"
              strokeWidth={3}
              name="Chats"
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="emails"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={3}
              name="Emails"
              dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Calls"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Personal Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {chartData.reduce((sum, item) => sum + item.tickets, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {chartData.reduce((sum, item) => sum + item.chats, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Chats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {chartData.reduce((sum, item) => sum + item.githubIssues, 0)}
            </div>
            <div className="text-sm text-muted-foreground">GitHub</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {chartData.reduce((sum, item) => sum + item.emails, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Emails</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {chartData.reduce((sum, item) => sum + item.calls, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Calls</div>
          </div>
        </div>
      </div>
    )
  }
}
