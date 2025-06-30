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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only admins can test webhooks
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Mock webhook test
    const testResult = {
      webhookId: params.id,
      testId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'success',
      statusCode: 200,
      responseTime: Math.floor(Math.random() * 500) + 100, // Random response time between 100-600ms
      response: {
        message: 'Test webhook delivered successfully',
        timestamp: new Date().toISOString()
      },
      payload: {
        event: 'webhook_test',
        data: {
          message: 'This is a test webhook from DailySync',
          timestamp: new Date().toISOString(),
          user: session.user.name
        }
      }
    }

    // Simulate occasional failures for realism
    if (Math.random() < 0.1) { // 10% chance of failure
      testResult.status = 'failed'
      testResult.statusCode = 500
      testResult.response = {
        error: 'Internal Server Error',
        message: 'Webhook endpoint returned an error'
      }
    }

    return NextResponse.json({
      success: true,
      data: testResult,
      message: `Webhook test ${testResult.status === 'success' ? 'completed successfully' : 'failed'}`
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
