import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'
import { updateWebhookSchema } from '@dailysync/database'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// Helper function to transform database webhook to API format
function transformWebhookForAPI(webhook: any) {
  return {
    id: webhook.id,
    name: webhook.name,
    description: webhook.description,
    url: webhook.url,
    type: webhook.type,
    secret: webhook.secret,
    status: webhook.status,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
    creator: webhook.creator ? {
      id: webhook.creator.id,
      name: webhook.creator.name,
      email: webhook.creator.email,
    } : null,
    _count: webhook._count || { payloadLogs: 0 },
  }
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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Get webhook from database
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            payloadLogs: true,
          },
        },
      },
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Non-admin users can only view their own webhooks
    if (!isAdmin && webhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: transformWebhookForAPI(webhook)
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(
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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Check if webhook exists and user has permission
    const existingWebhook = await prisma.incomingWebhook.findUnique({
      where: { id: params.id },
    })

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Non-admin users can only update their own webhooks
    if (!isAdmin && existingWebhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = updateWebhookSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Update webhook in database
    const updatedWebhook = await prisma.incomingWebhook.update({
      where: { id: params.id },
      data: validation.data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            payloadLogs: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: transformWebhookForAPI(updatedWebhook),
      message: 'Webhook updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}