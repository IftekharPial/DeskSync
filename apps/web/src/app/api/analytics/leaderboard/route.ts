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

// Generate real leaderboard data from database
const generateRealLeaderboard = async (metric: string, limit: number, period: string, isAdmin: boolean, userId?: string) => {
  // Calculate date range based on period
  const endDate = new Date()
  const startDate = new Date()

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 7)
  }

  // Build where clause for user access control
  const whereClause: any = {
    isActive: true,
    role: 'USER' // Only include regular users in leaderboard
  }

  let leaderboardData: any[] = []

  switch (metric) {
    case 'tickets':
      // Get users with their ticket resolution counts
      const usersWithTickets = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          dailyReports: {
            where: {
              date: {
                gte: startDate,
                lte: endDate
              }
            },
            select: {
              ticketsResolved: true
            }
          }
        }
      })

      leaderboardData = usersWithTickets.map(user => {
        const totalTickets = user.dailyReports.reduce((sum, report) => sum + report.ticketsResolved, 0)
        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: null
          },
          value: totalTickets,
          metric: 'tickets'
        }
      }).filter(item => item.value > 0)
      break

    case 'reports':
      // Get users with their report submission counts
      const usersWithReports = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              dailyReports: {
                where: {
                  date: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            }
          }
        }
      })

      leaderboardData = usersWithReports.map(user => ({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: null
        },
        value: user._count.dailyReports,
        metric: 'reports'
      })).filter(item => item.value > 0)
      break

    case 'meetings':
      // Get users with their meeting counts
      const usersWithMeetings = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              meetingReports: {
                where: {
                  createdAt: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            }
          }
        }
      })

      leaderboardData = usersWithMeetings.map(user => ({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: null
        },
        value: user._count.meetingReports,
        metric: 'meetings'
      })).filter(item => item.value > 0)
      break

    default:
      // Default to tickets
      return generateRealLeaderboard('tickets', limit, period, isAdmin, userId)
  }

  // Sort by value (descending)
  leaderboardData.sort((a, b) => b.value - a.value)

  // Add ranks and limit results
  const rankedData = leaderboardData.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    user: item.user,
    value: item.value,
    change: 0, // TODO: Calculate change from previous period
    trend: 'stable' as const,
    metric: item.metric
  }))

  return rankedData
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'tickets'
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period') || 'week' // week, month, quarter, year

    // Validate limit
    const validatedLimit = Math.min(Math.max(limit, 1), 50) // Between 1 and 50

    // Generate real leaderboard data from database
    const leaderboard = await generateRealLeaderboard(metric, validatedLimit, period, isAdmin, userId)

    // Add period-specific metadata
    const periodLabels = {
      week: 'This Week',
      month: 'This Month', 
      quarter: 'This Quarter',
      year: 'This Year'
    }

    const metricLabels = {
      tickets: 'Tickets Resolved',
      reports: 'Reports Submitted',
      meetings: 'Meetings Attended',
      completion: 'Completion Rate (%)'
    }

    const response = {
      leaderboard,
      metadata: {
        metric,
        metricLabel: metricLabels[metric as keyof typeof metricLabels] || 'Unknown Metric',
        period,
        periodLabel: periodLabels[period as keyof typeof periodLabels] || 'Unknown Period',
        limit: validatedLimit,
        total: leaderboard.length,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
