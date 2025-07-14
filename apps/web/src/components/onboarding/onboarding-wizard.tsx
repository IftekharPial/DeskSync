'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Calendar, 
  Webhook, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: {
    label: string
    href: string
    variant?: 'default' | 'outline' | 'secondary'
  }
  completed?: boolean
  optional?: boolean
}

interface OnboardingWizardProps {
  userRole: 'ADMIN' | 'USER'
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingWizard({ userRole, onComplete, onSkip }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const adminSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DailySync!',
      description: 'Get your team started with daily reporting and performance tracking.',
      icon: Sparkles,
      action: {
        label: 'Get Started',
        href: '#',
        variant: 'default'
      }
    },
    {
      id: 'invite-users',
      title: 'Invite Your Team',
      description: 'Add team members so they can start submitting daily reports and tracking their progress.',
      icon: Users,
      action: {
        label: 'Invite Users',
        href: '/dashboard/admin/users',
        variant: 'default'
      }
    },
    {
      id: 'setup-webhooks',
      title: 'Configure Webhooks',
      description: 'Set up webhooks to integrate with your existing tools and automate workflows.',
      icon: Webhook,
      action: {
        label: 'Setup Webhooks',
        href: '/dashboard/webhooks',
        variant: 'outline'
      },
      optional: true
    },
    {
      id: 'view-analytics',
      title: 'Monitor Team Performance',
      description: 'Once your team starts reporting, view analytics and insights on the dashboard.',
      icon: BarChart3,
      action: {
        label: 'View Dashboard',
        href: '/dashboard',
        variant: 'outline'
      }
    }
  ]

  const userSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DailySync!',
      description: 'Start tracking your daily activities and performance with easy reporting tools.',
      icon: Sparkles,
      action: {
        label: 'Get Started',
        href: '#',
        variant: 'default'
      }
    },
    {
      id: 'first-report',
      title: 'Submit Your First Daily Report',
      description: 'Track tickets resolved, chats handled, and other daily activities.',
      icon: FileText,
      action: {
        label: 'Create Report',
        href: '/dashboard/reports/daily/new',
        variant: 'default'
      }
    },
    {
      id: 'meeting-report',
      title: 'Log Meeting Outcomes',
      description: 'Record meeting details, outcomes, and action items for better tracking.',
      icon: Calendar,
      action: {
        label: 'Add Meeting',
        href: '/dashboard/reports/meetings/new',
        variant: 'outline'
      },
      optional: true
    },
    {
      id: 'view-progress',
      title: 'Track Your Progress',
      description: 'View your performance metrics and trends on your personal dashboard.',
      icon: Target,
      action: {
        label: 'View Dashboard',
        href: '/dashboard',
        variant: 'outline'
      }
    }
  ]

  const steps = userRole === 'ADMIN' ? adminSteps : userSteps
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAction = (step: OnboardingStep) => {
    if (step.action.href !== '#') {
      router.push(step.action.href)
    } else {
      handleNext()
    }
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Getting Started</h2>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {currentStepData.title}
            {currentStepData.optional && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Optional
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-base">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => handleAction(currentStepData)}
            variant={currentStepData.action.variant || 'default'}
            size="lg"
            className="mb-4"
          >
            {currentStepData.action.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex space-x-2">
          {currentStep < steps.length - 1 ? (
            <>
              <Button variant="ghost" onClick={onSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={onComplete}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
