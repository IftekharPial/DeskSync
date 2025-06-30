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

    // Only admins can access webhook analytics
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Mock webhook analytics data
    const mockData = {
      totalWebhooks: 1250,
      successfulDeliveries: 1232,
      failedDeliveries: 18,
      successRate: 98.5,
      averageResponseTime: 245,
      webhookStats: [
        {
          webhookId: '1',
          name: 'Slack Integration',
          totalDeliveries: 450,
          successfulDeliveries: 448,
          failedDeliveries: 2,
          successRate: 99.6,
          averageResponseTime: 180
        },
        {
          webhookId: '2',
          name: 'Teams Integration',
          totalDeliveries: 380,
          successfulDeliveries: 375,
          failedDeliveries: 5,
          successRate: 98.7,
          averageResponseTime: 220
        },
        {
          webhookId: '3',
          name: 'Email Notifications',
          totalDeliveries: 420,
          successfulDeliveries: 409,
          failedDeliveries: 11,
          successRate: 97.4,
          averageResponseTime: 320
        }
      ],
      dailyStats: [
        { date: '2024-01-01', deliveries: 85, successful: 84, failed: 1 },
        { date: '2024-01-02', deliveries: 92, successful: 90, failed: 2 },
        { date: '2024-01-03', deliveries: 78, successful: 77, failed: 1 },
        { date: '2024-01-04', deliveries: 95, successful: 93, failed: 2 },
        { date: '2024-01-05', deliveries: 88, successful: 86, failed: 2 }
      ]
    }

    return NextResponse.json({
      success: true,
      data: mockData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
