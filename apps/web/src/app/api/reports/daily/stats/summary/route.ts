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
    const userId = (session.user as any).id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const endDate = new Date()

    // Build where clause based on user role
    const whereClause: any = {}
    if (!isAdmin) {
      whereClause.userId = userId
    }

    // Get real daily reports data from database
    const [
      totalReports,
      reportsInRange,
      aggregatedStats,
      dailyBreakdown,
      previousPeriodStats
    ] = await Promise.all([
      // Total reports count
      prisma.dailyReport.count({ where: whereClause }),

      // Reports in date range
      prisma.dailyReport.count({
        where: {
          ...whereClause,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // Aggregated statistics for current period
      prisma.dailyReport.aggregate({
        where: {
          ...whereClause,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          ticketsResolved: true,
          chatsHandled: true,
          githubIssues: true,
          emailsProcessed: true,
          callsAttended: true
        },
        _avg: {
          ticketsResolved: true,
          chatsHandled: true,
          githubIssues: true,
          emailsProcessed: true,
          callsAttended: true
        }
      }),

      // Daily breakdown for charts
      prisma.dailyReport.findMany({
        where: {
          ...whereClause,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          date: true,
          ticketsResolved: true,
          chatsHandled: true,
          githubIssues: true,
          emailsProcessed: true,
          callsAttended: true
        },
        orderBy: {
          date: 'desc'
        }
      }),

      // Previous period stats for trend calculation
      prisma.dailyReport.aggregate({
        where: {
          ...whereClause,
          date: {
            gte: new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        },
        _sum: {
          ticketsResolved: true,
          chatsHandled: true,
          githubIssues: true,
          emailsProcessed: true,
          callsAttended: true
        }
      })
    ])

    // Calculate trends by comparing current vs previous period
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const currentTotals = {
      tickets: aggregatedStats._sum.ticketsResolved || 0,
      chats: aggregatedStats._sum.chatsHandled || 0,
      githubIssues: aggregatedStats._sum.githubIssues || 0,
      emails: aggregatedStats._sum.emailsProcessed || 0,
      calls: aggregatedStats._sum.callsAttended || 0
    }

    const previousTotals = {
      tickets: previousPeriodStats._sum.ticketsResolved || 0,
      chats: previousPeriodStats._sum.chatsHandled || 0,
      githubIssues: previousPeriodStats._sum.githubIssues || 0,
      emails: previousPeriodStats._sum.emailsProcessed || 0,
      calls: previousPeriodStats._sum.callsAttended || 0
    }

    const summary = {
      totalReports,
      reportsInRange,
      averageTicketsResolved: Math.round((aggregatedStats._avg.ticketsResolved || 0) * 100) / 100,
      averageChatsHandled: Math.round((aggregatedStats._avg.chatsHandled || 0) * 100) / 100,
      averageGithubIssues: Math.round((aggregatedStats._avg.githubIssues || 0) * 100) / 100,
      averageEmailsProcessed: Math.round((aggregatedStats._avg.emailsProcessed || 0) * 100) / 100,
      averageCallsAttended: Math.round((aggregatedStats._avg.callsAttended || 0) * 100) / 100,
      totalTickets: currentTotals.tickets,
      totalChats: currentTotals.chats,
      totalGithubIssues: currentTotals.githubIssues,
      totalEmails: currentTotals.emails,
      totalCalls: currentTotals.calls,
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      trends: {
        reports: calculateTrend(reportsInRange, totalReports - reportsInRange),
        tickets: calculateTrend(currentTotals.tickets, previousTotals.tickets),
        chats: calculateTrend(currentTotals.chats, previousTotals.chats),
        githubIssues: calculateTrend(currentTotals.githubIssues, previousTotals.githubIssues),
        emails: calculateTrend(currentTotals.emails, previousTotals.emails),
        calls: calculateTrend(currentTotals.calls, previousTotals.calls)
      },
      dailyBreakdown: dailyBreakdown.map(report => ({
        date: new Date(report.date).toISOString().split('T')[0],
        tickets: report.ticketsResolved,
        chats: report.chatsHandled,
        githubIssues: report.githubIssues,
        emails: report.emailsProcessed,
        calls: report.callsAttended
      }))
    }

    return NextResponse.json({
      success: true,
      data: summary
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily reports summary API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
