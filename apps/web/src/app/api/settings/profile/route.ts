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

    const userId = (session as any)?.user?.id || 'user-1'
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Mock user profile data
    const mockProfile = {
      id: userId,
      name: session.user.name || 'Unknown User',
      email: session.user.email || 'unknown@example.com',
      role: isAdmin ? 'ADMIN' : 'AGENT',
      avatar: session.user.image || null,
      preferences: {
        theme: 'system', // light, dark, system
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          slack: false,
          teams: false
        },
        dashboard: {
          defaultView: 'overview', // overview, reports, analytics
          refreshInterval: 300000, // 5 minutes in ms
          showWelcomeMessage: true,
          compactMode: false
        },
        reports: {
          autoSave: true,
          defaultTemplate: 'standard',
          reminderTime: '09:00',
          weekendReminders: false
        }
      },
      settings: {
        twoFactorEnabled: false,
        sessionTimeout: 3600000, // 1 hour in ms
        allowMultipleSessions: true,
        lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        accountCreated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        loginCount: Math.floor(Math.random() * 100) + 50 // 50-150 logins
      },
      stats: {
        totalReports: Math.floor(Math.random() * 50) + 20, // 20-70 reports
        totalMeetings: Math.floor(Math.random() * 30) + 10, // 10-40 meetings
        averageScore: parseFloat((Math.random() * 2 + 8).toFixed(1)), // 8.0-10.0
        completionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        streak: Math.floor(Math.random() * 30) + 1, // 1-30 days
        badges: [
          { id: 'early-adopter', name: 'Early Adopter', earned: true },
          { id: 'consistent-reporter', name: 'Consistent Reporter', earned: true },
          { id: 'team-player', name: 'Team Player', earned: false },
          { id: 'high-performer', name: 'High Performer', earned: Math.random() > 0.5 }
        ]
      }
    }

    return NextResponse.json({
      success: true,
      data: mockProfile
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Profile settings API error:', error)
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

    const body = await request.json()

    // Mock profile update
    const updatedProfile = {
      id: (session as any)?.user?.id || 'user-1',
      name: body.name || session.user.name,
      email: body.email || session.user.email,
      preferences: body.preferences || {},
      settings: body.settings || {},
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
