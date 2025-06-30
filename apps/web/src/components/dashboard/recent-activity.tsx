import { formatDateTime } from '@/lib/utils'
import { FileText, MessageSquare, Calendar } from 'lucide-react'

interface Activity {
  type: 'daily_report' | 'meeting_report'
  id: string
  title: string
  user: string
  createdAt: string
  data: any
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : []

  if (safeActivities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <div className="text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'daily_report':
        return FileText
      case 'meeting_report':
        return MessageSquare
      default:
        return FileText
    }
  }

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'daily_report':
        return `${activity.data.tickets || 0} tickets, ${activity.data.chats || 0} chats`
      case 'meeting_report':
        return `${activity.data.outcome} - ${activity.data.attendees || 0} attendees`
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      {safeActivities.map((activity) => {
        const Icon = getIcon(activity.type)
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                by {activity.user}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getActivityDescription(activity)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
