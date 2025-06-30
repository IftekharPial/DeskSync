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

    // Get date range (last 7 days for time series)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Get real dashboard analytics from database
    const [
      totalDailyReports,
      totalMeetingReports,
      recentDailyReports,
      recentMeetingReports,
      dailyReportsStats,
      meetingReportsStats,
      timeSeries
    ] = await Promise.all([
      // Total daily reports count
      prisma.dailyReport.count({ where: whereClause }),

      // Total meeting reports count
      prisma.meetingReport.count({
        where: isAdmin ? {} : { userId }
      }),

      // Recent daily reports
      prisma.dailyReport.findMany({
        where: {
          ...whereClause,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 10
      }),

      // Recent meeting reports
      prisma.meetingReport.findMany({
        where: {
          ...(isAdmin ? {} : { userId }),
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Daily reports aggregated stats
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

      // Meeting reports stats
      prisma.meetingReport.groupBy({
        by: ['outcome'],
        where: {
          ...(isAdmin ? {} : { userId }),
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          outcome: true
        }
      }),

      // Time series data for the last 7 days
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
          date: 'asc'
        }
      })
    ])

    const dashboardData = {
      dailyReports: {
        reportCount: totalDailyReports,
        totalTickets: dailyReportsStats._sum.ticketsResolved || 0,
        totalChats: dailyReportsStats._sum.chatsHandled || 0,
        totalEmails: dailyReportsStats._sum.emailsProcessed || 0,
        totalCalls: dailyReportsStats._sum.callsAttended || 0,
        totalGithubIssues: dailyReportsStats._sum.githubIssues || 0,
        averageTickets: Math.round((dailyReportsStats._avg.ticketsResolved || 0) * 100) / 100,
        averageChats: Math.round((dailyReportsStats._avg.chatsHandled || 0) * 100) / 100,
        averageEmails: Math.round((dailyReportsStats._avg.emailsProcessed || 0) * 100) / 100,
        averageCalls: Math.round((dailyReportsStats._avg.callsAttended || 0) * 100) / 100,
        averageGithubIssues: Math.round((dailyReportsStats._avg.githubIssues || 0) * 100) / 100
      },
      meetingReports: {
        reportCount: totalMeetingReports,
        outcomeStats: meetingReportsStats.reduce((acc, stat) => {
          acc[stat.outcome] = stat._count.outcome
          return acc
        }, {} as Record<string, number>)
      },
      timeSeries: timeSeries.map(report => ({
        date: report.date.toISOString().split('T')[0],
        tickets: report.ticketsResolved,
        chats: report.chatsHandled,
        emails: report.emailsProcessed,
        calls: report.callsAttended,
        githubIssues: report.githubIssues
      })),
      recentActivity: [
        ...recentDailyReports.map(report => ({
          id: report.id,
          type: 'daily_report_submitted',
          user: report.user?.name || 'Unknown User',
          timestamp: report.createdAt.toISOString(),
          description: `Daily report submitted for ${report.date.toISOString().split('T')[0]}`
        })),
        ...recentMeetingReports.map(report => ({
          id: report.id,
          type: 'meeting_report_submitted',
          user: report.user?.name || 'Unknown User',
          timestamp: report.createdAt.toISOString(),
          description: `Meeting report: ${report.title}`
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
      userStats: !isAdmin ? {
        dailyReportsThisMonth: recentDailyReports.length,
        meetingReportsThisMonth: recentMeetingReports.length,
        totalTicketsResolved: dailyReportsStats._sum.ticketsResolved || 0,
        totalChatsHandled: dailyReportsStats._sum.chatsHandled || 0
      } : null
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
