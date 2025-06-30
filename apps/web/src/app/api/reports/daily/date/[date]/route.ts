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

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
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
    const userId = (session as any)?.user?.id || 'user-1'

    // Validate date parameter
    const dateParam = params.date
    const reportDate = new Date(dateParam)
    
    if (isNaN(reportDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if date is today or in the past
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    if (reportDate > today) {
      return NextResponse.json(
        { success: false, error: 'Cannot retrieve reports for future dates' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Generate mock daily report data for the specific date
    const mockReport = {
      id: `report_${dateParam}_${userId}`,
      userId,
      date: dateParam,
      user: {
        id: userId,
        name: session.user.name || 'Unknown User',
        email: session.user.email || 'unknown@example.com',
        role: isAdmin ? 'ADMIN' : 'AGENT'
      },
      ticketsResolved: Math.floor(Math.random() * 15) + 5, // 5-20 tickets
      chatsHandled: Math.floor(Math.random() * 10) + 3, // 3-13 chats
      githubIssues: Math.floor(Math.random() * 5) + 1, // 1-6 issues
      emailsProcessed: Math.floor(Math.random() * 20) + 5, // 5-25 emails
      callsAttended: Math.floor(Math.random() * 8) + 2, // 2-10 calls
      notes: `Daily report for ${dateParam}. Completed various tasks including ticket resolution, customer support, and development work.`,
      links: [
        `https://github.com/company/project/issues/123`,
        `https://support.company.com/ticket/456`,
        `https://docs.company.com/daily-reports/${dateParam}`
      ],
      createdAt: new Date(reportDate.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(reportDate.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SUBMITTED',
      score: parseFloat((Math.random() * 2 + 8).toFixed(1)), // 8.0-10.0
      completionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      categories: {
        technical: {
          tickets: Math.floor(Math.random() * 8) + 2,
          githubIssues: Math.floor(Math.random() * 3) + 1,
          codeReviews: Math.floor(Math.random() * 5) + 1
        },
        support: {
          chats: Math.floor(Math.random() * 6) + 2,
          emails: Math.floor(Math.random() * 12) + 3,
          calls: Math.floor(Math.random() * 4) + 1
        },
        administrative: {
          meetings: Math.floor(Math.random() * 3) + 1,
          documentation: Math.floor(Math.random() * 2) + 1,
          training: Math.floor(Math.random() * 2)
        }
      },
      timeTracking: {
        totalHours: parseFloat((Math.random() * 2 + 7).toFixed(1)), // 7.0-9.0 hours
        breakdown: {
          tickets: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0-5.0 hours
          support: parseFloat((Math.random() * 1.5 + 2).toFixed(1)), // 2.0-3.5 hours
          meetings: parseFloat((Math.random() * 1 + 0.5).toFixed(1)), // 0.5-1.5 hours
          other: parseFloat((Math.random() * 1 + 0.5).toFixed(1)) // 0.5-1.5 hours
        }
      }
    }

    // Check if report exists (simulate 70% chance of having a report)
    const hasReport = Math.random() > 0.3

    if (!hasReport) {
      return NextResponse.json(
        { success: false, error: 'No report found for this date' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: mockReport
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily report by date API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
