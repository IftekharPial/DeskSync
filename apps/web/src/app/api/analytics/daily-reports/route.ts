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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Build where clause for user access control
    const whereClause: any = {}
    if (!isAdmin) {
      whereClause.userId = userId
    }

    // Get date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Get real daily reports analytics from database
    const [
      totalReports,
      reportsInRange,
      aggregatedStats,
      dailyBreakdown
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

      // Aggregated statistics
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

      // Daily breakdown for the last 7 days
      prisma.dailyReport.findMany({
        where: {
          ...whereClause,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: endDate
          }
        },
        select: {
          date: true,
          ticketsResolved: true,
          chatsHandled: true,
          githubIssues: true,
          emailsProcessed: true,
          callsAttended: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      })
    ])

    const analyticsData = {
      reportCount: totalReports,
      reportsInRange,
      totalTickets: aggregatedStats._sum.ticketsResolved || 0,
      totalChats: aggregatedStats._sum.chatsHandled || 0,
      totalGithubIssues: aggregatedStats._sum.githubIssues || 0,
      totalEmails: aggregatedStats._sum.emailsProcessed || 0,
      totalCalls: aggregatedStats._sum.callsAttended || 0,
      averageTickets: Math.round((aggregatedStats._avg.ticketsResolved || 0) * 100) / 100,
      averageChats: Math.round((aggregatedStats._avg.chatsHandled || 0) * 100) / 100,
      averageGithubIssues: Math.round((aggregatedStats._avg.githubIssues || 0) * 100) / 100,
      averageEmails: Math.round((aggregatedStats._avg.emailsProcessed || 0) * 100) / 100,
      averageCalls: Math.round((aggregatedStats._avg.callsAttended || 0) * 100) / 100,
      dailyData: dailyBreakdown.map(report => ({
        date: report.date.toISOString().split('T')[0],
        tickets: report.ticketsResolved,
        chats: report.chatsHandled,
        githubIssues: report.githubIssues,
        emails: report.emailsProcessed,
        calls: report.callsAttended,
        userName: report.user?.name
      }))
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily reports API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
