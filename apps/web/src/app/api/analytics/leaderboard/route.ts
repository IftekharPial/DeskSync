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

// Mock leaderboard data
const generateMockLeaderboard = (metric: string, limit: number) => {
  const users = [
    { id: '1', name: 'John Doe', email: 'john.doe@dailysync.com', avatar: null },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@dailysync.com', avatar: null },
    { id: '3', name: 'Bob Johnson', email: 'bob.johnson@dailysync.com', avatar: null },
    { id: '4', name: 'Alice Brown', email: 'alice.brown@dailysync.com', avatar: null },
    { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@dailysync.com', avatar: null },
    { id: '6', name: 'Diana Davis', email: 'diana.davis@dailysync.com', avatar: null },
    { id: '7', name: 'Eve Miller', email: 'eve.miller@dailysync.com', avatar: null },
    { id: '8', name: 'Frank Garcia', email: 'frank.garcia@dailysync.com', avatar: null },
    { id: '9', name: 'Grace Lee', email: 'grace.lee@dailysync.com', avatar: null },
    { id: '10', name: 'Henry Taylor', email: 'henry.taylor@dailysync.com', avatar: null }
  ]

  const leaderboardData = users.slice(0, limit).map((user, index) => {
    let value: number
    let change: number
    let trend: 'up' | 'down' | 'stable'

    switch (metric) {
      case 'tickets':
        value = Math.floor(Math.random() * 50) + 20 // 20-70 tickets
        change = Math.floor(Math.random() * 20) - 10 // -10 to +10
        break
      case 'reports':
        value = Math.floor(Math.random() * 30) + 10 // 10-40 reports
        change = Math.floor(Math.random() * 10) - 5 // -5 to +5
        break
      case 'score':
        value = parseFloat((Math.random() * 2 + 8).toFixed(1)) // 8.0-10.0 score
        change = parseFloat((Math.random() * 1 - 0.5).toFixed(1)) // -0.5 to +0.5
        break
      case 'completion':
        value = Math.floor(Math.random() * 20) + 80 // 80-100% completion
        change = Math.floor(Math.random() * 10) - 5 // -5 to +5
        break
      default:
        value = Math.floor(Math.random() * 100)
        change = Math.floor(Math.random() * 20) - 10
    }

    trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

    return {
      rank: index + 1,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      value,
      change,
      trend,
      metric
    }
  })

  // Sort by value (descending for most metrics, ascending for some)
  const sortDescending = ['tickets', 'reports', 'score', 'completion']
  if (sortDescending.includes(metric)) {
    leaderboardData.sort((a, b) => b.value - a.value)
  } else {
    leaderboardData.sort((a, b) => a.value - b.value)
  }

  // Update ranks after sorting
  leaderboardData.forEach((item, index) => {
    item.rank = index + 1
  })

  return leaderboardData
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
    const metric = searchParams.get('metric') || 'tickets'
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = searchParams.get('period') || 'week' // week, month, quarter, year

    // Validate limit
    const validatedLimit = Math.min(Math.max(limit, 1), 50) // Between 1 and 50

    // Generate mock leaderboard data
    const leaderboard = generateMockLeaderboard(metric, validatedLimit)

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
      score: 'Average Score',
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
