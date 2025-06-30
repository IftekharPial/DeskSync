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
const createPlatformSchema = z.object({
  name: z.string().min(1, 'Platform name is required').max(100, 'Platform name must be less than 100 characters'),
  isActive: z.boolean().default(true),
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

    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Only admins can access platform management
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const activeOnly = searchParams.get('activeOnly') === 'true'

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
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }
    if (activeOnly) {
      where.isActive = true
    }

    // Get platforms with pagination
    const [platforms, total] = await Promise.all([
      prisma.supportPlatform.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      }),
      prisma.supportPlatform.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        platforms,
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
    console.error('Platform list API error:', error)
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

    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Only admins can create platforms
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = createPlatformSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid platform data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    const { name, isActive } = validation.data

    // Check if platform name already exists
    const existingPlatform = await prisma.supportPlatform.findUnique({
      where: { name }
    })

    if (existingPlatform) {
      return NextResponse.json(
        { success: false, error: 'Platform name already exists' },
        { status: 409, headers: corsHeaders }
      )
    }

    // Create the platform
    const platform = await prisma.supportPlatform.create({
      data: {
        name,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: platform,
      message: 'Platform created successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Platform creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
