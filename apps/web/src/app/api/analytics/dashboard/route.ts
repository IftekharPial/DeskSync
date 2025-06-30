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

    // Mock dashboard data
    const mockData = {
      dailyReports: {
        reportCount: 42,
        completionRate: 95.5,
        averageScore: 8.7,
        trend: 12,
        platformStats: [
          { platform: 'Facebook', totalTickets: 125, averageTickets: 8.3 },
          { platform: 'YouTube', totalTickets: 98, averageTickets: 6.5 },
          { platform: 'Crisp Chat', totalTickets: 87, averageTickets: 5.8 },
          { platform: 'Email Support', totalTickets: 156, averageTickets: 10.4 },
          { platform: 'Phone Support', totalTickets: 67, averageTickets: 4.5 }
        ]
      },
      timeSeries: [
        { date: '2024-01-01', tickets: 15, chats: 8, emails: 12, calls: 5, githubIssues: 3 },
        { date: '2024-01-02', tickets: 18, chats: 10, emails: 14, calls: 7, githubIssues: 2 },
        { date: '2024-01-03', tickets: 16, chats: 9, emails: 11, calls: 6, githubIssues: 4 },
        { date: '2024-01-04', tickets: 20, chats: 12, emails: 16, calls: 8, githubIssues: 1 },
        { date: '2024-01-05', tickets: 14, chats: 7, emails: 10, calls: 4, githubIssues: 5 }
      ],
      userPerformance: isAdmin ? [
        {
          userId: '1',
          name: 'John Doe',
          reportCount: 15,
          completionRate: 100,
          averageScore: 9.2
        },
        {
          userId: '2', 
          name: 'Jane Smith',
          reportCount: 12,
          completionRate: 92,
          averageScore: 8.5
        }
      ] : null,
      systemDeliveryStats: isAdmin ? {
        successRate: 98.5,
        averageResponseTime: 245,
        totalDeliveries: 1250,
        failedDeliveries: 18
      } : null,
      recentActivity: [
        {
          id: '1',
          type: 'report_submitted',
          user: session.user.name,
          timestamp: new Date().toISOString(),
          description: 'Daily report submitted'
        },
        {
          id: '2',
          type: 'webhook_delivered',
          user: 'System',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          description: 'Webhook delivered successfully'
        }
      ],
      userStats: !isAdmin ? {
        reportsThisMonth: 15,
        completionRate: 100,
        averageScore: 9.2,
        streak: 7
      } : null
    }

    return NextResponse.json({
      success: true,
      data: mockData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
