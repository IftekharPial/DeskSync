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
    const userId = (session as any)?.user?.id
    const webhookId = params.id

    // Get webhook details first
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: webhookId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Check permissions
    if (!isAdmin && webhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get webhook statistics
    const [
      totalPayloadLogs,
      recentPayloadLogs,
      totalEndpoints,
      activeEndpoints,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      averageResponseTime
    ] = await Promise.all([
      // Total payload logs for this webhook
      prisma.payloadLog.count({
        where: { incomingWebhookId: webhookId }
      }),

      // Recent payload logs (last N days)
      prisma.payloadLog.count({
        where: {
          incomingWebhookId: webhookId,
          receivedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // Total endpoints for this webhook
      prisma.outgoingEndpoint.count({
        where: { incomingWebhookId: webhookId }
      }),

      // Active endpoints for this webhook
      prisma.outgoingEndpoint.count({
        where: {
          incomingWebhookId: webhookId,
          isActive: true
        }
      }),

      // Total deliveries (through all endpoints)
      prisma.deliveryLog.count({
        where: {
          endpoint: {
            incomingWebhookId: webhookId
          }
        }
      }),

      // Successful deliveries
      prisma.deliveryLog.count({
        where: {
          status: 'SUCCESS',
          endpoint: {
            incomingWebhookId: webhookId
          }
        }
      }),

      // Failed deliveries
      prisma.deliveryLog.count({
        where: {
          status: 'FAILED',
          endpoint: {
            incomingWebhookId: webhookId
          }
        }
      }),

      // Average response time (mock for now)
      Promise.resolve(250) // TODO: Calculate from actual delivery logs
    ])

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0

    // Get daily breakdown for the last 7 days
    const dailyBreakdown = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayPayloads = await prisma.payloadLog.count({
        where: {
          incomingWebhookId: webhookId,
          receivedAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      const dayDeliveries = await prisma.deliveryLog.count({
        where: {
          endpoint: {
            incomingWebhookId: webhookId
          },
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        payloads: dayPayloads,
        deliveries: dayDeliveries
      })
    }

    const stats = {
      webhook: {
        id: webhook.id,
        name: webhook.name,
        status: webhook.status,
        type: webhook.type,
        createdAt: webhook.createdAt,
        creator: webhook.creator
      },
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      totals: {
        payloadLogs: totalPayloadLogs,
        recentPayloadLogs,
        endpoints: totalEndpoints,
        activeEndpoints,
        deliveries: totalDeliveries,
        successfulDeliveries,
        failedDeliveries
      },
      performance: {
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime
      },
      dailyBreakdown
    }

    return NextResponse.json({
      success: true,
      data: stats
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
