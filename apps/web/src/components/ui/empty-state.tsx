import React from 'react'
import { LucideIcon, Plus, FileText, Users, Calendar, Webhook, BarChart3, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
  type?: 'dashboard' | 'table' | 'chart' | 'card'
}

const iconMap = {
  reports: FileText,
  meetings: Calendar,
  users: Users,
  webhooks: Webhook,
  analytics: BarChart3,
  database: Database,
  default: Plus,
}

export function EmptyState({
  icon: IconProp,
  title,
  description,
  action,
  className,
  size = 'md',
  type = 'card'
}: EmptyStateProps) {
  const Icon = IconProp || iconMap.default

  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'h-8 w-8 mb-2',
      title: 'text-sm font-medium',
      description: 'text-xs',
      button: 'h-8 text-xs'
    },
    md: {
      container: 'py-8',
      icon: 'h-12 w-12 mb-4',
      title: 'text-lg font-medium',
      description: 'text-sm',
      button: 'h-9 text-sm'
    },
    lg: {
      container: 'py-12',
      icon: 'h-16 w-16 mb-6',
      title: 'text-xl font-semibold',
      description: 'text-base',
      button: 'h-10'
    }
  }

  const typeClasses = {
    dashboard: 'bg-muted/20 border-dashed border-2',
    table: 'bg-transparent',
    chart: 'bg-muted/10 rounded-lg',
    card: 'bg-card'
  }

  const classes = sizeClasses[size]

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      classes.container,
      typeClasses[type],
      className
    )}>
      <Icon className={cn('text-muted-foreground/60', classes.icon)} />
      <h3 className={cn('text-foreground mb-2', classes.title)}>
        {title}
      </h3>
      <p className={cn('text-muted-foreground max-w-sm mx-auto', classes.description)}>
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className={cn('mt-4', classes.button)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )

  if (type === 'card') {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}

// Preset empty states for common scenarios
export function EmptyReports({ onCreateReport }: { onCreateReport?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No reports found"
      description="Start creating daily reports to track your progress and performance metrics."
      action={onCreateReport ? {
        label: "Create Report",
        onClick: onCreateReport
      } : undefined}
      type="table"
    />
  )
}

export function EmptyMeetings({ onCreateMeeting }: { onCreateMeeting?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No meeting reports found"
      description="Start creating meeting reports to track your meetings, outcomes, and action items."
      action={onCreateMeeting ? {
        label: "Create Meeting Report",
        onClick: onCreateMeeting
      } : undefined}
      type="table"
    />
  )
}

export function EmptyWebhooks({ onCreateWebhook }: { onCreateWebhook?: () => void }) {
  return (
    <EmptyState
      icon={Webhook}
      title="No webhooks configured"
      description="Create your first webhook to start receiving HTTP requests and integrate with external systems."
      action={onCreateWebhook ? {
        label: "Create Webhook",
        onClick: onCreateWebhook
      } : undefined}
      type="table"
    />
  )
}

export function EmptyUsers({ onInviteUser }: { onInviteUser?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="Invite team members to start collaborating and tracking performance together."
      action={onInviteUser ? {
        label: "Invite User",
        onClick: onInviteUser
      } : undefined}
      type="table"
    />
  )
}

export function EmptyAnalytics({ type = 'general' }: { type?: 'general' | 'performance' | 'webhooks' }) {
  const messages = {
    general: {
      title: "No analytics data available",
      description: "Analytics will appear here once you start creating reports and using the system."
    },
    performance: {
      title: "No performance data available", 
      description: "Performance metrics will appear here once daily reports are submitted."
    },
    webhooks: {
      title: "No webhook analytics available",
      description: "Webhook performance data will appear here once webhooks start processing requests."
    }
  }

  return (
    <EmptyState
      icon={BarChart3}
      title={messages[type].title}
      description={messages[type].description}
      type="chart"
      size="md"
    />
  )
}

export function EmptyDashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <EmptyState
      icon={Database}
      title={isAdmin ? "Welcome to DailySync Admin" : "Welcome to DailySync"}
      description={
        isAdmin 
          ? "Your team dashboard will show metrics and insights once team members start submitting reports."
          : "Your personal dashboard will show your performance metrics once you start submitting daily reports and meeting updates."
      }
      type="dashboard"
      size="lg"
    />
  )
}
