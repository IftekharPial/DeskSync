import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
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

    // Get webhookId from query parameters
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhookId')

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'webhookId query parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if webhook exists and user has access
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: webhookId },
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Non-admin users can only view their own webhook endpoints
    if (!isAdmin && webhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    const endpoints = await prisma.outgoingEndpoint.findMany({
      where: { incomingWebhookId: webhookId },
      include: {
        messageTemplate: true,
        _count: {
          select: {
            deliveryLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: endpoints,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Endpoints GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { incomingWebhookId, name, url, method = 'POST', headers = {}, retryAttempts = 3, retryDelayMs = 1000, timeoutMs = 30000 } = body

    // Validate required fields
    if (!incomingWebhookId || !name || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: incomingWebhookId, name, url' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if webhook exists and user has access
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: incomingWebhookId },
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Non-admin users can only create endpoints for their own webhooks
    if (!isAdmin && webhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    const endpoint = await prisma.outgoingEndpoint.create({
      data: {
        name,
        url,
        method,
        headers,
        retryAttempts,
        retryDelayMs,
        timeoutMs,
        incomingWebhookId,
        isActive: true,
      },
      include: {
        messageTemplate: true,
        _count: {
          select: {
            deliveryLogs: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: endpoint,
      message: 'Endpoint created successfully',
    }, { status: 201, headers: corsHeaders })

  } catch (error) {
    console.error('Endpoints POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
