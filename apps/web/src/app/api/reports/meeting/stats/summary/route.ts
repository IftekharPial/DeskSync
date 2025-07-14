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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const userId = (session.user as any).id

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const endDate = new Date()

    // Build where clause based on user role
    const whereClause = isAdmin ? {} : { userId }

    // Get real meeting reports data from database
    const [
      totalMeetings,
      meetingsInRange,
      outcomeStats,
      meetingDurations,
      recentMeetings
    ] = await Promise.all([
      // Total meetings count
      prisma.meetingReport.count({ where: whereClause }),

      // Meetings in date range
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          outcome: true,
          attendees: true,
          startTime: true,
          endTime: true
        }
      }),

      // Meeting outcome statistics
      prisma.meetingReport.groupBy({
        by: ['outcome'],
        where: {
          ...whereClause,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          outcome: true
        }
      }),

      // Meeting durations for average calculation
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          startTime: {
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

      // Recent meetings
      prisma.meetingReport.findMany({
        where: {
          ...whereClause,
          startTime: {
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
          notes: true
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 10
      })
    ])

    // Calculate statistics from real data
    const outcomeStatsMap = outcomeStats.reduce((acc, stat) => {
      acc[stat.outcome] = stat._count.outcome
      return acc
    }, {} as Record<string, number>)

    // Calculate total attendees
    const totalAttendees = meetingsInRange.reduce((sum, meeting) => {
      return sum + (meeting.attendees?.length || 0)
    }, 0)

    // Calculate average duration
    const totalDurationMinutes = meetingDurations.reduce((sum, meeting) => {
      if (meeting.endTime && meeting.startTime) {
        const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
        return sum + (duration / (1000 * 60)) // Convert to minutes
      }
      return sum
    }, 0)

    const averageDuration = meetingDurations.length > 0
      ? Math.round(totalDurationMinutes / meetingDurations.length)
      : 0

    const averageAttendeesPerMeeting = meetingsInRange.length > 0
      ? parseFloat((totalAttendees / meetingsInRange.length).toFixed(1))
      : 0

    // Calculate success rate
    const successfulCount = outcomeStatsMap['SUCCESSFUL'] || 0
    const successRate = meetingsInRange.length > 0
      ? Math.round((successfulCount / meetingsInRange.length) * 100)
      : 0

    // Build response data
    const summary = {
      totalMeetings: meetingsInRange.length,
      averageDuration,
      successfulMeetings: successfulCount,
      cancelledMeetings: outcomeStatsMap['CANCELLED'] || 0,
      totalAttendees,
      averageAttendeesPerMeeting,
      successRate,
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      outcomeStats: outcomeStatsMap,
      recentMeetings: recentMeetings.slice(0, 5)
    }

    return NextResponse.json({
      success: true,
      data: summary
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Meeting reports summary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
