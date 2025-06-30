import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
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

    // Only admins can access user performance data
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Mock user performance data
    const mockData = [
      {
        userId: '1',
        name: 'John Doe',
        email: 'john.doe@dailysync.com',
        reportCount: 15,
        completionRate: 100,
        averageScore: 9.2,
        trend: 5
      },
      {
        userId: '2', 
        name: 'Jane Smith',
        email: 'jane.smith@dailysync.com',
        reportCount: 12,
        completionRate: 92,
        averageScore: 8.5,
        trend: -2
      },
      {
        userId: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@dailysync.com',
        reportCount: 18,
        completionRate: 95,
        averageScore: 8.8,
        trend: 8
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('User performance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
