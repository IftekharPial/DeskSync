'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  FileText, 
  Calendar, 
  Webhook, 
  Users, 
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
  Lightbulb,
  Zap
} from 'lucide-react'

interface QuickStartItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  steps: string[]
  action: {
    label: string
    href: string
  }
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  timeEstimate: string
}

interface QuickStartGuideProps {
  userRole: 'ADMIN' | 'USER'
  onActionClick?: (href: string) => void
}

export function QuickStartGuide({ userRole, onActionClick }: QuickStartGuideProps) {
  const router = useRouter()
  const [openItems, setOpenItems] = useState<string[]>([])

  const adminItems: QuickStartItem[] = [
    {
      id: 'invite-users',
      title: 'Invite Your First Team Member',
      description: 'Get your team started by inviting users to submit daily reports.',
      icon: Users,
      difficulty: 'Easy',
      timeEstimate: '2 minutes',
      steps: [
        'Go to Admin → Users',
        'Click "Invite User"',
        'Enter their email address',
        'Select their role (User or Admin)',
        'Send the invitation'
      ],
      action: {
        label: 'Invite Users',
        href: '/dashboard/admin/users'
      }
    },
    {
      id: 'setup-webhook',
      title: 'Create Your First Webhook',
      description: 'Integrate with external tools like Slack or Microsoft Teams.',
      icon: Webhook,
      difficulty: 'Medium',
      timeEstimate: '5 minutes',
      steps: [
        'Go to Webhooks section',
        'Click "Create Webhook"',
        'Enter webhook name and description',
        'Configure the endpoint URL',
        'Set up message templates',
        'Test the webhook'
      ],
      action: {
        label: 'Setup Webhooks',
        href: '/dashboard/webhooks'
      }
    },
    {
      id: 'view-analytics',
      title: 'Explore Team Analytics',
      description: 'Once your team starts reporting, monitor performance and trends.',
      icon: BookOpen,
      difficulty: 'Easy',
      timeEstimate: '3 minutes',
      steps: [
        'Go to Analytics section',
        'Review team performance metrics',
        'Check individual user statistics',
        'Analyze trends over time',
        'Export reports if needed'
      ],
      action: {
        label: 'View Analytics',
        href: '/dashboard/analytics'
      }
    }
  ]

  const userItems: QuickStartItem[] = [
    {
      id: 'daily-report',
      title: 'Submit Your First Daily Report',
      description: 'Track your daily activities and accomplishments.',
      icon: FileText,
      difficulty: 'Easy',
      timeEstimate: '3 minutes',
      steps: [
        'Go to Reports → Daily Reports',
        'Click "New Report"',
        'Fill in your daily activities',
        'Add tickets resolved, chats handled, etc.',
        'Include any relevant links or notes',
        'Submit the report'
      ],
      action: {
        label: 'Create Report',
        href: '/dashboard/reports/daily/new'
      }
    },
    {
      id: 'meeting-report',
      title: 'Log a Meeting Report',
      description: 'Record meeting outcomes and action items.',
      icon: Calendar,
      difficulty: 'Easy',
      timeEstimate: '4 minutes',
      steps: [
        'Go to Reports → Meeting Reports',
        'Click "New Meeting Report"',
        'Enter meeting title and time',
        'Add attendees',
        'Describe the meeting outcome',
        'List action items',
        'Save the report'
      ],
      action: {
        label: 'Add Meeting',
        href: '/dashboard/reports/meetings/new'
      }
    },
    {
      id: 'view-dashboard',
      title: 'Explore Your Dashboard',
      description: 'View your performance metrics and recent activity.',
      icon: BookOpen,
      difficulty: 'Easy',
      timeEstimate: '2 minutes',
      steps: [
        'Go to your Dashboard',
        'Review your performance stats',
        'Check recent activity',
        'View performance trends',
        'Set personal goals'
      ],
      action: {
        label: 'View Dashboard',
        href: '/dashboard'
      }
    }
  ]

  const items = userRole === 'ADMIN' ? adminItems : userItems

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleActionClick = (href: string) => {
    onActionClick?.(href)
    router.push(href)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Quick Start Guide</h2>
        <p className="text-muted-foreground">
          {userRole === 'ADMIN' 
            ? 'Get your team up and running with these essential tasks'
            : 'Start tracking your performance with these simple steps'
          }
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          const isOpen = openItems.includes(item.id)

          return (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleItem(item.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge 
                              variant="secondary" 
                              className={getDifficultyColor(item.difficulty)}
                            >
                              {item.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {item.timeEstimate}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActionClick(item.action.href)
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {item.action.label}
                        </Button>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                        Step-by-step instructions:
                      </h4>
                      <ol className="space-y-2">
                        {item.steps.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mr-3 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
