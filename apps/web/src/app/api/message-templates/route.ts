import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'
import { z } from 'zod'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// Validation schemas
const createMessageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  template: z.string().min(1, 'Template content is required'),
  variables: z.array(z.string()).default([]),
  incomingWebhookId: z.string().cuid('Invalid webhook ID'),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const webhookId = searchParams.get('webhookId') || ''

    // Validate pagination
    const paginationValidation = paginationSchema.safeParse({ page, limit })
    if (!paginationValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400, headers: corsHeaders }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // Filter by user (non-admin users can only see templates for their own webhooks)
    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin) {
      where.incomingWebhook = {
        userId: (session as any).user.id
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { template: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (webhookId) {
      where.incomingWebhookId = webhookId
    }

    // Get message templates with pagination
    const [messageTemplates, total] = await Promise.all([
      prisma.messageTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          incomingWebhook: {
            select: {
              id: true,
              name: true,
              url: true,
            }
          }
        }
      }),
      prisma.messageTemplate.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: messageTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Message templates list API error:', error)
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

    const body = await request.json()

    // Validate request body
    const validation = createMessageTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid message template data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const { name, template, variables, incomingWebhookId } = validation.data

    // Check if user has access to the webhook
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: incomingWebhookId }
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin && webhook.userId !== (session as any).user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Create the message template
    const messageTemplate = await prisma.messageTemplate.create({
      data: {
        name,
        template,
        variables,
        incomingWebhookId,
      },
      include: {
        incomingWebhook: {
          select: {
            id: true,
            name: true,
            url: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: messageTemplate,
      message: 'Message template created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Message template creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
