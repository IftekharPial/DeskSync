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

    const userId = (session as any)?.user?.id

    // Build where clause for user access control
    const whereClause: any = {}
    if (!isAdmin) {
      whereClause.createdBy = userId
    }

    // Get real webhook analytics from database
    const [
      totalWebhooks,
      activeWebhooks,
      inactiveWebhooks,
      pausedWebhooks,
      totalPayloadLogs,
      successfulDeliveries,
      failedDeliveries,
      webhookStats
    ] = await Promise.all([
      // Total webhooks count
      prisma.incomingWebhook.count({ where: whereClause }),

      // Active webhooks count
      prisma.incomingWebhook.count({
        where: { ...whereClause, status: 'ACTIVE' }
      }),

      // Inactive webhooks count
      prisma.incomingWebhook.count({
        where: { ...whereClause, status: 'INACTIVE' }
      }),

      // Paused webhooks count
      prisma.incomingWebhook.count({
        where: { ...whereClause, status: 'PAUSED' }
      }),

      // Total payload logs
      prisma.payloadLog.count({
        where: {
          incomingWebhook: whereClause
        }
      }),

      // Successful deliveries (SUCCESS status)
      prisma.deliveryLog.count({
        where: {
          status: 'SUCCESS',
          endpoint: {
            incomingWebhook: whereClause
          }
        }
      }),

      // Failed deliveries (FAILED status)
      prisma.deliveryLog.count({
        where: {
          status: 'FAILED',
          endpoint: {
            incomingWebhook: whereClause
          }
        }
      }),

      // Individual webhook stats
      prisma.incomingWebhook.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              payloadLogs: true,
              outgoingEndpoints: true,
            }
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    const totalDeliveries = successfulDeliveries + failedDeliveries
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0

    const analyticsData = {
      totalWebhooks,
      activeWebhooks,
      inactiveWebhooks,
      pausedWebhooks,
      totalPayloadLogs,
      successfulDeliveries,
      failedDeliveries,
      totalDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      webhookStats: webhookStats.map(webhook => ({
        webhookId: webhook.id,
        name: webhook.name,
        status: webhook.status,
        totalPayloadLogs: webhook._count.payloadLogs,
        totalEndpoints: webhook._count.outgoingEndpoints,
      }))
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
