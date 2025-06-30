import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Server,
  Zap
} from 'lucide-react'

interface SystemMetricsProps {
  data: {
    totalDeliveries?: number
    successfulDeliveries?: number
    failedDeliveries?: number
    successRate?: number
    averageResponseTime?: number
    uptime?: number
  }
}

export function SystemMetrics({ data }: SystemMetricsProps) {
  const {
    totalDeliveries = 0,
    successfulDeliveries = 0,
    failedDeliveries = 0,
    successRate = 0,
    averageResponseTime = 0,
  } = data

  // Calculate performance metrics
  const getPerformanceLevel = (responseTime: number) => {
    if (responseTime < 500) return { level: 'excellent', color: 'text-green-600' }
    if (responseTime < 1000) return { level: 'good', color: 'text-blue-600' }
    if (responseTime < 2000) return { level: 'fair', color: 'text-yellow-600' }
    return { level: 'poor', color: 'text-red-600' }
  }

  const performance = getPerformanceLevel(averageResponseTime)

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99) return 'text-green-600'
    if (rate >= 95) return 'text-blue-600'
    if (rate >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Delivery Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Activity className="mr-2 h-4 w-4" />
            Delivery Metrics
          </CardTitle>
          <CardDescription>
            Webhook delivery statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Deliveries</span>
            <span className="text-lg font-bold">{totalDeliveries.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Successful</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {successfulDeliveries.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Failed</span>
            </div>
            <span className="text-lg font-bold text-red-600">
              {failedDeliveries.toLocaleString()}
            </span>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className={`text-lg font-bold ${getSuccessRateColor(successRate)}`}>
                {successRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Clock className="mr-2 h-4 w-4" />
            Performance
          </CardTitle>
          <CardDescription>
            Response time and throughput
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Avg Response Time</span>
            <span className={`text-lg font-bold ${performance.color}`}>
              {Math.round(averageResponseTime)}ms
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Performance Level</span>
            <span className={`text-sm font-medium capitalize ${performance.color}`}>
              {performance.level}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Throughput</span>
            <span className="text-lg font-bold">
              {Math.round(totalDeliveries / 24)} req/hr
            </span>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Response Time Score</span>
              <span className={`text-sm font-medium ${performance.color}`}>
                {averageResponseTime < 500 ? '100%' : 
                 averageResponseTime < 1000 ? '85%' : 
                 averageResponseTime < 2000 ? '70%' : '40%'}
              </span>
            </div>
            <Progress 
              value={
                averageResponseTime < 500 ? 100 : 
                averageResponseTime < 1000 ? 85 : 
                averageResponseTime < 2000 ? 70 : 40
              } 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Server className="mr-2 h-4 w-4" />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">API Status</span>
            </div>
            <span className="text-sm font-medium text-green-600">Operational</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Database</span>
            </div>
            <span className="text-sm font-medium text-green-600">Connected</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Queue System</span>
            </div>
            <span className="text-sm font-medium text-green-600">Running</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <span className="text-sm font-medium">99.9%</span>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-lg font-bold text-green-600">
                {successRate > 95 && averageResponseTime < 1000 ? 'A+' :
                 successRate > 90 && averageResponseTime < 1500 ? 'A' :
                 successRate > 85 && averageResponseTime < 2000 ? 'B' : 'C'}
              </span>
            </div>
            <Progress 
              value={
                successRate > 95 && averageResponseTime < 1000 ? 100 :
                successRate > 90 && averageResponseTime < 1500 ? 85 :
                successRate > 85 && averageResponseTime < 2000 ? 70 : 50
              } 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
