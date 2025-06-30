import { Progress } from '@/components/ui/progress'
import { getStatusColor } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface WebhookHealthProps {
  webhooks: any[]
  systemStats: {
    successRate?: number
    averageResponseTime?: number
    totalDeliveries?: number
  }
}

export function WebhookHealth({ webhooks, systemStats }: WebhookHealthProps) {
  if (!webhooks || webhooks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-sm">No webhooks configured</div>
        <div className="text-xs mt-1">Create webhooks to monitor their health</div>
      </div>
    )
  }

  const getHealthStatus = (webhook: any) => {
    const successRate = webhook.successRate || 0
    const responseTime = webhook.averageResponseTime || 0
    
    if (successRate >= 99 && responseTime < 500) return 'excellent'
    if (successRate >= 95 && responseTime < 1000) return 'good'
    if (successRate >= 90 && responseTime < 2000) return 'warning'
    return 'critical'
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Overall Webhook Health */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Webhook Health</span>
          <span className={`text-sm font-medium ${
            (systemStats.successRate || 0) > 95 ? 'text-green-600' : 
            (systemStats.successRate || 0) > 90 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(systemStats.successRate || 0).toFixed(1)}% Success Rate
          </span>
        </div>
        <Progress value={systemStats.successRate || 0} className="h-2" />
      </div>

      {/* Individual Webhook Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Individual Webhook Status</h4>
        {webhooks.slice(0, 8).map((webhook) => {
          const health = getHealthStatus(webhook)
          
          return (
            <div key={webhook.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getHealthIcon(health)}
                <div>
                  <div className="font-medium text-sm">{webhook.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {webhook.endpointCount || 0} endpoints
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium">
                  {(webhook.successRate || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(webhook.averageResponseTime || 0)}ms
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {webhooks.filter(w => getHealthStatus(w) === 'excellent' || getHealthStatus(w) === 'good').length}
          </div>
          <div className="text-xs text-muted-foreground">Healthy Webhooks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {webhooks.filter(w => getHealthStatus(w) === 'critical' || getHealthStatus(w) === 'warning').length}
          </div>
          <div className="text-xs text-muted-foreground">Need Attention</div>
        </div>
      </div>
    </div>
  )
}
