import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertsPanelProps {
  systemHealth: string
  systemStats: {
    successRate?: number
    averageResponseTime?: number
    totalDeliveries?: number
    failedDeliveries?: number
  }
}

export function AlertsPanel({ systemHealth, systemStats }: AlertsPanelProps) {
  // Generate alerts based on system metrics
  const generateAlerts = () => {
    const alerts = []

    // Success rate alerts
    if ((systemStats.successRate || 0) < 90) {
      alerts.push({
        type: 'error',
        title: 'Low Success Rate',
        message: `Webhook success rate is ${(systemStats.successRate || 0).toFixed(1)}%. This is below the recommended 95% threshold.`,
        timestamp: new Date(),
      })
    } else if ((systemStats.successRate || 0) < 95) {
      alerts.push({
        type: 'warning',
        title: 'Success Rate Warning',
        message: `Webhook success rate is ${(systemStats.successRate || 0).toFixed(1)}%. Consider investigating failed deliveries.`,
        timestamp: new Date(),
      })
    }

    // Response time alerts
    if ((systemStats.averageResponseTime || 0) > 2000) {
      alerts.push({
        type: 'error',
        title: 'High Response Time',
        message: `Average response time is ${Math.round(systemStats.averageResponseTime || 0)}ms. This may impact user experience.`,
        timestamp: new Date(),
      })
    } else if ((systemStats.averageResponseTime || 0) > 1000) {
      alerts.push({
        type: 'warning',
        title: 'Elevated Response Time',
        message: `Average response time is ${Math.round(systemStats.averageResponseTime || 0)}ms. Monitor for performance degradation.`,
        timestamp: new Date(),
      })
    }

    // Failed deliveries alerts
    if ((systemStats.failedDeliveries || 0) > 100) {
      alerts.push({
        type: 'error',
        title: 'High Failure Count',
        message: `${systemStats.failedDeliveries} failed deliveries in the last 24 hours. Check webhook configurations.`,
        timestamp: new Date(),
      })
    } else if ((systemStats.failedDeliveries || 0) > 50) {
      alerts.push({
        type: 'warning',
        title: 'Increased Failures',
        message: `${systemStats.failedDeliveries} failed deliveries detected. Monitor webhook endpoints.`,
        timestamp: new Date(),
      })
    }

    // System health alerts
    if (systemHealth === 'critical') {
      alerts.push({
        type: 'error',
        title: 'System Health Critical',
        message: 'Multiple system metrics are below acceptable thresholds. Immediate attention required.',
        timestamp: new Date(),
      })
    } else if (systemHealth === 'warning') {
      alerts.push({
        type: 'warning',
        title: 'System Health Warning',
        message: 'Some system metrics need attention. Monitor closely.',
        timestamp: new Date(),
      })
    }

    // If no alerts, add a success message
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        title: 'All Systems Operational',
        message: 'All system metrics are within normal parameters. No issues detected.',
        timestamp: new Date(),
      })
    }

    return alerts
  }

  const alerts = generateAlerts()

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <div className="text-sm">No active alerts</div>
          <div className="text-xs mt-1">All systems are operating normally</div>
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-3 border rounded-lg ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{alert.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {alert.message}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Alert Summary */}
      <div className="pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {alerts.filter(a => a.type === 'error').length}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {alerts.filter(a => a.type === 'warning').length}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {alerts.filter(a => a.type === 'success').length}
            </div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </div>
        </div>
      </div>
    </div>
  )
}
