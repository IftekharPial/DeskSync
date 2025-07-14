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
  console.log('🧪 [ENDPOINT TEST] Starting test for endpoint:', params.id)

  try {
    // Get session to check authentication
    console.log('🔐 [ENDPOINT TEST] Checking authentication...')
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log('❌ [ENDPOINT TEST] No session found - unauthorized')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('✅ [ENDPOINT TEST] User authenticated:', session.user.email)

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Get endpoint details with related data
    console.log('🔍 [ENDPOINT TEST] Fetching endpoint details...')
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
      console.log('❌ [ENDPOINT TEST] Endpoint not found:', params.id)
      return NextResponse.json(
        { success: false, error: 'Endpoint not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    console.log('✅ [ENDPOINT TEST] Endpoint found:', {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url.substring(0, 50) + '...',
      method: endpoint.method,
      isActive: endpoint.isActive
    })

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
    console.log('🚀 [ENDPOINT TEST] Starting HTTP request to:', endpoint.url)
    console.log('📦 [ENDPOINT TEST] Request details:', {
      method: endpoint.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DailySync-EndpointTest/1.0',
        ...(endpoint.headers as Record<string, string> || {}),
      },
      timeout: endpoint.timeoutMs || 30000
    })
    console.log('📦 [ENDPOINT TEST] Payload being sent:', JSON.stringify(requestPayload, null, 2))

    const startTime = Date.now()

    try {
      // Send test request to the endpoint
      console.log('🌐 [ENDPOINT TEST] Making HTTP request...')
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
      console.log('📡 [ENDPOINT TEST] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: duration + 'ms'
      })

      let responseData: any

      try {
        const responseText = await response.text()
        console.log('📄 [ENDPOINT TEST] Response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))
        responseData = responseText ? JSON.parse(responseText) : null
      } catch (parseError) {
        console.log('⚠️ [ENDPOINT TEST] Failed to parse response as JSON:', parseError)
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
        console.log(`✅ [ENDPOINT TEST] Test successful for: ${endpoint.name}`)
        console.log('📊 [ENDPOINT TEST] Returning success result:', testResult)
        return NextResponse.json({
          success: true,
          message: 'Endpoint test completed successfully',
          data: testResult,
        }, { headers: corsHeaders })
      } else {
        console.error(`❌ [ENDPOINT TEST] Test failed for: ${endpoint.name}`, {
          status: response.status,
          statusText: response.statusText,
          response: responseData
        })
        console.log('📊 [ENDPOINT TEST] Returning failure result:', testResult)
        return NextResponse.json({
          success: false,
          error: `Endpoint returned ${response.status}: ${response.statusText}`,
          data: testResult,
        }, { status: 400, headers: corsHeaders })
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`❌ [ENDPOINT TEST] HTTP request failed for: ${endpoint.name}`, {
        error: error.message,
        stack: error.stack,
        duration: duration + 'ms'
      })

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

  } catch (error: any) {
    console.error('❌ [ENDPOINT TEST] API error:', {
      error: error.message,
      stack: error.stack,
      endpointId: params.id
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}
