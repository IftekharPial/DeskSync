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

// Validation schema
const updatePlatformSchema = z.object({
  name: z.string().min(1, 'Platform name is required').max(100, 'Platform name must be less than 100 characters').optional(),
  isActive: z.boolean().optional(),
})

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

    // Only admins can access platform management
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const platform = await prisma.supportPlatform.findUnique({
      where: { id: params.id }
    })

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: platform
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Platform get API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(
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

    // Only admins can update platforms
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = updatePlatformSchema.safeParse(body)
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

    // Check if platform exists
    const existingPlatform = await prisma.supportPlatform.findUnique({
      where: { id: params.id }
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // If updating name, check for duplicates
    if (validation.data.name && validation.data.name !== existingPlatform.name) {
      const duplicatePlatform = await prisma.supportPlatform.findUnique({
        where: { name: validation.data.name }
      })

      if (duplicatePlatform) {
        return NextResponse.json(
          { success: false, error: 'Platform name already exists' },
          { status: 409, headers: corsHeaders }
        )
      }
    }

    // Update the platform
    const platform = await prisma.supportPlatform.update({
      where: { id: params.id },
      data: validation.data
    })

    return NextResponse.json({
      success: true,
      data: platform,
      message: 'Platform updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Platform update API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(
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

    // Only admins can delete platforms
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Check if platform exists
    const existingPlatform = await prisma.supportPlatform.findUnique({
      where: { id: params.id }
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Instead of hard delete, we'll archive the platform
    const platform = await prisma.supportPlatform.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      data: platform,
      message: 'Platform archived successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Platform delete API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
