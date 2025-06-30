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
const platformReportSchema = z.object({
  platform: z.string().min(1, 'Platform name is required'),
  ticketsHandled: z.number().int().min(0, 'Tickets handled must be non-negative'),
})

const createDailyReportSchema = z.object({
  date: z.string().datetime(),
  ticketsResolved: z.number().int().min(0).default(0),
  chatsHandled: z.number().int().min(0).default(0),
  githubIssues: z.number().int().min(0).default(0),
  emailsProcessed: z.number().int().min(0).default(0),
  callsAttended: z.number().int().min(0).default(0),
  platformReports: z.array(platformReportSchema).optional(),
  notes: z.string().optional(),
  links: z.array(z.string().url()).default([]),
})

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Helper function to send Slack notification for daily report
async function sendDailyReportSlackNotification(report: any, user: any) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification')
      return
    }

    // Build platform summary
    let platformSummary = ''
    if (report.platformReports && Array.isArray(report.platformReports)) {
      platformSummary = report.platformReports
        .map((pr: any) => `${pr.platform}: ${pr.ticketsHandled} tickets`)
        .join('\n')
    }

    const message = {
      text: '📊 Daily Report Submitted',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📊 Daily Report by ${user.name} (${user.email})*\n\n*Date:* ${new Date(report.date).toLocaleDateString()}\n*Total Tickets:* ${report.ticketsResolved}\n*Chats:* ${report.chatsHandled}\n*GitHub Issues:* ${report.githubIssues}\n*Emails:* ${report.emailsProcessed}\n*Calls:* ${report.callsAttended}${platformSummary ? `\n\n*Platform Breakdown:*\n${platformSummary}` : ''}${report.notes ? `\n\n*Notes:* ${report.notes}` : ''}`
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
      console.log('Daily report Slack notification sent successfully')
    }
  } catch (error) {
    console.error('Error sending daily report Slack notification:', error)
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
    const userId = (session as any)?.user?.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userIdFilter = searchParams.get('userId')

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
    
    // Non-admin users can only see their own reports
    if (!isAdmin) {
      where.userId = userId
    } else if (userIdFilter) {
      where.userId = userIdFilter
    }

    // Date filtering
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Get reports with pagination
    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.dailyReport.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily reports list API error:', error)
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

    // Validate request body
    const validation = createDailyReportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid daily report data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const reportData = validation.data
    const reportDate = new Date(reportData.date)

    // Check if report already exists for this user and date
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        userId_date: {
          userId,
          date: reportDate
        }
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'Daily report already exists for this date' },
        { status: 409, headers: corsHeaders }
      )
    }

    // Create the daily report
    const report = await prisma.dailyReport.create({
      data: {
        date: reportDate,
        ticketsResolved: reportData.ticketsResolved,
        chatsHandled: reportData.chatsHandled,
        githubIssues: reportData.githubIssues,
        emailsProcessed: reportData.emailsProcessed,
        callsAttended: reportData.callsAttended,
        platformReports: reportData.platformReports || [],
        notes: reportData.notes,
        links: reportData.links,
        userId
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
    await sendDailyReportSlackNotification(report, report.user)

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Daily report created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily report creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
