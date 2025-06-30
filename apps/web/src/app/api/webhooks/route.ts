import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'
import { createWebhookSchema } from '@dailysync/database'
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

// Pagination schema
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Generate unique webhook URL
function generateWebhookUrl(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `/webhook/${result}`
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

    // Only admins can access webhook management
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const userId = (session as any)?.user?.id
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    // Non-admin users can only see their own webhooks
    if (!isAdmin) {
      whereClause.createdBy = userId
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get webhooks from database
    const [webhooks, total] = await Promise.all([
      prisma.incomingWebhook.findMany({
        where: whereClause,
        skip,
        take: limit,
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.incomingWebhook.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(total / limit)

    const transformedWebhooks = webhooks.map(transformWebhookForAPI)
    const response = {
      success: true,
      data: transformedWebhooks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }



    return NextResponse.json(response, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhooks API error:', error)
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

    const body = await request.json()

    console.log('Webhook creation request body:', body)
    console.log('User ID:', userId)

    // Ensure user exists in database
    let user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      // Create user if it doesn't exist
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: (session as any)?.user?.email || `user-${userId}@example.com`,
            name: (session as any)?.user?.name || 'Test User',
            password: 'temp_password', // This should be properly hashed in production
            role: 'ADMIN', // Set as admin to access webhook management
          }
        })
        console.log('Created user:', user)
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint failed, try to find existing user by email
          user = await prisma.user.findFirst({
            where: {
              email: (session as any)?.user?.email || `user-${userId}@example.com`
            }
          })
          if (!user) {
            throw new Error('Failed to create or find user')
          }
        } else {
          throw error
        }
      }
    }

    // Update user role to ADMIN if it's not already
    if (user && user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      })
      console.log('Updated user role to ADMIN:', user)
    }

    console.log('Final user object:', user)

    // Validate request body
    const validation = createWebhookSchema.safeParse({
      ...body,
      createdBy: user.id, // Use the actual user ID from database
    })

    if (!validation.success) {
      console.log('Validation failed:', validation.error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const { name, description, type, secret, status } = validation.data

    // Generate unique webhook URL
    let webhookUrl: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 5

    while (!isUnique && attempts < maxAttempts) {
      webhookUrl = generateWebhookUrl()
      const existing = await prisma.incomingWebhook.findUnique({
        where: { url: webhookUrl },
      })
      isUnique = !existing
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique webhook URL' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Create webhook in database
    const webhook = await prisma.incomingWebhook.create({
      data: {
        name,
        description,
        url: webhookUrl!,
        type,
        secret,
        status,
        createdBy: user.id, // Use the actual user ID from database
      },
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
      data: transformWebhookForAPI(webhook),
      message: 'Webhook created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
