import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, UserRole } from '@dailysync/database'
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
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.nativeEnum(UserRole).optional(),
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

    const { id } = params

    // Users can view their own profile, admins can view any profile
    const isAdmin = (session as any)?.user?.role === UserRole.ADMIN
    const isOwnProfile = (session as any)?.user?.id === id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            dailyReports: true,
            meetingReports: true,
            webhooks: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User get API error:', error)
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

    const { id } = params
    const body = await request.json()

    // Users can update their own profile (limited fields), admins can update any profile
    const isAdmin = (session as any)?.user?.role === UserRole.ADMIN
    const isOwnProfile = (session as any)?.user?.id === id

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Validate request body
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name
    }

    // Only admins can change role and isActive status
    if (isAdmin) {
      if (validation.data.role !== undefined) {
        updateData.role = validation.data.role
      }
      if (validation.data.isActive !== undefined) {
        updateData.isActive = validation.data.isActive
      }
    }

    // Update the user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User update API error:', error)
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

    // Only ADMIN users can delete users
    const isAdmin = (session as any)?.user?.role === UserRole.ADMIN
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403, headers: corsHeaders }
      )
    }

    const { id } = params

    // Prevent self-deletion
    if ((session as any)?.user?.id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Delete the user (this will cascade to related records)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User delete API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
