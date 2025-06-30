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
const updateMessageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  template: z.string().min(1, 'Template content is required').optional(),
  variables: z.array(z.string()).optional(),
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

    // Get message template
    const messageTemplate = await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        incomingWebhook: {
          select: {
            id: true,
            name: true,
            url: true,
            userId: true,
          }
        }
      }
    })

    if (!messageTemplate) {
      return NextResponse.json(
        { success: false, error: 'Message template not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Check access permissions
    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin && messageTemplate.incomingWebhook.userId !== (session as any).user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: messageTemplate
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Message template get API error:', error)
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

    // Validate request body
    const validation = updateMessageTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid message template data',
          details: validation.error.errors
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if template exists and user has access
    const existingTemplate = await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        incomingWebhook: {
          select: {
            userId: true,
          }
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Message template not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin && existingTemplate.incomingWebhook.userId !== (session as any).user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Update the message template
    const messageTemplate = await prisma.messageTemplate.update({
      where: { id },
      data: validation.data,
      include: {
        incomingWebhook: {
          select: {
            id: true,
            name: true,
            url: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: messageTemplate,
      message: 'Message template updated successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Message template update API error:', error)
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

    const { id } = params

    // Check if template exists and user has access
    const existingTemplate = await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        incomingWebhook: {
          select: {
            userId: true,
          }
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Message template not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'
    if (!isAdmin && existingTemplate.incomingWebhook.userId !== (session as any).user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Delete the message template
    await prisma.messageTemplate.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Message template deleted successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Message template delete API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
