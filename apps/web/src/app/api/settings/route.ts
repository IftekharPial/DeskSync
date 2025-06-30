import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Mock application settings
    const mockSettings = {
      application: {
        name: 'DailySync',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        features: {
          analytics: true,
          webhooks: true,
          reports: true,
          meetings: true,
          notifications: true,
          integrations: true
        },
        limits: {
          maxWebhooks: isAdmin ? 50 : 10,
          maxReportsPerDay: isAdmin ? 100 : 5,
          maxFileSize: '10MB',
          apiRateLimit: isAdmin ? 1000 : 100 // requests per hour
        }
      },
      integrations: {
        slack: {
          enabled: true,
          configured: false,
          webhookUrl: null,
          channels: []
        },
        teams: {
          enabled: true,
          configured: false,
          webhookUrl: null,
          channels: []
        },
        email: {
          enabled: true,
          configured: true,
          provider: 'sendgrid',
          fromAddress: 'noreply@dailysync.com'
        },
        github: {
          enabled: true,
          configured: false,
          organization: null,
          repositories: []
        }
      },
      notifications: {
        email: {
          enabled: true,
          dailyDigest: true,
          weeklyReport: true,
          instantAlerts: false
        },
        push: {
          enabled: false,
          vapidKey: null,
          endpoint: null
        },
        webhook: {
          enabled: true,
          retryAttempts: 3,
          timeoutMs: 30000
        }
      },
      security: {
        sessionTimeout: 3600000, // 1 hour
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        twoFactorAuth: {
          enabled: false,
          required: false,
          methods: ['totp', 'sms']
        }
      },
      appearance: {
        themes: ['light', 'dark', 'system'],
        defaultTheme: 'system',
        customBranding: {
          logo: null,
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b'
        }
      },
      system: {
        maintenance: {
          enabled: false,
          message: null,
          scheduledAt: null
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30 // days
        },
        monitoring: {
          enabled: true,
          errorTracking: true,
          performanceMonitoring: true
        }
      }
    }

    // Filter settings based on user role
    let filteredSettings = mockSettings
    if (!isAdmin) {
      // Create filtered settings for regular users without admin-only properties
      const { system, ...settingsWithoutSystem } = mockSettings

      // Create filtered security object without passwordPolicy for non-admin users
      const filteredSecurity = {
        sessionTimeout: mockSettings.security.sessionTimeout,
        maxLoginAttempts: mockSettings.security.maxLoginAttempts,
        twoFactorAuth: {
          enabled: mockSettings.security.twoFactorAuth.enabled,
          required: false, // Non-admin users cannot be required to use 2FA
          methods: mockSettings.security.twoFactorAuth.methods
        }
        // passwordPolicy is excluded for non-admin users
      }

      filteredSettings = {
        ...settingsWithoutSystem,
        security: filteredSecurity, // Filtered security object without passwordPolicy
        application: {
          ...mockSettings.application,
          limits: {
            maxWebhooks: 10,
            maxReportsPerDay: 5,
            maxFileSize: '5MB',
            apiRateLimit: 100
          }
        }
      } as any // Type assertion for entire object to bypass strict checking
    }

    return NextResponse.json({
      success: true,
      data: filteredSettings
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Only admins can update system settings
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Mock settings update
    const updatedSettings = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
