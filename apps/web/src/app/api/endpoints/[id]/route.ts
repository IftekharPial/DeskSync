import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@dailysync/database'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

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
        _count: {
          select: {
            deliveryLogs: true,
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

    // Non-admin users can only view their own webhook endpoints
    if (!isAdmin && endpoint.incomingWebhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      data: endpoint,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Endpoint GET error:', error)
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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    const endpoint = await prisma.outgoingEndpoint.findUnique({
      where: { id: params.id },
      include: {
        incomingWebhook: {
          select: {
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

    // Non-admin users can only update their own webhook endpoints
    if (!isAdmin && endpoint.incomingWebhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { name, url, method, headers, isActive, retryAttempts, retryDelayMs, timeoutMs } = body

    const updatedEndpoint = await prisma.outgoingEndpoint.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(method !== undefined && { method }),
        ...(headers !== undefined && { headers }),
        ...(isActive !== undefined && { isActive }),
        ...(retryAttempts !== undefined && { retryAttempts }),
        ...(retryDelayMs !== undefined && { retryDelayMs }),
        ...(timeoutMs !== undefined && { timeoutMs }),
      },
      include: {
        messageTemplate: true,
        _count: {
          select: {
            deliveryLogs: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedEndpoint,
      message: 'Endpoint updated successfully',
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Endpoint PUT error:', error)
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

    const userId = (session as any)?.user?.id
    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    const endpoint = await prisma.outgoingEndpoint.findUnique({
      where: { id: params.id },
      include: {
        incomingWebhook: {
          select: {
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

    // Non-admin users can only delete their own webhook endpoints
    if (!isAdmin && endpoint.incomingWebhook.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Access denied' },
        { status: 403, headers: corsHeaders }
      )
    }

    await prisma.outgoingEndpoint.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Endpoint deleted successfully',
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Endpoint DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
