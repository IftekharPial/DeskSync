import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'

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

    // Only admins can access user performance data
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get real user performance data from database
    const userPerformanceData = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'USER' // Only include regular users in performance metrics
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            dailyReports: true,
            meetingReports: true
          }
        },
        dailyReports: {
          select: {
            ticketsResolved: true,
            chatsHandled: true,
            githubIssues: true,
            emailsProcessed: true,
            callsAttended: true,
            date: true
          },
          orderBy: {
            date: 'desc'
          },
          take: 30 // Last 30 days
        },
        meetingReports: {
          select: {
            outcome: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 30 // Last 30 reports
        }
      }
    })

    const performanceMetrics = userPerformanceData.map(user => {
      const totalTickets = user.dailyReports.reduce((sum, report) => sum + report.ticketsResolved, 0)
      const totalChats = user.dailyReports.reduce((sum, report) => sum + report.chatsHandled, 0)
      const totalEmails = user.dailyReports.reduce((sum, report) => sum + report.emailsProcessed, 0)
      const totalCalls = user.dailyReports.reduce((sum, report) => sum + report.callsAttended, 0)
      const totalGithubIssues = user.dailyReports.reduce((sum, report) => sum + report.githubIssues, 0)

      const completedMeetings = user.meetingReports.filter(meeting => meeting.outcome === 'COMPLETED').length
      const totalMeetings = user.meetingReports.length
      const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0

      const dailyReportCount = user._count.dailyReports
      const averageTicketsPerDay = dailyReportCount > 0 ? totalTickets / dailyReportCount : 0

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        dailyReportCount: dailyReportCount,
        meetingReportCount: user._count.meetingReports,
        totalTickets,
        totalChats,
        totalEmails,
        totalCalls,
        totalGithubIssues,
        averageTicketsPerDay: Math.round(averageTicketsPerDay * 100) / 100,
        meetingCompletionRate: Math.round(meetingCompletionRate * 100) / 100,
        totalActivities: totalTickets + totalChats + totalEmails + totalCalls + totalGithubIssues
      }
    }).sort((a, b) => b.totalActivities - a.totalActivities) // Sort by total activities

    return NextResponse.json({
      success: true,
      data: performanceMetrics
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User performance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
