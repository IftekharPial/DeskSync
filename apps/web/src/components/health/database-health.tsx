import { Progress } from '@/components/ui/progress'
import { CheckCircle, Database, HardDrive, Zap, Clock } from 'lucide-react'

export function DatabaseHealth() {
  // Mock database health data - in a real app, this would come from actual monitoring
  const dbHealth = {
    status: 'connected',
    connectionPool: {
      active: 8,
      idle: 12,
      total: 20,
    },
    performance: {
      avgQueryTime: 45, // ms
      slowQueries: 2,
      totalQueries: 1247,
    },
    storage: {
      used: 2.4, // GB
      total: 10, // GB
      percentage: 24,
    },
    uptime: 99.9,
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-medium">Database Connected</span>
        </div>
        <span className="text-sm text-green-600 font-medium">Operational</span>
      </div>

      {/* Connection Pool */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center">
          <Database className="mr-2 h-4 w-4" />
          Connection Pool
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-blue-600">{dbHealth.connectionPool.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-gray-600">{dbHealth.connectionPool.idle}</div>
            <div className="text-xs text-muted-foreground">Idle</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">{dbHealth.connectionPool.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Pool Utilization</span>
            <span className="text-sm font-medium">
              {Math.round((dbHealth.connectionPool.active / dbHealth.connectionPool.total) * 100)}%
            </span>
          </div>
          <Progress 
            value={(dbHealth.connectionPool.active / dbHealth.connectionPool.total) * 100} 
            className="h-2" 
          />
        </div>
      </div>

      {/* Query Performance */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center">
          <Zap className="mr-2 h-4 w-4" />
          Query Performance
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Average Query Time</span>
            <span className={`text-sm font-medium ${
              dbHealth.performance.avgQueryTime < 50 ? 'text-green-600' : 
              dbHealth.performance.avgQueryTime < 100 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {dbHealth.performance.avgQueryTime}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Queries (24h)</span>
            <span className="text-sm font-medium">{dbHealth.performance.totalQueries.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Slow Queries</span>
            <span className={`text-sm font-medium ${
              dbHealth.performance.slowQueries === 0 ? 'text-green-600' : 
              dbHealth.performance.slowQueries < 5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {dbHealth.performance.slowQueries}
            </span>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center">
          <HardDrive className="mr-2 h-4 w-4" />
          Storage
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Used Space</span>
            <span className="text-sm font-medium">
              {dbHealth.storage.used}GB / {dbHealth.storage.total}GB
            </span>
          </div>
          <Progress value={dbHealth.storage.percentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {dbHealth.storage.percentage}% utilized
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          Uptime & Reliability
        </h4>
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">Database Uptime</span>
            <span className="text-lg font-bold text-green-600">{dbHealth.uptime}%</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last restart: 7 days ago
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Database Health</span>
          <span className="text-lg font-bold text-green-600">A+</span>
        </div>
        <Progress value={95} className="h-2" />
        <div className="text-xs text-muted-foreground text-center mt-1">
          Excellent performance across all metrics
        </div>
      </div>
    </div>
  )
}
