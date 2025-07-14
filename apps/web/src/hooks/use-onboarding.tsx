'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useOnboardingCacheManagement } from './use-cache-management'

interface OnboardingState {
  isFirstTime: boolean
  hasSeenWelcome: boolean
  hasCompletedTour: boolean
  hasCreatedFirstReport: boolean
  hasInvitedUsers: boolean
  hasSetupWebhooks: boolean
  showWelcomeBanner: boolean
  showOnboardingWizard: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  actions: {
    markWelcomeSeen: () => void
    markTourCompleted: () => void
    markFirstReportCreated: () => void
    markUsersInvited: () => void
    markWebhooksSetup: () => void
    dismissWelcomeBanner: () => void
    startOnboardingWizard: () => void
    completeOnboardingWizard: () => void
    resetOnboarding: () => void
  }
  shouldShowOnboarding: boolean
  isOnboardingComplete: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const ONBOARDING_STORAGE_KEY = 'dailysync-onboarding'

function getStorageKey(userId: string) {
  return `${ONBOARDING_STORAGE_KEY}-${userId}`
}

function getInitialState(): OnboardingState {
  return {
    isFirstTime: true,
    hasSeenWelcome: false,
    hasCompletedTour: false,
    hasCreatedFirstReport: false,
    hasInvitedUsers: false,
    hasSetupWebhooks: false,
    showWelcomeBanner: true,
    showOnboardingWizard: false,
  }
}

function loadOnboardingState(userId: string): OnboardingState {
  if (typeof window === 'undefined') return getInitialState()
  
  try {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (stored) {
      return { ...getInitialState(), ...JSON.parse(stored) }
    }
  } catch (error) {
    console.warn('Failed to load onboarding state:', error)
  }
  
  return getInitialState()
}

function saveOnboardingState(userId: string, state: OnboardingState) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save onboarding state:', error)
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [state, setState] = useState<OnboardingState>(getInitialState())
  const cacheManager = useOnboardingCacheManagement()

  // Track if we've already processed the first-time user to prevent infinite loops
  const hasProcessedFirstTimeUser = useRef(false)
  const lastProcessedUserId = useRef<string | null>(null)

  // Load state when user session is available
  useEffect(() => {
    if (session?.user?.id) {
      // Reset processing flag if user changed
      if (lastProcessedUserId.current !== session.user.id) {
        hasProcessedFirstTimeUser.current = false
        lastProcessedUserId.current = session.user.id
      }

      const loadedState = loadOnboardingState(session.user.id)
      setState(loadedState)

      // Clear cache for new users to ensure fresh data (only once per user)
      if (loadedState.isFirstTime && !hasProcessedFirstTimeUser.current) {
        console.log('🆕 First-time user detected - clearing cache for fresh experience')
        hasProcessedFirstTimeUser.current = true

        // Use setTimeout to avoid blocking the render cycle
        setTimeout(() => {
          cacheManager.clearCacheForNewUser()
        }, 0)
      }
    }
  }, [session?.user?.id]) // Remove cacheManager from dependencies to prevent infinite loop

  // Save state whenever it changes
  useEffect(() => {
    if (session?.user?.id) {
      saveOnboardingState(session.user.id, state)
    }
  }, [state, session?.user?.id])

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const actions = {
    markWelcomeSeen: () => updateState({ hasSeenWelcome: true }),
    
    markTourCompleted: () => updateState({ 
      hasCompletedTour: true, 
      showOnboardingWizard: false 
    }),
    
    markFirstReportCreated: () => updateState({ hasCreatedFirstReport: true }),
    
    markUsersInvited: () => updateState({ hasInvitedUsers: true }),
    
    markWebhooksSetup: () => updateState({ hasSetupWebhooks: true }),
    
    dismissWelcomeBanner: () => updateState({ 
      showWelcomeBanner: false,
      hasSeenWelcome: true 
    }),
    
    startOnboardingWizard: () => updateState({ 
      showOnboardingWizard: true,
      hasSeenWelcome: true 
    }),
    
    completeOnboardingWizard: () => updateState({ 
      showOnboardingWizard: false,
      hasCompletedTour: true,
      isFirstTime: false 
    }),
    
    resetOnboarding: () => {
      const initialState = getInitialState()
      setState(initialState)
      if (session?.user?.id) {
        localStorage.removeItem(getStorageKey(session.user.id))
      }
    }
  }

  // Determine if user should see onboarding
  const shouldShowOnboarding = state.isFirstTime && !state.hasCompletedTour
  
  // Determine if onboarding is complete
  const isOnboardingComplete = state.hasCompletedTour || (
    session?.user?.role === 'ADMIN' 
      ? state.hasInvitedUsers && state.hasCreatedFirstReport
      : state.hasCreatedFirstReport
  )

  const contextValue: OnboardingContextType = {
    state,
    actions,
    shouldShowOnboarding,
    isOnboardingComplete
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

// Hook to check if user should see specific onboarding elements
export function useOnboardingChecks() {
  const { state, shouldShowOnboarding } = useOnboarding()
  const { data: session } = useSession()
  
  const isAdmin = session?.user?.role === 'ADMIN'
  
  return {
    shouldShowWelcomeBanner: shouldShowOnboarding && state.showWelcomeBanner,
    shouldShowOnboardingWizard: shouldShowOnboarding && state.showOnboardingWizard,
    shouldShowQuickStart: shouldShowOnboarding && state.hasSeenWelcome && !state.hasCompletedTour,
    shouldPromptFirstReport: !state.hasCreatedFirstReport && state.hasSeenWelcome,
    shouldPromptUserInvitation: isAdmin && !state.hasInvitedUsers && state.hasSeenWelcome,
    shouldPromptWebhookSetup: isAdmin && !state.hasSetupWebhooks && state.hasInvitedUsers,
  }
}

// Hook for tracking onboarding progress
export function useOnboardingProgress() {
  const { state } = useOnboarding()
  const { data: session } = useSession()
  
  const isAdmin = session?.user?.role === 'ADMIN'
  
  const adminSteps = [
    { key: 'welcome', completed: state.hasSeenWelcome, label: 'Welcome seen' },
    { key: 'users', completed: state.hasInvitedUsers, label: 'Users invited' },
    { key: 'webhooks', completed: state.hasSetupWebhooks, label: 'Webhooks setup' },
    { key: 'tour', completed: state.hasCompletedTour, label: 'Tour completed' },
  ]
  
  const userSteps = [
    { key: 'welcome', completed: state.hasSeenWelcome, label: 'Welcome seen' },
    { key: 'report', completed: state.hasCreatedFirstReport, label: 'First report created' },
    { key: 'tour', completed: state.hasCompletedTour, label: 'Tour completed' },
  ]
  
  const steps = isAdmin ? adminSteps : userSteps
  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length
  const progress = (completedSteps / totalSteps) * 100
  
  return {
    steps,
    completedSteps,
    totalSteps,
    progress,
    isComplete: completedSteps === totalSteps
  }
}
