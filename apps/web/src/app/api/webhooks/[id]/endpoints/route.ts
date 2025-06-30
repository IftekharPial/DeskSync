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

// Mock webhook endpoints data
const mockEndpoints = {
  '1': [
    {
      id: '1',
      webhookId: '1',
      name: 'Primary Slack Channel',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      isActive: true,
      retryAttempts: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      lastTriggered: '2024-01-15T09:00:00Z',
      successCount: 145,
      failureCount: 2
    },
    {
      id: '2',
      webhookId: '1',
      name: 'Backup Slack Channel',
      url: 'https://hooks.slack.com/services/T00000000/B11111111/YYYYYYYYYYYYYYYYYYYYYYYY',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      isActive: false,
      retryAttempts: 2,
      retryDelayMs: 2000,
      timeoutMs: 25000,
      createdAt: '2024-01-02T11:00:00Z',
      updatedAt: '2024-01-10T16:45:00Z',
      lastTriggered: '2024-01-10T08:45:00Z',
      successCount: 23,
      failureCount: 1
    }
  ],
  '2': [
    {
      id: '3',
      webhookId: '2',
      name: 'Teams Main Channel',
      url: 'https://outlook.office.com/webhook/xxxxx/IncomingWebhook/yyyy',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      isActive: true,
      retryAttempts: 3,
      retryDelayMs: 1500,
      timeoutMs: 30000,
      createdAt: '2024-01-02T11:00:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      lastTriggered: '2024-01-15T08:45:00Z',
      successCount: 98,
      failureCount: 1
    }
  ]
}

export async function GET(
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

    // Only admins can access webhook endpoints
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const endpoints = mockEndpoints[params.id as keyof typeof mockEndpoints] || []

    return NextResponse.json({
      success: true,
      data: endpoints
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook endpoints GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
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

    // Only admins can create webhook endpoints
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Mock endpoint creation
    const newEndpoint = {
      id: Date.now().toString(),
      webhookId: params.id,
      name: body.name,
      url: body.url,
      method: body.method || 'POST',
      headers: body.headers || { 'Content-Type': 'application/json' },
      isActive: body.isActive !== false,
      retryAttempts: body.retryAttempts || 3,
      retryDelayMs: body.retryDelayMs || 1000,
      timeoutMs: body.timeoutMs || 30000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggered: null,
      successCount: 0,
      failureCount: 0
    }

    return NextResponse.json({
      success: true,
      data: newEndpoint,
      message: 'Webhook endpoint created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook endpoint creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
