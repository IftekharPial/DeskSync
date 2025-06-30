'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface HealthChartProps {
  data?: any
}

export function HealthChart({ data }: HealthChartProps) {
  // Mock time series data for health metrics
  const healthData = [
    { time: '00:00', successRate: 98.5, responseTime: 450, deliveries: 120 },
    { time: '04:00', successRate: 99.1, responseTime: 420, deliveries: 95 },
    { time: '08:00', successRate: 97.8, responseTime: 580, deliveries: 180 },
    { time: '12:00', successRate: 98.9, responseTime: 390, deliveries: 220 },
    { time: '16:00', successRate: 99.3, responseTime: 410, deliveries: 195 },
    { time: '20:00', successRate: 98.7, responseTime: 470, deliveries: 165 },
  ]

  if (!healthData || healthData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No performance data available</p>
          <p className="text-xs mt-1">
            Performance trends will appear here once data is collected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Rate Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Success Rate Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              domain={[95, 100]}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any) => [`${value}%`, 'Success Rate']}
            />
            <Area
              type="monotone"
              dataKey="successRate"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Response Time Trends</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs fill-muted-foreground"
            />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any) => [`${value}ms`, 'Response Time']}
            />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {(healthData.reduce((sum, item) => sum + item.successRate, 0) / healthData.length).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {Math.round(healthData.reduce((sum, item) => sum + item.responseTime, 0) / healthData.length)}ms
          </div>
          <div className="text-xs text-muted-foreground">Avg Response Time</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {healthData.reduce((sum, item) => sum + item.deliveries, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Total Deliveries</div>
        </div>
      </div>
    </div>
  )
}
