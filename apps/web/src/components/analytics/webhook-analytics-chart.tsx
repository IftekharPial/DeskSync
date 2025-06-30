'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface WebhookAnalyticsChartProps {
  data: {
    webhooks?: any[]
    systemStats?: {
      totalDeliveries: number
      successfulDeliveries: number
      failedDeliveries: number
      successRate: number
      averageResponseTime: number
    }
  }
}

export function WebhookAnalyticsChart({ data }: WebhookAnalyticsChartProps) {
  // Ensure webhooks is always an array
  const webhooks = Array.isArray(data?.webhooks) ? data.webhooks : []
  // Type assertion to handle empty object type
  const systemStats = (data?.systemStats || {}) as any

  // Prepare data for charts with safe property access
  const deliveryStatusData = systemStats ? [
    { name: 'Successful', value: systemStats.successfulDeliveries || 0, color: '#10b981' },
    { name: 'Failed', value: systemStats.failedDeliveries || 0, color: '#ef4444' },
  ] : []

  const webhookPerformanceData = webhooks.slice(0, 10).map(webhook => ({
    name: webhook.name.length > 15 ? webhook.name.substring(0, 15) + '...' : webhook.name,
    deliveries: webhook.totalDeliveries || 0,
    successRate: webhook.successRate || 0,
    avgResponseTime: webhook.averageResponseTime || 0,
  }))

  if (!systemStats && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No webhook analytics data available</p>
          <p className="text-xs mt-1">
            Data will appear here once webhooks start processing requests
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Delivery Status Pie Chart */}
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Status Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deliveryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deliveryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* System Stats */}
          <div className="space-y-4">
            <h4 className="font-medium">System Performance</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Total Deliveries</div>
                  <div className="text-2xl font-bold">{systemStats.totalDeliveries || 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last 24h</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Success Rate</div>
                  <div className={`text-2xl font-bold ${
                    (systemStats.successRate || 0) > 95 ? 'text-green-600' :
                    (systemStats.successRate || 0) > 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(systemStats.successRate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {systemStats.successfulDeliveries || 0} / {systemStats.totalDeliveries || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Avg Response Time</div>
                  <div className={`text-2xl font-bold ${
                    (systemStats.averageResponseTime || 0) < 1000 ? 'text-green-600' :
                    (systemStats.averageResponseTime || 0) < 2000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(systemStats.averageResponseTime || 0)}ms
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {(systemStats.averageResponseTime || 0) < 1000 ? 'Excellent' :
                     (systemStats.averageResponseTime || 0) < 2000 ? 'Good' : 'Needs Attention'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Performance */}
      {webhookPerformanceData.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Webhook Performance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={webhookPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Bar
                dataKey="deliveries"
                fill="hsl(var(--primary))"
                name="Total Deliveries"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Webhook Details Table */}
      {webhooks.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Webhook Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Webhook</th>
                  <th className="text-left py-2 px-4 font-medium">Deliveries</th>
                  <th className="text-left py-2 px-4 font-medium">Success Rate</th>
                  <th className="text-left py-2 px-4 font-medium">Avg Response</th>
                  <th className="text-left py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.slice(0, 10).map((webhook) => (
                  <tr key={webhook.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">
                      <div className="font-medium">{webhook.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {webhook.endpointCount || 0} endpoints
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-medium">{webhook.totalDeliveries || 0}</div>
                    </td>
                    <td className="py-2 px-4">
                      <div className={`font-medium ${
                        (webhook.successRate || 0) > 95 ? 'text-green-600' : 
                        (webhook.successRate || 0) > 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(webhook.successRate || 0).toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-medium">
                        {Math.round(webhook.averageResponseTime || 0)}ms
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        webhook.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {webhook.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
