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
    const userId = (session as any)?.user?.id
    const webhookId = params.id

    // Only admins can test webhooks
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get webhook details
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: webhookId },
      include: {
        outgoingEndpoints: {
          where: { isActive: true }
        }
      }
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

    // Create test payload
    const testPayload = {
      event: 'webhook_test',
      data: {
        message: 'This is a test webhook from DailySync',
        timestamp: new Date().toISOString(),
        user: session.user.name,
        webhook: {
          id: webhook.id,
          name: webhook.name,
          type: webhook.type
        }
      },
      test: true
    }

    // Create payload log entry for the test
    const payloadLog = await prisma.payloadLog.create({
      data: {
        payload: testPayload,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'DailySync-Test/1.0'
        },
        userAgent: 'DailySync-Test/1.0',
        ipAddress: '127.0.0.1',
        incomingWebhookId: webhook.id,
      },
    })

    // Actually deliver to endpoints using the real delivery system
    const deliveryResults = await Promise.all(
      webhook.outgoingEndpoints.map(async (endpoint) => {
        try {
          // Create delivery log entry
          const deliveryLog = await prisma.deliveryLog.create({
            data: {
              status: 'PENDING',
              payloadLogId: payloadLog.id,
              endpointId: endpoint.id,
            },
          })

          // Actually deliver the webhook using axios
          const startTime = Date.now()
          let result: any

          try {
            const response = await fetch(endpoint.url, {
              method: endpoint.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DailySync-Test/1.0',
                ...(endpoint.headers as Record<string, string> || {})
              },
              body: JSON.stringify(testPayload),
              signal: AbortSignal.timeout(endpoint.timeoutMs || 30000)
            })

            const duration = Date.now() - startTime
            const responseText = await response.text()
            let responseData

            try {
              responseData = JSON.parse(responseText)
            } catch {
              responseData = responseText
            }

            result = {
              success: response.ok,
              statusCode: response.status,
              response: responseData,
              duration,
              error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
            }
          } catch (error) {
            const duration = Date.now() - startTime
            result = {
              success: false,
              statusCode: 500,
              response: null,
              duration,
              error: error instanceof Error ? error.message : 'Network error'
            }
          }

          // Update delivery log with result
          await prisma.deliveryLog.update({
            where: { id: deliveryLog.id },
            data: {
              status: result.success ? 'SUCCESS' : 'FAILED',
              response: JSON.stringify(result.response),
              error: result.error,
              deliveredAt: result.success ? new Date() : null,
            },
          })

          return {
            endpointId: endpoint.id,
            endpointName: endpoint.name,
            endpointUrl: endpoint.url,
            status: result.success ? 'SUCCESS' : 'FAILED',
            statusCode: result.statusCode || (result.success ? 200 : 500),
            responseTime: result.duration || 0,
            response: result.response,
            error: result.error,
            deliveredAt: result.success ? new Date().toISOString() : null
          }
        } catch (error) {
          console.error('Test delivery failed:', error)

          return {
            endpointId: endpoint.id,
            endpointName: endpoint.name,
            endpointUrl: endpoint.url,
            status: 'FAILED',
            statusCode: 500,
            responseTime: 0,
            response: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            deliveredAt: null
          }
        }
      })
    )

    const successfulDeliveries = deliveryResults.filter(r => r.status === 'SUCCESS').length
    const overallSuccess = successfulDeliveries === deliveryResults.length
    const testStatus = overallSuccess ? 'success' : successfulDeliveries > 0 ? 'partial_success' : 'failed'

    // Structure response to match frontend expectations
    const testResult = {
      webhookId: webhook.id,
      testId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      testStatus,
      webhookResponse: {
        data: {
          deliveryResults
        }
      },
      payload: testPayload,
      summary: {
        totalEndpoints: webhook.outgoingEndpoints.length,
        successfulDeliveries: successfulDeliveries,
        failedDeliveries: deliveryResults.filter(r => r.status === 'FAILED').length,
        averageResponseTime: deliveryResults.length > 0
          ? Math.round(deliveryResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / deliveryResults.length)
          : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: testResult,
      message: `Webhook test ${testStatus === 'success' ? 'completed successfully' : 'completed with some failures'}`
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
