import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'
import { TemplateProcessor } from '@/lib/template-processor'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Get endpoint details with related data
    const endpoint = await prisma.outgoingEndpoint.findUnique({
      where: { id: params.id },
      include: {
        messageTemplate: true,
        incomingWebhook: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    })

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Non-admin users can only test their own webhook endpoints
    if (!isAdmin && endpoint.incomingWebhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Create test payload
    const baseTestPayload = {
      event: 'endpoint_test',
      data: {
        message: 'This is a test message from DailySync',
        timestamp: new Date().toISOString(),
        user: session.user.name || 'Test User',
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
        },
        webhook: {
          id: endpoint.incomingWebhook.id,
          name: endpoint.incomingWebhook.name,
        }
      },
      test: true
    }

    // Process through template if available
    let processedPayload = baseTestPayload
    if (endpoint.messageTemplate?.template) {
      try {
        const templateProcessor = new TemplateProcessor()
        processedPayload = templateProcessor.processTemplate(
          endpoint.messageTemplate.template, 
          baseTestPayload
        )
      } catch (templateError) {
        console.warn('Template processing failed during test, using base payload:', templateError)
      }
    }

    // For Slack endpoints, ensure proper formatting
    let requestPayload = processedPayload
    if (endpoint.url.includes('hooks.slack.com')) {
      // Create Slack-compatible test message
      requestPayload = {
        text: '🧪 Test Message from DailySync',
        username: 'DailySync Bot',
        icon_emoji: ':robot_face:',
        attachments: [
          {
            color: 'good',
            title: 'Endpoint Test',
            text: 'This is a test message to verify your Slack webhook integration is working correctly.',
            fields: [
              {
                title: 'Endpoint',
                value: endpoint.name,
                short: true
              },
              {
                title: 'Webhook',
                value: endpoint.incomingWebhook.name,
                short: true
              },
              {
                title: 'Test Time',
                value: new Date().toLocaleString(),
                short: true
              },
              {
                title: 'Tested By',
                value: session.user.name || 'Unknown User',
                short: true
              }
            ],
            footer: 'DailySync Endpoint Test',
            footer_icon: 'https://dailysync.com/icon.png',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      }
    }

    // Log the test attempt
    console.log(`Testing endpoint: ${endpoint.name} (${endpoint.url})`)
    console.log('Payload being sent:', JSON.stringify(requestPayload, null, 2))

    const startTime = Date.now()

    try {
      // Send test request to the endpoint
      const response = await fetch(endpoint.url, {
        method: endpoint.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DailySync-EndpointTest/1.0',
          ...(endpoint.headers as Record<string, string> || {}),
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(endpoint.timeoutMs || 30000)
      })

      const duration = Date.now() - startTime
      let responseData: any

      try {
        const responseText = await response.text()
        responseData = responseText ? JSON.parse(responseText) : null
      } catch {
        responseData = 'Non-JSON response'
      }

      const testResult = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        response: responseData,
        duration,
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          url: endpoint.url.substring(0, 50) + '...' // Mask URL for security
        }
      }

      if (response.ok) {
        console.log(`✅ Endpoint test successful: ${endpoint.name}`)
        return NextResponse.json({
          success: true,
          message: 'Endpoint test completed successfully',
          data: testResult,
        }, { headers: corsHeaders })
      } else {
        console.error(`❌ Endpoint test failed: ${endpoint.name}`, {
          status: response.status,
          statusText: response.statusText,
          response: responseData
        })
        return NextResponse.json({
          success: false,
          error: `Endpoint returned ${response.status}: ${response.statusText}`,
          data: testResult,
        }, { status: 400, headers: corsHeaders })
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`❌ Endpoint test error: ${endpoint.name}`, error)

      const testResult = {
        success: false,
        error: error.message,
        duration,
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          url: endpoint.url.substring(0, 50) + '...'
        }
      }

      return NextResponse.json({
        success: false,
        error: `Test failed: ${error.message}`,
        data: testResult,
      }, { status: 500, headers: corsHeaders })
    }

  } catch (error) {
    console.error('Endpoint test API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
