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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Generate mock meeting reports summary data
    const mockSummary = {
      totalMeetings: Math.floor(Math.random() * 50) + 20, // 20-70 meetings
      averageDuration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      successfulMeetings: Math.floor(Math.random() * 40) + 15, // 15-55 successful
      cancelledMeetings: Math.floor(Math.random() * 10) + 2, // 2-12 cancelled
      totalAttendees: Math.floor(Math.random() * 200) + 50, // 50-250 attendees
      averageAttendeesPerMeeting: parseFloat((Math.random() * 5 + 3).toFixed(1)), // 3.0-8.0
      successRate: 0, // Will be calculated later
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      outcomes: {
        successful: Math.floor(Math.random() * 40) + 15, // 15-55
        postponed: Math.floor(Math.random() * 8) + 2, // 2-10
        cancelled: Math.floor(Math.random() * 5) + 1, // 1-6
        noShow: Math.floor(Math.random() * 3) + 1 // 1-4
      },
      trends: {
        meetings: Math.floor(Math.random() * 10) - 5, // -5 to +5
        duration: Math.floor(Math.random() * 20) - 10, // -10 to +10 minutes
        successRate: Math.floor(Math.random() * 10) - 5, // -5 to +5%
        attendees: Math.floor(Math.random() * 20) - 10 // -10 to +10
      },
      dailyBreakdown: Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const meetingsCount = Math.floor(Math.random() * 5) + 1 // 1-5 meetings per day
        return {
          date: date.toISOString().split('T')[0],
          meetings: meetingsCount,
          averageDuration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
          successful: Math.floor(meetingsCount * 0.8), // 80% success rate
          cancelled: Math.floor(meetingsCount * 0.1), // 10% cancelled
          postponed: Math.floor(meetingsCount * 0.1), // 10% postponed
          totalAttendees: meetingsCount * (Math.floor(Math.random() * 5) + 3), // 3-8 per meeting
          successRate: Math.floor(Math.random() * 20) + 75 // 75-95%
        }
      }).reverse() // Most recent first
    }

    // Calculate derived metrics
    const totalScheduled = mockSummary.totalMeetings
    mockSummary.successfulMeetings = Math.min(mockSummary.successfulMeetings, totalScheduled)
    mockSummary.cancelledMeetings = Math.min(mockSummary.cancelledMeetings, totalScheduled - mockSummary.successfulMeetings)
    
    const successRate = totalScheduled > 0 ? Math.round((mockSummary.successfulMeetings / totalScheduled) * 100) : 0
    
    // Add success rate to summary
    mockSummary.successRate = successRate

    // Filter data based on user role
    if (!isAdmin) {
      // For non-admin users, show only their own data
      mockSummary.totalMeetings = Math.floor(mockSummary.totalMeetings / 3) || 1 // Assume 3 team members
      mockSummary.successfulMeetings = Math.floor(mockSummary.successfulMeetings / 3) || 1
      mockSummary.cancelledMeetings = Math.floor(mockSummary.cancelledMeetings / 3) || 0
      mockSummary.totalAttendees = Math.floor(mockSummary.totalAttendees / 3) || 1
      
      mockSummary.dailyBreakdown = mockSummary.dailyBreakdown.map(day => ({
        ...day,
        meetings: Math.floor(day.meetings / 3) || 1,
        successful: Math.floor(day.successful / 3) || 1,
        cancelled: Math.floor(day.cancelled / 3) || 0,
        postponed: Math.floor(day.postponed / 3) || 0,
        totalAttendees: Math.floor(day.totalAttendees / 3) || 1
      }))
    }

    return NextResponse.json({
      success: true,
      data: mockSummary
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Meeting reports summary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
