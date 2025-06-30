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
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

const createMeetingReportSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format').optional(),
  outcome: z.enum(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']),
  notes: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  customerName: z.string().optional(),
  customerEmail: z.string().email('Invalid email format').optional(),
  hostId: z.string().optional(),
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const outcome = searchParams.get('outcome') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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
    
    // Filter by user (non-admin users can only see their own reports)
    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin) {
      where.userId = (session as any).user.id
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (outcome) {
      where.outcome = outcome
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate)
      }
    }

    // Get meeting reports with pagination
    const [meetingReports, total] = await Promise.all([
      prisma.meetingReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }),
      prisma.meetingReport.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: meetingReports,
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
    console.error('Meeting reports list API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
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
    const validation = createMeetingReportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid meeting report data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const { 
      title, 
      startTime, 
      endTime, 
      outcome, 
      notes, 
      attendees, 
      actionItems,
      customerName,
      customerEmail,
      hostId
    } = validation.data

    // Create the meeting report
    const meetingReport = await prisma.meetingReport.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        outcome,
        notes,
        attendees,
        actionItems,
        customerName,
        customerEmail,
        hostId,
        isAssigned: true,
        userId: (session as any).user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: meetingReport,
      message: 'Meeting report created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Meeting report creation API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
