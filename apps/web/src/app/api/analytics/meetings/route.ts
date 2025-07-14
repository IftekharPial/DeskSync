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

    // Get real meeting reports analytics from database
    const [
      totalMeetings,
      meetingsInRange,
      outcomeStats,
      recentMeetings,
      meetingDurations,
      dailyMeetingBreakdown
    ] = await Promise.all([
      // Total meetings count
      prisma.meetingReport.count({ where: whereClause }),
      
      // Meetings in date range
      prisma.meetingReport.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Meeting outcome statistics
      prisma.meetingReport.groupBy({
        by: ['outcome'],
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          outcome: true
        }
      }),
      
      // Recent meetings for activity feed
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          outcome: true,
          attendees: true,
          customerName: true,
          createdAt: true,
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
      
      // Meeting durations for average calculation
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          endTime: {
            not: null
          }
        },
        select: {
          startTime: true,
          endTime: true
        }
      }),
      
      // Daily meeting breakdown for the last 7 days
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          outcome: true,
          startTime: true,
          endTime: true,
          attendees: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Calculate meeting statistics
    const outcomeStatsMap = outcomeStats.reduce((acc, stat) => {
      acc[stat.outcome] = stat._count.outcome
      return acc
    }, {} as Record<string, number>)

    // Calculate average meeting duration
    const totalDurationMinutes = meetingDurations.reduce((acc, meeting) => {
      if (meeting.endTime) {
        const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
        return acc + (duration / (1000 * 60)) // Convert to minutes
      }
      return acc
    }, 0)

    const averageDuration = meetingDurations.length > 0 
      ? Math.round(totalDurationMinutes / meetingDurations.length) 
      : 0

    // Calculate completion rate
    const completedMeetings = outcomeStatsMap['COMPLETED'] || 0
    const completionRate = meetingsInRange > 0 
      ? Math.round((completedMeetings / meetingsInRange) * 100 * 100) / 100 
      : 0

    // Group daily meetings by date
    const dailyMeetingsMap = dailyMeetingBreakdown.reduce((acc, meeting) => {
      const date = meeting.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          rescheduled: 0,
          totalAttendees: 0
        }
      }
      acc[date].total++
      acc[date][meeting.outcome.toLowerCase() as keyof typeof acc[string]]++
      acc[date].totalAttendees += meeting.attendees.length
      return acc
    }, {} as Record<string, any>)

    const analyticsData = {
      totalMeetings,
      meetingsInRange,
      completionRate,
      averageDuration,
      totalDurationMinutes: Math.round(totalDurationMinutes),
      outcomeStats: outcomeStatsMap,
      recentMeetings: recentMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        outcome: meeting.outcome,
        attendeeCount: meeting.attendees.length,
        customerName: meeting.customerName,
        createdAt: meeting.createdAt,
        userName: meeting.user?.name
      })),
      dailyData: Object.values(dailyMeetingsMap).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Meetings analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
