'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Users, 
  FileText,
  Calendar,
  Webhook
} from 'lucide-react'

interface WelcomeBannerProps {
  userRole: 'ADMIN' | 'USER'
  userName?: string
  onDismiss?: () => void
  onStartTour?: () => void
  className?: string
}

export function WelcomeBanner({ 
  userRole, 
  userName, 
  onDismiss, 
  onStartTour,
  className 
}: WelcomeBannerProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleStartTour = () => {
    onStartTour?.()
  }

  const adminQuickActions = [
    {
      icon: Users,
      label: 'Invite Users',
      href: '/dashboard/admin/users',
      description: 'Add team members'
    },
    {
      icon: Webhook,
      label: 'Setup Webhooks',
      href: '/dashboard/webhooks',
      description: 'Integrate tools'
    }
  ]

  const userQuickActions = [
    {
      icon: FileText,
      label: 'Create Report',
      href: '/dashboard/reports/daily/new',
      description: 'Submit daily report'
    },
    {
      icon: Calendar,
      label: 'Log Meeting',
      href: '/dashboard/reports/meetings/new',
      description: 'Record meeting'
    }
  ]

  const quickActions = userRole === 'ADMIN' ? adminQuickActions : userQuickActions

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-semibold">
                  Welcome to DailySync{userName ? `, ${userName}` : ''}!
                </h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {userRole === 'ADMIN' ? 'Admin' : 'User'}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4">
                {userRole === 'ADMIN' 
                  ? 'Get your team started with daily reporting and performance tracking. Set up users, configure integrations, and monitor team progress.'
                  : 'Start tracking your daily activities and performance. Submit reports, log meetings, and monitor your progress over time.'
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleStartTour} className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Take the Tour
                  </Button>
                  
                  <div className="flex gap-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <Button
                          key={action.href}
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(action.href)}
                          className="flex items-center"
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {action.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Quick tips */}
              <div className="mt-4 p-3 bg-background/50 rounded-lg border border-primary/10">
                <h4 className="font-medium text-sm mb-2">💡 Quick Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {userRole === 'ADMIN' ? (
                    <>
                      <li>• Start by inviting your team members</li>
                      <li>• Configure webhooks to integrate with Slack or Teams</li>
                      <li>• Monitor team performance in the Analytics section</li>
                    </>
                  ) : (
                    <>
                      <li>• Submit daily reports to track your activities</li>
                      <li>• Log meeting outcomes and action items</li>
                      <li>• View your performance trends on the dashboard</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function WelcomeBannerCompact({ 
  userRole, 
  userName, 
  onDismiss, 
  onStartTour,
  className 
}: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium">
                Welcome to DailySync{userName ? `, ${userName}` : ''}!
              </p>
              <p className="text-sm text-muted-foreground">
                {userRole === 'ADMIN' 
                  ? 'Set up your team and start tracking performance'
                  : 'Start tracking your daily activities and progress'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={onStartTour}>
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
