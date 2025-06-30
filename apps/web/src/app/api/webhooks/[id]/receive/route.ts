import { NextRequest, NextResponse } from 'next/server'
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

// Webhook meeting payload schema
const webhookMeetingPayloadSchema = z.object({
  meeting_id: z.string().optional(),
  meeting_title: z.string().min(1, 'Meeting title is required'),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  host_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
})

// Helper function to find user by host_id (email matching)
async function findUserByHostId(hostId: string) {
  if (!hostId) return null
  
  // Try to find user by email first
  const user = await prisma.user.findUnique({
    where: { email: hostId }
  })
  
  if (user) return user
  
  // If not found by email, try to find by name (case insensitive)
  const userByName = await prisma.user.findFirst({
    where: {
      name: {
        equals: hostId,
        mode: 'insensitive'
      }
    }
  })
  
  return userByName
}

// Helper function to send Slack notification
async function sendSlackNotification(meeting: any, user: any) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification')
      return
    }

    const message = {
      text: '📅 New Meeting Created',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📅 New Meeting Created*\n\n*Title:* ${meeting.title}\n*Start:* ${new Date(meeting.startTime).toLocaleString()}\n*Assigned To:* ${user ? `${user.name} (${user.email})` : 'Unassigned'}\n*Customer:* ${meeting.customerName || 'N/A'}`
          }
        }
      ]
    }

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText)
    } else {
      console.log('Slack notification sent successfully')
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify webhook exists and is active
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { 
        id: params.id,
        status: 'ACTIVE'
      }
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found or inactive' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get request details
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Log the payload for debugging (simplified logging)
    console.log('Webhook payload received:', {
      webhookId: webhook.id,
      payload: body,
      userAgent,
      ipAddress
    })

    // Validate the payload for meeting creation
    const validation = webhookMeetingPayloadSchema.safeParse(body)
    if (!validation.success) {
      console.warn('Invalid meeting payload received:', validation.error.errors)

      // Still log as successful reception but note validation failure
      return NextResponse.json({
        success: true,
        message: 'Payload received and logged',
        warning: 'Payload validation failed - not processed as meeting'
      }, { headers: corsHeaders })
    }

    const meetingData = validation.data

    // Find user by host_id
    let assignedUser = null
    let isAssigned = true

    if (meetingData.host_id) {
      assignedUser = await findUserByHostId(meetingData.host_id)
      if (!assignedUser) {
        isAssigned = false
        console.warn(`No user found for host_id: ${meetingData.host_id}`)
      }
    } else {
      isAssigned = false
      console.warn('No host_id provided in payload')
    }

    // Create meeting report
    const meeting = await prisma.meetingReport.create({
      data: {
        title: meetingData.meeting_title,
        startTime: new Date(meetingData.start_time),
        endTime: meetingData.end_time ? new Date(meetingData.end_time) : undefined,
        outcome: 'COMPLETED', // Default outcome
        customerName: meetingData.customer_name,
        customerEmail: meetingData.customer_email,
        hostId: meetingData.host_id,
        isAssigned,
        userId: assignedUser?.id || null,
        attendees: meetingData.customer_name ? [meetingData.customer_name] : [],
        actionItems: []
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Send Slack notification
    await sendSlackNotification(meeting, assignedUser)

    return NextResponse.json({
      success: true,
      message: 'Meeting created successfully',
      data: {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          startTime: meeting.startTime,
          isAssigned: meeting.isAssigned,
          assignedUser: assignedUser ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email
          } : null
        }
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Webhook receive API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
